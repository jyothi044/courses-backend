require('dotenv').config(); // Load .env in local development

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const learnerRoutes = require('./routes/learner');
const adminRoutes = require('./routes/admin');

const app = express();

// ✅ Validate environment variables
const requiredEnv = ['MONGODB_URI', 'JWT_SECRET'];
requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing environment variable: ${key}`);
    process.exit(1);
  }
});

// ✅ CORS Configuration
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      process.env.FRONTEND_URL || 'https://courses-frontend-next.vercel.app',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ✅ Parse incoming JSON
app.use(express.json());

// ✅ Log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// ✅ Root route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to the Learning Platform API' });
});

// ✅ Favicon avoid 404s
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.get('/favicon.png', (req, res) => res.status(204).end());

// ✅ Test route
app
  .route('/api/test-methods')
  .get((req, res) => res.status(200).json({ message: 'GET request successful' }))
  .post((req, res) => res.status(200).json({ message: 'POST request successful', body: req.body }))
  .put((req, res) => res.status(200).json({ message: 'PUT request successful', body: req.body }))
  .delete((req, res) => res.status(200).json({ message: 'DELETE request successful' }));

// ✅ Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

connectDB().catch((err) => {
  console.error('❌ Failed to connect to MongoDB:', err.message);
  process.exit(1);
});

// ✅ API Routes
app.use('/api/auth', authRoutes);
app.use('/api/learner', learnerRoutes);
app.use('/api/admin', adminRoutes);

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: `Route ${req.method} ${req.originalUrl} not found`,
    suggestion: req.originalUrl.includes('/api/auth/register')
      ? 'Use POST for /api/auth/register with {email, password, role}'
      : 'Check the API documentation for valid routes',
  });
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Global error handler:', err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// ✅ Export for Vercel serverless
module.exports = app;
