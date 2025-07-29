const express = require("express");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

// Initialize database
const { initDatabase } = require("./config/database");

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database on startup
initDatabase().then(() => {
  console.log("✅ Database initialized successfully");
}).catch(err => {
  console.error("❌ Database initialization failed:", err);
  process.exit(1);
});

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:8080",
  credentials: true
}));
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, "dist")));

// API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/create", require("./routes/createAccount"));
app.use("/api/servers", require("./routes/getServers"));
app.use("/api/admin", require("./routes/admin"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Catch-all for SPA (Single Page App)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server aktif di http://localhost:${PORT}`);
});
