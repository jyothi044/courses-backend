const jwt = require('jsonwebtoken');

const JWT_SECRET = 'process.env.JWT_SECRET';

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