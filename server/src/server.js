// ============================================
// CRITICAL: Load environment variables FIRST
// This MUST be at the very top before any other imports
// ============================================
require('dotenv').config();

// Verify JWT_SECRET is loaded
if (!process.env.JWT_SECRET) {
  console.error('CRITICAL ERROR: JWT_SECRET is not defined in .env file!');
  console.error('Please check that .env file exists in server root directory');
  process.exit(1);
}

const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const morgan       = require('morgan');
const logger       = require('./config/logger'); // F-14: Winston logger

// Import routes
const authRoutes        = require('./routes/authRoutes');
const bookRoutes        = require('./routes/bookRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

// Import middleware
const { errorHandler, notFound } = require('./middleware');

const app   = express();
const PORT  = process.env.PORT || 5000;
const isDev = process.env.NODE_ENV === 'development';

// ============================================
// F-04: SECURITY HEADERS — must be first
// ============================================
app.use(helmet({
  frameguard: { action: 'sameorigin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc:    ["'self'", 'https:'],
      objectSrc:  ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: process.env.NODE_ENV === 'production'
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
}));

// F-05: Parse cookies — must come after helmet, before routes
app.use(cookieParser());

// ============================================
// F-14: HTTP REQUEST LOGGING (Morgan → Winston)
// Replaces the manual console.log logger
// ============================================
const morganStream = { write: (message) => logger.info(message.trim()) };
app.use(morgan(
  isDev
    ? 'dev'
    : ':remote-addr :method :url :status :res[content-length] - :response-time ms',
  { stream: morganStream }
));

// ============================================
// F-03: RATE LIMITERS
// ============================================
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.',
    code: 'LOGIN_RATE_LIMIT_EXCEEDED',
  },
});

app.use('/api/', globalLimiter);
app.set('loginLimiter', loginLimiter);

// ============================================
// CORS — F-08: local network only in dev
// ============================================
const allowedOrigins = [
  'http://localhost:5173',
  'https://localhost:5173',
  'http://localhost:4173',
  'https://localhost:4173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (isDev) {
      const isLocalNetwork = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(origin);
      if (isLocalNetwork) return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) return callback(null, true);

    callback(new Error(`CORS blocked: ${origin} is not allowed`));
  },
  credentials: true,
}));

// ============================================
// BODY PARSERS — UPDATED: 2MB limit for base64 images
// Security: Still enforced at parser level, validated in controllers
// ============================================
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ============================================
// ROUTES
// ============================================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Lexora Library API is running!',
    ...(isDev && { version: '1.0.0', timestamp: new Date().toISOString() }),
  });
});

app.use('/api/auth',         authRoutes);
app.use('/api/books',        bookRoutes);
app.use('/api/transactions', transactionRoutes);

// ============================================
// ERROR HANDLING — must be after all routes
// ============================================
app.use(notFound);
app.use(errorHandler);

// ============================================
// START SERVER
// ============================================
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info('Lexora Library Management System started', {
    port:    PORT,
    env:     process.env.NODE_ENV || 'development',
    helmet:  'enabled',
    cookies: 'httpOnly JWT',
    limiter: 'login:10/15min, global:200/15min',
  });
  console.log('─────────────────────────────────────────');
  console.log('  Lexora Library Management System');
  console.log('─────────────────────────────────────────');
  console.log(`  Server  : http://localhost:${PORT}`);
  console.log(`  Env     : ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Helmet  : enabled`);
  console.log(`  Cookies : enabled (httpOnly JWT)`);
  console.log(`  Limiter : enabled (login: 10/15min, global: 200/15min)`);
  console.log(`  Logging : enabled (Winston + Morgan → logs/)`);
  console.log(`  Body    : 2MB limit (for base64 images)`);
  console.log(`  JWT     : ${process.env.JWT_SECRET ? 'loaded' : 'MISSING'}`);
  console.log('─────────────────────────────────────────');
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
process.on('SIGTERM', () => {
  logger.info('SIGTERM received — closing server gracefully');
  server.close(() => { logger.info('Server closed.'); process.exit(0); });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received — closing server gracefully');
  server.close(() => { logger.info('Server closed.'); process.exit(0); });
});

module.exports = app;