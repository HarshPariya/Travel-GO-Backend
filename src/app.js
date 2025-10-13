import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import passport from 'passport';
import authRoutes from './routes/authRoutes.js';
import tourRoutes from './routes/tourRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/error.js';
import './config/passport.js';

const app = express();

// Enhanced CORS configuration for mobile and cross-origin support
// You can provide a comma-separated list via ALLOWED_ORIGINS or CLIENT_BASE_URLS
const envOrigins = (process.env.ALLOWED_ORIGINS || process.env.CLIENT_BASE_URLS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const clientOrigins = Array.from(new Set([
  process.env.CLIENT_BASE_URL || 'http://localhost:3000',
  ...envOrigins,
  'http://localhost:3001',
  'https://travelgo-by-hp01.netlify.app'
]));

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (clientOrigins.includes(origin)) return callback(null, true);
    const allowedPatterns = [
      /^https?:\/\/.*--.*\.netlify\.app$/i,
      /^https?:\/\/.+\.vercel\.app$/i,
    ];
    if (allowedPatterns.some((re) => re.test(origin))) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Enhanced security headers for mobile compatibility
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.mapbox.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// Note: Compression and rate limiting temporarily disabled for compatibility
// Will be re-enabled once dependencies are properly installed

// Enhanced JSON parsing with better error handling
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ error: 'Invalid JSON payload' });
      throw new Error('Invalid JSON');
    }
  }
}));

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced logging for mobile debugging
app.use(morgan('combined', {
  skip: (req, res) => res.statusCode < 400,
  stream: process.stdout
}));

app.use(passport.initialize());

// Redirect root to frontend website so users see the UI instead of API JSON
app.get('/', (req, res) => {
  res.redirect(302, process.env.CLIENT_BASE_URL || 'https://travelgo-by-hp01.netlify.app/');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/bookings', bookingRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

