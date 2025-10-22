// ==================== ENV SETUP ====================
const dotenv = require('dotenv');
const path = require("path");
dotenv.config({ path: path.join(__dirname, '.env') });

// ==================== IMPORT LIBRARY ====================
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const MySQLStore = require('express-mysql-session')(session);
const passport = require("passport");
const fs = require('fs');
const rateLimit = require("express-rate-limit");
const { authenticateToken } = require("./middleware/auth");
const { verifyAdminToken } = require("./routes/adminAuth");
const { securityLogger, logStream } = require('./middleware/securityLogger');

const app = express();
const PORT = process.env.PORT || 3001;

// ==================== BASIC MIDDLEWARE ====================
app.use(cors());
app.use(express.json());

// ==================== TRUST PROXY UNTUK CLOUDFLARE ====================
// ❌ app.set('trust proxy', true);
app.set('trust proxy', 1);


// ==================== DATABASE SESSION CONFIG ====================
const dbOptions = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
};

const sessionStore = new MySQLStore({
  expiration: 86400000,
  createDatabaseTable: true,
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data'
    }
  },
  ...dbOptions
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-default-session-secret-key',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// ==================== PASSPORT INIT ====================
app.use(passport.initialize());
app.use(passport.session());

// ==================== SECURITY LOG SETUP ====================
// logStream is now imported from securityLogger.js to avoid redeclaration

// ==================== RATE LIMITING SETUP ====================
// Limit untuk endpoint sensitif
const sensitiveLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 5, // maksimal 5 request per menit per IP
  message: {
    success: false,
    message: "Terlalu banyak permintaan dalam waktu singkat. Coba lagi nanti."
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    const userIdentifier = req.user ? `USER (${req.user.email} | ${req.user.username})` : 'USER (Guest)';
    const logLine = `[${new Date().toISOString()}] ⚠️ RATE-LIMITED: ${userIdentifier} from IP ${ip} → ${req.method} ${req.originalUrl}\n`;
    logStream.write(logLine); // Re-use the exported logStream
    console.log(`[SECURITY LOG] ${logLine.trim()}`);
    res.status(options.statusCode).json(options.message);
  }
});


// ==================== STATIC FRONTEND ====================
app.use(express.static(path.join(__dirname, "dist")));

// ==================== ROUTES ====================
// Terapkan rate limit dan logger hanya pada route sensitif
app.use("/api/auth", sensitiveLimiter, securityLogger, require("./routes/auth"));
app.use("/api/create", sensitiveLimiter, authenticateToken, securityLogger, require("./routes/createAccount"));
app.use("/api/trial", sensitiveLimiter, authenticateToken, securityLogger, require("./routes/trial"));
app.use("/api/reset", sensitiveLimiter, securityLogger); // jika ada route reset

// Route lain tetap normal
app.use("/api/servers", authenticateToken, require("./routes/getServers"));
app.use("/api/accounts", require("./routes/getUserAccounts"));
app.use("/api/renew", require("./routes/renewAccount"));
app.use("/api/delete", require("./routes/deleteAccount"));
app.use("/api/admin", verifyAdminToken, require("./routes/admin"));
app.use("/api/admin-auth", require("./routes/adminAuth").router);
app.use("/api/balance", require("./routes/balance"));
app.use("/api/topup", require("./routes/topup"));
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

// XL Paket routes
const xlRoutes = require("./routes/xl");
const xlAdminRoutes = require("./routes/xlAdmin");
app.use("/api/xl", xlRoutes);
app.use("/api/xl/admin", xlAdminRoutes);

// DigitalOcean routes
const digitalOceanRoutes = require("./routes/digitalocean");
app.use("/api/digitalocean", verifyAdminToken, digitalOceanRoutes);

// ==================== SPA FALLBACK ====================
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// ==================== CLEANUP SCHEDULER ====================
const cleanupService = require('./services/cleanupService');
cleanupService.startCleanupScheduler();

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`✅ Server aktif di http://localhost:${PORT}`);
  console.log(`🔐 Security log aktif (tersimpan di security.log)`);
  console.log(`🚫 Rate limiting aktif di endpoint sensitif`);
  console.log(`💰 Balance system active`);
  console.log(`🎁 Trial system active`);
});
