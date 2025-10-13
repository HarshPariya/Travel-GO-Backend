# Travel Agency Backend

A Node.js/Express API server for the Travel Agency application with MongoDB integration.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **MongoDB Atlas Setup:**
   
   Configure your MongoDB Atlas connection with environment variables (see `.env.example`).
   
   **Important:** Make sure your IP address is whitelisted in MongoDB Atlas:
   1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com/)
   2. Navigate to Network Access
   3. Add your current IP address or use 0.0.0.0/0 for development (not recommended for production)

3. **Environment Variables:**
   Create a `.env` file in the backend directory based on `.env.example`.

4. **Start the server:**
   ```bash
   npm run dev
   ```

## 📊 Database

The application will automatically:
- Connect to MongoDB
- Create the `travel-agency` database
- Seed sample tour data on first run
- Create necessary collections and indexes

### Collections
- `tours` - Tour information and details
- `bookings` - User bookings and reservations
- `users` - User accounts and authentication

## 🔗 API Endpoints

### Tours
- `GET /api/tours` - List all tours
- `GET /api/tours?featured=true` - List featured tours
- `GET /api/tours/:slug` - Get tour by slug

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings` - List user bookings (authenticated)

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (authenticated)
- `GET /api/auth/profile` - Get user profile with wishlist and bookings (authenticated)
- `PUT /api/auth/profile` - Update user profile (authenticated)
- `POST /api/auth/wishlist/:tourId` - Add tour to wishlist (authenticated)
- `DELETE /api/auth/wishlist/:tourId` - Remove tour from wishlist (authenticated)

### Google OAuth
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback

## 🛠️ Development

### Scripts
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run seed` - Manually seed database with sample data

### Database Management
- The server automatically seeds sample data on first run
- Use MongoDB Compass or similar tools to view/manage data
- Sample tours are loaded from `src/data/tours.sample.json`

## 🐳 Docker Setup (Optional)

```bash
# Start MongoDB with Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Start the backend
npm run dev
```

## 🔧 Troubleshooting

### MongoDB Atlas Connection Issues
1. **IP Address not whitelisted:**
   - Go to MongoDB Atlas Dashboard → Network Access
   - Add your current IP address
   - Or temporarily use 0.0.0.0/0 for development

2. **Authentication failed:**
   - Verify your MongoDB username and password
   - Check if user has proper database permissions

3. **Connection timeout:**
   - Check your internet connection
   - Verify cluster is running in Atlas dashboard
   - Try connecting from MongoDB Compass with same credentials

4. **Database not found:**
   - MongoDB Atlas will create the `travel-agency` database automatically
   - Check if the database name in URI matches your setup

### Common Issues
- **Port already in use:** Change `PORT` in `.env` file
- **JWT errors:** Ensure `JWT_SECRET` is set in `.env`
- **CORS issues:** Check frontend URL in CORS configuration

## 📝 Environment Variables

See `.env.example` for the required variables. Do not commit real secrets.

## 🚀 Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Use MongoDB Atlas or managed MongoDB service
4. Set up proper CORS origins
5. Use environment variables for all configuration
