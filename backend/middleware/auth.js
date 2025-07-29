const jwt = require("jsonwebtoken");
const { dbUtils } = require("../config/database");

// Verify JWT token middleware
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access token is required"
      });
    }

    const token = authHeader.split(" ")[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format"
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
    
    // Get user from database
    const user = await dbUtils.get(
      "SELECT id, username, email, role, is_active FROM users WHERE id = ?",
      [decoded.id]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated"
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Token expired"
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Token verification failed"
    });
  }
};

// Verify admin role middleware
const verifyAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      });
    }

    next();
  } catch (error) {
    console.error("Admin verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Authorization verification failed"
    });
  }
};

module.exports = {
  verifyToken,
  verifyAdmin
};