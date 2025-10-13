# Backend Setup Instructions

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

## Configuration

### MongoDB Connection
The app will automatically try to connect to MongoDB Atlas. If the connection fails, it will fall back to an in-memory database for development.

Configure your connection using `MONGODB_URI` in `.env` (see `.env.example`).

### Port Configuration
- Default port: `4000`
- If port is in use, the server will automatically try the next available port
- Frontend default API base: `http://localhost:4000/api`

## Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run seed` - Seed database with sample data

## API Endpoints

- `GET /api/tours` - List all tours
- `GET /api/tours/stats` - Get tour statistics
- `GET /api/tours/:slug` - Get specific tour
- `GET /api/tours/:slug/availability` - Get tour availability
- `POST /api/bookings` - Create booking
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

## Troubleshooting

### Port Already in Use
If you get `EADDRINUSE` error, the server will automatically try the next available port.

### MongoDB Connection Issues
- Check your internet connection
- Verify MongoDB Atlas cluster is running
- Ensure IP address is whitelisted in Atlas
- The app will fall back to in-memory database if Atlas is unavailable

### Missing Dependencies
Run `npm install` to install all required packages including:
- compression
- express-rate-limit
- All other dependencies
