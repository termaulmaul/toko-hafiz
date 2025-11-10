const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Mock user database - in production, use real database
const users = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',  // In production, use bcrypt hashed passwords
    role: 'admin'
  },
  {
    id: 2,
    username: 'user',
    password: 'user123',
    role: 'user'
  }
];

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-min-32-chars-long';

/**
 * POST /api/auth/login
 * Login endpoint - returns JWT token
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password required',
      timestamp: new Date().toISOString()
    });
  }

  // Find user
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid username or password',
      timestamp: new Date().toISOString()
    });
  }

  // Generate JWT token
  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    },
    message: 'Login successful',
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/auth/verify
 * Verify token endpoint
 */
router.post('/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({
      success: true,
      data: decoded,
      message: 'Token valid',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh token endpoint
 */
router.post('/refresh', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided',
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Verify with ignoreExpiration to check if token exists
    const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });

    // Generate new token
    const newToken = jwt.sign(
      {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: { token: newToken },
      message: 'Token refreshed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = { router, JWT_SECRET };
