const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  isValidAdmin,
  generateToken,
  authenticateToken,
} = require('../middleware/auth');

const router = express.Router();

// Login route
router.post(
  '/login',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('Username must be between 3 and 20 characters'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { username, password } = req.body;

      // Validate admin credentials
      if (!isValidAdmin(username, password)) {
        return res.status(401).json({
          message: 'Invalid credentials',
        });
      }

      // Generate JWT token
      const token = generateToken({
        username,
        role: 'admin',
        iat: Math.floor(Date.now() / 1000),
      });

      res.json({
        message: 'Login successful',
        token,
        user: {
          username,
          role: 'admin',
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        message: 'Internal server error during login',
      });
    }
  }
);

// Verify token route
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    message: 'Token is valid',
    user: {
      username: req.user.username,
      role: req.user.role,
    },
  });
});

// Logout route (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    message: 'Logout successful. Please remove the token from client storage.',
  });
});

module.exports = router;
