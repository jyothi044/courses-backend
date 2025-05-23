const jwt = require('jsonwebtoken');

const JWT_SECRET = '8a7f9c2b1e3d4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f';

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    console.log('Authenticated user:', req.user.userId);
    next();
  } catch (error) {
    console.error('Token verification error:', {
      message: error.message,
      stack: error.stack
    });
    res.status(401).json({ message: 'Token is not valid' });
  }
};