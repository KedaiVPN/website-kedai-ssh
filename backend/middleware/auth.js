
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

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
const generateTokenForUser = (userId) => {
  return new Promise((resolve, reject) => {
    const sqlite3 = require('sqlite3').verbose();
    const path = require('path');
    const dbPath = path.join(__dirname, '..', 'database.db');
    const db = new sqlite3.Database(dbPath);
    
    db.get('SELECT id, username, email, role FROM users WHERE id = ?', [userId], (err, user) => {
      db.close();
      if (err) {
        reject(err);
      } else if (!user) {
        reject(new Error('User not found'));
      } else {
        const token = generateToken(user);
        resolve(token);
      }
    });
  });
};

module.exports = { authenticateToken, generateToken, generateTokenForUser };
