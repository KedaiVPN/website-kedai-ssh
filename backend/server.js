// Load environment variables from .env file at the very beginning
const dotenv = require('dotenv');
const path = require("path");
dotenv.config({ path: path.join(__dirname, '.env') });

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const { authenticateToken } = require("./middleware/auth");
const { verifyAdminToken } = require("./routes/adminAuth");

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Session configuration for Google OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-default-session-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', 
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Add logging for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, "dist")));

// Routes with proper authentication
app.use("/api/create", require("./routes/createAccount"));
app.use("/api/servers", authenticateToken, require("./routes/getServers"));
app.use("/api/accounts", require("./routes/getUserAccounts"));
app.use("/api/renew", require("./routes/renewAccount"));
app.use("/api/delete", require("./routes/deleteAccount"));
app.use("/api/admin", verifyAdminToken, require("./routes/admin"));
app.use("/api/admin-auth", require("./routes/adminAuth").router);
app.use("/api/auth", require("./routes/auth"));
app.use("/api/password-reset", require("./routes/passwordReset"));
app.use("/api/balance", require("./routes/balance"));
app.use("/api/topup", require("./routes/topup"));
app.use("/api/trial", require("./routes/trial"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/leaderboard", require("./routes/leaderboard"));

// Messaging routes
const messageRoutes = require("./routes/messages");
app.use("/api/admin/messages", verifyAdminToken, messageRoutes.adminRouter);
app.use("/api/messages", messageRoutes.router);

// Bug Host Injector routes
const bugRoutes = require("./routes/bugs");
app.use("/api/admin/bugs", verifyAdminToken, bugRoutes.adminRouter);
app.use("/api/bugs", bugRoutes.router);


// Catch-all for SPA (Single Page App)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Start the cleanup scheduler
const cleanupService = require('./services/cleanupService');
cleanupService.startCleanupScheduler();

app.listen(PORT, () => {
  console.log(`✅ Server aktif di http://localhost:${PORT}`);
  console.log(`💰 Balance system activated with fixed pricing per IP limit`);
  console.log(`💳 Topup system with Duitku payment gateway activated`);
  console.log(`🎁 Trial account system activated`);
  console.log(`🔐 Admin authentication system activated`);
  console.log(`🔑 Password reset system activated`);
});
