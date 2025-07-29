const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { dbUtils } = require("../config/database");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

// Passport configuration
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    
    // Check if user exists
    let user = await dbUtils.get("SELECT * FROM users WHERE email = ?", [email]);
    
    if (user) {
      return done(null, user);
    } else {
      // Create new user
      const result = await dbUtils.run(
        "INSERT INTO users (username, email, auth_provider) VALUES (?, ?, ?)",
        [profile.displayName, email, "google"]
      );
      
      user = await dbUtils.get("SELECT * FROM users WHERE id = ?", [result.lastID]);
      return done(null, user);
    }
  } catch (error) {
    return done(error, null);
  }
}));

router.use(passport.initialize());

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      username: user.username,
      role: user.role 
    },
    process.env.JWT_SECRET || "your_jwt_secret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// Register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, confirm } = req.body;

    if (!username || !email || !password || !confirm) {
      return res.status(400).json({
        success: false,
        message: "Semua field harus diisi"
      });
    }

    if (password !== confirm) {
      return res.status(400).json({
        success: false,
        message: "Password tidak cocok"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password minimal 6 karakter"
      });
    }

    // Check if user exists
    const existingUser = await dbUtils.get(
      "SELECT id FROM users WHERE email = ? OR username = ?",
      [email, username]
    );

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email atau username sudah terdaftar"
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await dbUtils.run(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      [username, email, passwordHash]
    );

    const user = await dbUtils.get("SELECT * FROM users WHERE id = ?", [result.lastID]);
    const token = generateToken(user);

    res.json({
      success: true,
      message: "Registrasi berhasil",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        auth_provider: user.auth_provider,
        is_active: user.is_active
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server"
    });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email dan password harus diisi"
      });
    }

    // Find user by email or username
    const user = await dbUtils.get(
      "SELECT * FROM users WHERE email = ? OR username = ?",
      [email, email]
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Email atau password salah"
      });
    }

    if (!user.is_active) {
      return res.status(400).json({
        success: false,
        message: "Akun tidak aktif"
      });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({
        success: false,
        message: "Email atau password salah"
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: "Login berhasil",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        auth_provider: user.auth_provider,
        is_active: user.is_active
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server"
    });
  }
});

// Google OAuth
router.get("/google", passport.authenticate("google", {
  scope: ["profile", "email"]
}));

router.get("/google/callback", 
  passport.authenticate("google", { session: false }),
  (req, res) => {
    try {
      const token = generateToken(req.user);
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
      
      // Redirect with token
      res.redirect(`${frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        auth_provider: req.user.auth_provider,
        is_active: req.user.is_active
      }))}`);
    } catch (error) {
      console.error("Google callback error:", error);
      res.redirect(`${process.env.FRONTEND_URL || "http://localhost:8080"}/register?error=auth_failed`);
    }
  }
);

// Get profile
router.get("/profile", verifyToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        auth_provider: req.user.auth_provider,
        is_active: req.user.is_active
      }
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil profil"
    });
  }
});

// Update profile
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username harus diisi"
      });
    }

    // Check if username exists
    const existingUser = await dbUtils.get(
      "SELECT id FROM users WHERE username = ? AND id != ?",
      [username, req.user.id]
    );

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Username sudah digunakan"
      });
    }

    await dbUtils.run(
      "UPDATE users SET username = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [username, req.user.id]
    );

    const updatedUser = await dbUtils.get("SELECT * FROM users WHERE id = ?", [req.user.id]);

    res.json({
      success: true,
      message: "Profil berhasil diupdate",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        auth_provider: updatedUser.auth_provider,
        is_active: updatedUser.is_active
      }
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal update profil"
    });
  }
});

module.exports = router;