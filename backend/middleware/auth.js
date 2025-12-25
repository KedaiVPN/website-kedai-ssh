
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config');
const pool = require('../db/connection');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Real-time check against the database
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.is_locked) {
      return res.status(403).json({ success: false, message: 'Akun Anda telah diblokir.' });
    }

    // Attach full, fresh user object to the request
    req.user = user;
    next();
  } catch (err) {
    console.error('Token verification or user check error:', err);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(403).json({ success: false, message: 'Invalid token' });
  }
};

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role || 'member'
  }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN || '7d' });
};

// Helper function to generate token for user by userId (fetch latest user data from DB)
const generateTokenForUser = async (userId) => {
  const [rows] = await pool.query('SELECT id, username, email, role FROM users WHERE id = ?', [userId]);
  const user = rows[0];

  if (!user) {
    throw new Error('User not found');
  }

  return generateToken(user);
};

module.exports = { authenticateToken, generateToken, generateTokenForUser };
