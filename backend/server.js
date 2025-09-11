
const express = require("express");
const path = require("path");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const { authenticateToken } = require("./middleware/auth");
const { verifyAdminToken } = require("./routes/adminAuth");
const { sessionSecret } = require('./config');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Session configuration for Google OAuth
app.use(session({
  secret: sessionSecret,
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
app.use("/api/create", require("./routes/createAccount")); // Now uses auth middleware and balance system
app.use("/api/servers", authenticateToken, require("./routes/getServers"));
app.use("/api/accounts", require("./routes/getUserAccounts"));
app.use("/api/renew", require("./routes/renewAccount"));
app.use("/api/delete", require("./routes/deleteAccount"));
app.use("/api/admin", verifyAdminToken, require("./routes/admin")); // SECURED
app.use("/api/admin-auth", require("./routes/adminAuth").router); // Use the router property
app.use("/api/auth", require("./routes/auth"));
app.use("/api/auth", require("./routes/passwordReset")); // Add password reset routes
app.use("/api/balance", require("./routes/balance")); // New balance routes
app.use("/api/topup", require("./routes/topup")); // New topup routes
app.use("/api/trial", require("./routes/trial")); // New trial routes
app.use("/api/profile", require("./routes/profile")); // New profile routes

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
