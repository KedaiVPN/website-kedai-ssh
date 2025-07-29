const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, "dist")));

// Routes
app.use("/api/create", require("./routes/createAccount"));
app.use("/api/servers", require("./routes/getServers"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/auth", require("./routes/auth"));

// Catch-all for SPA (Single Page App)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server aktif di http://localhost:${PORT}`);
});