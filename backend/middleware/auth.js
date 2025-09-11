const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config'); // Use centralized config
const pool = require('../db/connection');   // Use MySQL pool

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, jwtSecret, (err, user) => { // Use imported jwtSecret
    if (err) {
      console.error('Token verification error:', err);
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      return res.status(403).json({
        success: false,
        message: 'Invalid token'
      });
    }

    req.user = user;
    next();
  });
};

const generateToken = (user) => {
  return jwt.sign({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role || 'member'
  }, jwtSecret, { expiresIn: '7d' }); // Use imported jwtSecret
};

// Fixed to use MySQL and be async
const generateTokenForUser = async (userId) => {
  const [rows] = await pool.execute('SELECT id, username, email, role FROM users WHERE id = ?', [userId]);
  const user = rows[0];

  if (!user) {
    throw new Error('User not found when trying to generate token');
  }

  return generateToken(user);
};

module.exports = { authenticateToken, generateToken, generateTokenForUser };
