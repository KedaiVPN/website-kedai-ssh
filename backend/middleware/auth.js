
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Token verification error:', err);
      
      // Handle token expiration specifically
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      // Handle other JWT errors
      return res.status(403).json({
        success: false,
        message: 'Invalid token'
      });
    }

    req.user = user;
    next();
  });
};

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role || 'member'
  }, JWT_SECRET, { expiresIn: '7d' });
};

// Helper function to generate token for user by userId (fetch latest user data from DB)
const pool = require('../db/connection');

const generateTokenForUser = async (userId) => {
  const [rows] = await pool.query('SELECT id, username, email, role FROM users WHERE id = ?', [userId]);
  const user = rows[0];

  if (!user) {
    throw new Error('User not found');
  }

  return generateToken(user);
};

module.exports = { authenticateToken, generateToken, generateTokenForUser };
