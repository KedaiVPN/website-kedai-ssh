const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { dbUtils } = require("../config/database");
const { validateRegistration, validateLogin, validateSetUsername } = require("../middleware/validation");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists
    const existingUser = await dbUtils.get(
      "SELECT * FROM users WHERE email = ?",
      [profile.emails[0].value]
    );

    if (existingUser) {
      return done(null, existingUser);
    }

    // Create new user (without username - will be set later)
    const result = await dbUtils.run(`
      INSERT INTO users (username, email, source, role) 
      VALUES (?, ?, ?, ?)
    `, [
      `google_${profile.id}`, // Temporary username
      profile.emails[0].value,
      'google',
      'user'
    ]);

    const newUser = await dbUtils.get(
      "SELECT * FROM users WHERE id = ?",
      [result.id]
    );

    return done(null, newUser);
  } catch (error) {
    return done(error, null);
  }
}));

// Initialize passport
router.use(passport.initialize());

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      email: user.email,
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// User Registration
router.post("/register", validateRegistration, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await dbUtils.get(
      "SELECT id FROM users WHERE email = ? OR username = ?",
      [email, username]
    );

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email or username already exists"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await dbUtils.run(`
      INSERT INTO users (username, email, password, source, role) 
      VALUES (?, ?, ?, ?, ?)
    `, [username, email, hashedPassword, 'email', 'user']);

    const user = await dbUtils.get(
      "SELECT id, username, email, role FROM users WHERE id = ?",
      [result.id]
    );

    // Generate JWT token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed"
    });
  }
});

// User Login
router.post("/login", validateLogin, async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    // Find user by email or username
    const user = await dbUtils.get(`
      SELECT * FROM users WHERE (email = ? OR username = ?) AND is_active = 1
    `, [emailOrUsername, emailOrUsername]);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Check if user registered with Google OAuth
    if (user.source === 'google' && !user.password) {
      return res.status(400).json({
        success: false,
        message: "Please sign in with Google"
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Generate JWT token
    const token = generateToken(user);
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
});

// Google OAuth Login
router.get("/google", 
  passport.authenticate("google", { 
    scope: ["profile", "email"],
    session: false 
  })
);

// Google OAuth Callback
router.get("/google/callback",
  passport.authenticate("google", { 
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/login?error=oauth_failed`
  }),
  async (req, res) => {
    try {
      const user = req.user;
      
      // Check if user needs to set username
      if (user.username.startsWith('google_')) {
        // Redirect to username setting page
        return res.redirect(
          `${process.env.FRONTEND_URL || 'http://localhost:8080'}/set-username?email=${encodeURIComponent(user.email)}`
        );
      }

      // Generate JWT token
      const token = generateToken(user);
      
      // Redirect to frontend with token
      res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:8080'}/auth/callback?token=${token}`
      );
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:8080'}/login?error=oauth_callback_failed`
      );
    }
  }
);

// Set Username for Google OAuth users
router.post("/google/set-username", validateSetUsername, async (req, res) => {
  try {
    const { username, email } = req.body;

    // Find user by email
    const user = await dbUtils.get(
      "SELECT * FROM users WHERE email = ? AND source = 'google'",
      [email]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if username is already taken
    const existingUsername = await dbUtils.get(
      "SELECT id FROM users WHERE username = ? AND id != ?",
      [username, user.id]
    );

    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: "Username is already taken"
      });
    }

    // Update username
    await dbUtils.run(
      "UPDATE users SET username = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [username, user.id]
    );

    // Get updated user
    const updatedUser = await dbUtils.get(
      "SELECT id, username, email, role FROM users WHERE id = ?",
      [user.id]
    );

    // Generate JWT token
    const token = generateToken(updatedUser);

    res.json({
      success: true,
      message: "Username set successfully",
      token,
      user: updatedUser
    });
  } catch (error) {
    console.error("Set username error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to set username"
    });
  }
});

// Get current user profile (protected route)
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const { password, ...userWithoutPassword } = req.user;
    res.json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user profile"
    });
  }
});

// Update user profile (protected route)
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { username } = req.body;
    const userId = req.user.id;

    if (username) {
      // Check if username is already taken
      const existingUser = await dbUtils.get(
        "SELECT id FROM users WHERE username = ? AND id != ?",
        [username, userId]
      );

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Username is already taken"
        });
      }

      // Update username
      await dbUtils.run(
        "UPDATE users SET username = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [username, userId]
      );
    }

    // Get updated user
    const updatedUser = await dbUtils.get(
      "SELECT id, username, email, role FROM users WHERE id = ?",
      [userId]
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile"
    });
  }
});

// Logout (client-side token removal, but we can blacklist tokens if needed)
router.post("/logout", verifyToken, async (req, res) => {
  try {
    // In a more sophisticated setup, you might want to blacklist the token
    // For now, we'll just return success as the client will remove the token
    res.json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed"
    });
  }
});

module.exports = router;