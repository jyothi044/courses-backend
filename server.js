require('dotenv').config(); // Only for local development
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const learnerRoutes = require('./routes/learner');
const adminRoutes = require('./routes/admin');

const app = express();

// Check for required environment variables
const requiredEnv = ['MONGODB_URI', 'JWT_SECRET'];
requiredEnv.forEach((env) => {
  if (!process.env[env]) {
    console.error(`Missing environment variable: ${env}`);
    process.exit(1);
  }
});

// Middleware
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      process.env.FRONTEND_URL || 'https://your-frontend.vercel.app',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

// Request logging for debugging
app.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.url}`);
  next();
});

// Root route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to the Learning Platform API' });
});

// Favicon routes to prevent 404 errors
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.get('/favicon.png', (req, res) => res.status(204).end());

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Connect to DB before handling requests
connectDB().catch((error) => {
  console.error('Failed to connect to MongoDB:', error.message);
  process.exit(1);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/learner', learnerRoutes);
app.use('/api/admin', adminRoutes);

// Catch-all route for undefined routes
app.use((req, res) => {
  res.status(404).json({
    message: `Route ${req.method} ${req.originalUrl} not found`,
    suggestion: req.originalUrl.includes('/api/auth/register')
      ? 'Use POST for /api/auth/register with {email, password, role}'
      : 'Check the API documentation for valid routes'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Export for Vercel serverless
module.exports = app;