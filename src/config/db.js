import mongoose from 'mongoose';

let isConnected = false;

function maskMongoUri(uri) {
	try {
		if (!uri) return '';
		// Hide credentials between scheme and host
		// e.g., mongodb+srv://user:pass@host/db -> mongodb+srv://***@host/db
		return uri.replace(/(mongodb(?:\+srv)?:\/\/)([^@]+)@/i, '$1***@');
	} catch {
		return '***';
	}
}

export async function connectToDatabase() {
	if (isConnected) {
		console.log('MongoDB already connected');
		return;
	}

	// Resolve and validate MongoDB URI
	const envUriRaw = process.env.MONGODB_URI ? String(process.env.MONGODB_URI).trim() : '';
	const hasValidScheme = envUriRaw.startsWith('mongodb://') || envUriRaw.startsWith('mongodb+srv://');
	const looksPlaceholder = /<\s*username\s*>|<\s*password\s*>|<\s*cluster\s*>/i.test(envUriRaw) || /<.*>/.test(envUriRaw);
	const shouldAttemptAtlas = hasValidScheme && !looksPlaceholder;

	try {
		if (!shouldAttemptAtlas) {
			if (envUriRaw && !hasValidScheme) {
				console.warn('⚠️ Ignoring malformed MONGODB_URI env var.');
			}
			console.log('🔄 No valid MongoDB URI provided. Using in-memory database for development...');
			const { MongoMemoryServer } = await import('mongodb-memory-server');
			const mongod = await MongoMemoryServer.create();
			const fallbackUri = mongod.getUri();
			await mongoose.connect(fallbackUri);
			isConnected = true;
			console.log('✅ Connected to in-memory MongoDB for development');
			return;
		}

		console.log('Connecting to MongoDB...');
		mongoose.set('strictQuery', false);

		await mongoose.connect(envUriRaw, {
			autoIndex: true,
			maxPoolSize: 10,
			serverSelectionTimeoutMS: 5000,
			socketTimeoutMS: 45000,
			bufferCommands: false
		});

		isConnected = true;
		console.log('✅ MongoDB connected successfully');
		console.log(`📊 Database: ${mongoose.connection.name}`);
		if (mongoose.connection.host) {
			const hostPort = mongoose.connection.port ? `${mongoose.connection.host}:${mongoose.connection.port}` : mongoose.connection.host;
			console.log(`🌐 Host: ${hostPort}`);
		}

		mongoose.connection.on('error', (err) => {
			console.error('❌ MongoDB connection error:', err);
		});

		mongoose.connection.on('disconnected', () => {
			console.log('⚠️ MongoDB disconnected');
			isConnected = false;
		});

		mongoose.connection.on('reconnected', () => {
			console.log('🔄 MongoDB reconnected');
			isConnected = true;
		});
	} catch (error) {
		console.error('❌ Failed to connect to MongoDB:', error.message);
		if (process.env.MONGODB_URI) {
			console.error('Provided MONGODB_URI:', maskMongoUri(process.env.MONGODB_URI));
		}
		console.log('\n💡 Troubleshooting tips:');
		console.log('   - Check your internet connection');
		console.log('   - Verify MongoDB Atlas cluster is running');
		console.log('   - Ensure IP address is whitelisted in Atlas');
		console.log('   - Check username/password in connection string');
		console.log('   - Verify database name in connection string');
		console.log('\n🔗 MongoDB Atlas Dashboard: https://cloud.mongodb.com/');
		console.log('\n🔄 Falling back to in-memory database for development...');

		const { MongoMemoryServer } = await import('mongodb-memory-server');
		const mongod = await MongoMemoryServer.create();
		const fallbackUri = mongod.getUri();
		await mongoose.connect(fallbackUri);
		isConnected = true;
		console.log('✅ Connected to in-memory MongoDB for development');
	}
}

export async function disconnectDatabase() {
	if (isConnected) {
		await mongoose.connection.close();
		isConnected = false;
		console.log('🔌 MongoDB disconnected');
	}
}

