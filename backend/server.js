require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// Database initialization
const { initDatabase } = require("./config/database");

// Import routes
const authRouter = require("./routes/auth");
const vpnRouter = require("./routes/vpn");
const adminRouter = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
initDatabase();

// Trust proxy configuration for production (handles X-Forwarded-For header)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', true);
}

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

// Rate limiting with proxy support
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  trustProxy: process.env.NODE_ENV === 'production'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:8080',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/vpn", vpnRouter);
app.use("/api/admin", adminRouter);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0"
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  // Catch-all handler for SPA
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ 
      success: false, 
      message: "Invalid JSON format" 
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? "Internal server error" 
      : err.message
  });
});

// 404 handler for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found"
  });
});

app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});
