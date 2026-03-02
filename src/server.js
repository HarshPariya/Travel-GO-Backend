import 'dotenv/config';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import app from './app-simple.js';
import { connectToDatabase, disconnectDatabase } from './config/db.js';
import Tour from './models/Tour.js';

const port = process.env.PORT || 4000;

async function startServer() {
  try {
    console.log('🚀 Starting Travel Agency API Server...');
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);

    // debug configuration
    console.log('🔧 FRONTEND_URL=', process.env.FRONTEND_URL);
    console.log('🔧 CLIENT_BASE_URL=', process.env.CLIENT_BASE_URL);
    console.log('🔧 GOOGLE_CALLBACK_URL=', process.env.GOOGLE_CALLBACK_URL);

    if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.endsWith('/auth')) {
      console.warn('⚠️ FRONTEND_URL ends with /auth; remove that suffix to avoid duplicated paths.');
    }
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.GOOGLE_CALLBACK_URL &&
      process.env.GOOGLE_CALLBACK_URL.includes('localhost')
    ) {
      console.warn('⚠️ GOOGLE_CALLBACK_URL still points to localhost in production!');
    }

    // Connect to MongoDB
    await connectToDatabase();
    
    // Seed sample data if needed
    await ensureSampleData();
    
    // Start HTTP server with better error handling
    const server = http.createServer(app);
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`❌ Port ${port} is already in use. Trying port ${port + 1}...`);
        const newPort = port + 1;
        server.listen(newPort, () => {
          console.log(`\n🎉 API Server is running on port ${newPort}!`);
          console.log(`🌐 Local: http://localhost:${newPort}`);
          console.log(`📚 API Docs: http://localhost:${newPort}/api`);
          console.log(`\n📊 Available endpoints:`);
          console.log(`   GET  /api/tours - List all tours`);
          console.log(`   GET  /api/tours/:slug - Get tour by slug`);
          console.log(`   POST /api/bookings - Create booking`);
          console.log(`   POST /api/auth/register - User registration`);
          console.log(`   POST /api/auth/login - User login`);
        });
      } else {
        console.error('❌ Server error:', err);
        process.exit(1);
      }
    });
    
    server.listen(port, () => {
      console.log(`\n🎉 API Server is running!`);
      console.log(`🌐 Local: http://localhost:${port}`);
      console.log(`📚 API Docs: http://localhost:${port}/api`);
      console.log(`\n📊 Available endpoints:`);
      console.log(`   GET  /api/tours - List all tours`);
      console.log(`   GET  /api/tours/:slug - Get tour by slug`);
      console.log(`   POST /api/bookings - Create booking`);
      console.log(`   POST /api/auth/register - User registration`);
      console.log(`   POST /api/auth/login - User login`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log('🔌 HTTP server closed');
        await disconnectDatabase();
        console.log('✅ Server shutdown complete');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (err) => {
      console.error('❌ Unhandled Rejection:', err);
      process.exit(1);
    });

    process.on('uncaughtException', (err) => {
      console.error('❌ Uncaught Exception:', err);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

async function ensureSampleData() {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const samplePath = path.join(__dirname, './data/tours.sample.json');

    if (!fs.existsSync(samplePath)) {
      console.warn('⚠️ Sample data file not found');
      return;
    }

    const sample = JSON.parse(fs.readFileSync(samplePath, 'utf8'));

    let upserted = 0;
    let updated = 0;

    for (const item of sample) {
      const result = await Tour.updateOne(
        { slug: item.slug },
        { $set: item },
        { upsert: true }
      );
      if (result.upsertedCount && result.upsertedCount > 0) upserted += 1;
      else if (result.modifiedCount && result.modifiedCount > 0) updated += 1;
    }

    const total = await Tour.countDocuments();
    console.log(`✅ Sample sync complete. Upserted: ${upserted}, Updated: ${updated}, Total in DB: ${total}`);
  } catch (error) {
    console.warn('⚠️ Could not sync sample tours:', error.message);
  }
}

