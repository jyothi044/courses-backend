// routes/auth.js
const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');

// Common validation handler
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    return res.status(400).json({ message: `Validation failed: ${errorMessages}`, errors: errors.array() });
  }
  next();
};

// Register route
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match'),
  body('role').optional().isIn(['admin', 'learner']).withMessage('Role must be either admin or learner'),
  validateRequest
], register);

// Fix: Prevent accidental GET call to /register
router.get('/register', (req, res) => {
  res.status(405).json({
    message: 'GET not allowed on /register. Use POST instead.',
    suggestion: 'Use POST for /api/auth/register with {email, password, confirmPassword, role}'
  });
});

// Login route
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  validateRequest
], login);

// Token verification route
router.get('/verify', authMiddleware, (req, res) => {
  res.status(200).json({ message: 'Token is valid', user: req.user });
});

// Optional: diagnostic route
router.get('/routes', (req, res) => {
  res.json({
    available: {
      POST: ['/register', '/login'],
      GET: ['/verify']
    }
  });
});

module.exports = router;
