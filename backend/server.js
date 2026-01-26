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
const figlet = require('figlet');
const chalk = require('chalk');
const boxen = require('boxen');
const { authenticateToken } = require("./middleware/auth");
const { verifyAdminToken } = require("./routes/adminAuth");
const { securityLogger, logStream } = require('./middleware/securityLogger');
const methodOverride = require('method-override');

const app = express();
const PORT = process.env.PORT || 3001;

// ==================== BASIC MIDDLEWARE ====================
app.use(cors());
app.use(express.json({
  limit: '50mb',
  verify: (req, res, buf, encoding) => {
    if (buf && buf.length) {
      req.rawBody = buf.toString(encoding || 'utf8');
    }
  },
}));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ==================== METHOD OVERRIDE MIDDLEWARE ====================
// Cek _method di body request untuk override method (misal: POST -> PUT)
app.use(methodOverride('_method'));


// ==================== TRUST PROXY UNTUK CLOUDFLARE ====================
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
    httpOnly: true,           // Cegah akses cookie lewat JS (aman dari XSS)
    sameSite: 'lax',          // Atur ke 'none' jika frontend beda domain
    maxAge: 24 * 60 * 60 * 1000 // 1 hari
  }
}));

// ==================== PASSPORT INIT ====================
app.use(passport.initialize());
app.use(passport.session());

// ==================== RATE LIMITING SETUP ====================
const sensitiveLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
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
    logStream.write(logLine);
    console.log(`[SECURITY LOG] ${logLine.trim()}`);
    res.status(options.statusCode).json(options.message);
  }
});

// ==================== STATIC FRONTEND ====================
// Sajikan file statis dari direktori 'dist' (hasil build frontend)
app.use(express.static(path.join(__dirname, "dist")));
// Sajikan file yang diunggah dari direktori 'public/uploads' melalui rute '/uploads'
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Sitemap
app.use('/sitemap.xml', require('./routes/sitemap'));

// ==================== ROUTES ====================
app.use("/api/auth", sensitiveLimiter, securityLogger, require("./routes/auth"));
app.use("/api/create", sensitiveLimiter, authenticateToken, securityLogger, require("./routes/createAccount"));
app.use("/api/trial", sensitiveLimiter, authenticateToken, securityLogger, require("./routes/trial"));
app.use("/api/reset", sensitiveLimiter, securityLogger);

app.use("/api/servers", authenticateToken, require("./routes/getServers"));
app.use("/api/accounts", require("./routes/getUserAccounts"));
app.use("/api/renew", require("./routes/renewAccount"));
app.use("/api/delete", require("./routes/deleteAccount"));
app.use("/api/admin", verifyAdminToken, require("./routes/admin"));
app.use("/api/admin-auth", require("./routes/adminAuth").router);
app.use("/api/balance", require("./routes/balance"));
app.use("/api/public-stats", require("./routes/publicStats"));
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

// Blog/Article routes
app.use("/api/articles", require("./routes/articles"));

// Proxy routes
app.use("/api/proxy", require("./routes/proxy"));

// Digiflazz (Game Topup) routes
app.use("/api/digiflazz", require("./routes/digiflazz"));

// Game Brand Images routes (Admin)
app.use("/api/admin/game-brands", verifyAdminToken, require("./routes/gameBrands"));

// Game Topup Banner routes
const bannerRoutes = require("./routes/gameBanners");
app.use("/api/admin/banners", verifyAdminToken, bannerRoutes.adminRouter);
app.use("/api/banners", bannerRoutes.router);

// Other Products routes
const otherProductRoutes = require("./routes/otherProducts");
app.use("/api/admin/other-products", verifyAdminToken, otherProductRoutes.adminRouter);
app.use("/api/other-products", authenticateToken, otherProductRoutes.router);


// ==================== SCHEDULERS INITIALIZATION ====================
const cleanupService = require('./services/cleanupService');
cleanupService.startCleanupScheduler();
const { startScheduledPurchaseCron } = require('./services/scheduledPurchaseService');
startScheduledPurchaseCron();
const { initializeAutoSync } = require('./services/autoSyncService');
initializeAutoSync();


// ==================== SPA FALLBACK ====================
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// ==================== START SERVER (KEDAI SSH TERMINAL STYLE) ====================
app.listen(PORT, () => {
  const boxen = require("boxen");
  const figlet = require("figlet");

  // ==================== TAMPILAN HEADER TERMINAL ====================
  const logo = figlet.textSync("KEDAI SSH", {
    font: "ANSI Shadow", // coba juga "Slant" atau "Standard"
    horizontalLayout: "default",
    verticalLayout: "default"
  });

  console.clear(); // biar tampilan bersih
  console.log(chalk.cyanBright(logo)); // tampilkan teks besar

  // ==================== INFO STATUS ====================
  const statusBox = boxen(
    `
✅  Server aktif: http://localhost:${PORT}
🔐 Security log: security.log
🚫 Rate limiting: Active on sensitive routes
💰 Balance system: Active
🎁 Trial system: Active
`,
    {
      padding: 1,
      borderColor: "cyan",
      borderStyle: "round",
      title: chalk.bold.cyan("KEDAI SSH"),
      titleAlignment: "center",
    }
  );

  console.log(statusBox);
  console.log(chalk.greenBright("✨  KEDAI SSH — Secure Premium Account Platform ✨\n"));
});

