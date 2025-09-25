const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Simple admin user check (for now we'll use env variables)
const isValidAdmin = (username, password) => {
  return (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  );
};

// Hash password utility
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

// Compare password utility
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// JWT verification middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      message: 'Access token is missing or invalid',
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        message: 'Token is invalid or expired',
      });
    }

    req.user = decoded;
    next();
  });
};

// Admin-only middleware
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Admin access required',
    });
  }
  next();
};

module.exports = {
  isValidAdmin,
  hashPassword,
  comparePassword,
  generateToken,
  authenticateToken,
  requireAdmin,
};
