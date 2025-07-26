const { body, validationResult } = require("express-validator");

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array()
    });
  }
  
  next();
};

// Validation rules for user registration
const validateRegistration = [
  body("username")
    .isLength({ min: 3, max: 20 })
    .withMessage("Username must be 3-20 characters long")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),
  
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  
  body("confirm")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password confirmation does not match");
      }
      return true;
    }),
  
  handleValidationErrors
];

// Validation rules for user login
const validateLogin = [
  body("emailOrUsername")
    .notEmpty()
    .withMessage("Email or username is required"),
  
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
  
  handleValidationErrors
];

// Validation rules for username setting (Google OAuth)
const validateSetUsername = [
  body("username")
    .isLength({ min: 3, max: 20 })
    .withMessage("Username must be 3-20 characters long")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),
  
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  
  handleValidationErrors
];

// Validation rules for VPN account creation
const validateVPNAccount = [
  body("username")
    .isLength({ min: 3, max: 20 })
    .withMessage("VPN username must be 3-20 characters long")
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage("VPN username can only contain letters and numbers"),
  
  body("protocol")
    .isIn(["ssh", "vmess", "vless", "trojan"])
    .withMessage("Invalid protocol selected"),
  
  body("duration")
    .isInt({ min: 1, max: 365 })
    .withMessage("Duration must be between 1 and 365 days"),
  
  body("serverId")
    .notEmpty()
    .withMessage("Server selection is required"),
  
  body("password")
    .optional()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  
  body("quota")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Quota must be a positive number"),
  
  body("ipLimit")
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage("IP limit must be between 1 and 10"),
  
  handleValidationErrors
];

// Validation rules for server management
const validateServer = [
  body("name")
    .isLength({ min: 3, max: 50 })
    .withMessage("Server name must be 3-50 characters long"),
  
  body("domain")
    .isFQDN()
    .withMessage("Please provide a valid domain name"),
  
  body("location")
    .isLength({ min: 2, max: 50 })
    .withMessage("Location must be 2-50 characters long"),
  
  body("auth")
    .notEmpty()
    .withMessage("Authentication details are required"),
  
  body("protocols")
    .isArray({ min: 1 })
    .withMessage("At least one protocol must be selected"),
  
  body("protocols.*")
    .isIn(["ssh", "vmess", "vless", "trojan"])
    .withMessage("Invalid protocol in protocols array"),
  
  body("max_users")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Max users must be a positive number"),
  
  body("batas_create_akun")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Account creation limit must be a positive number"),
  
  handleValidationErrors
];

// Validation rules for admin password change
const validatePasswordChange = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long"),
  
  body("confirmPassword")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Password confirmation does not match");
      }
      return true;
    }),
  
  handleValidationErrors
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateSetUsername,
  validateVPNAccount,
  validateServer,
  validatePasswordChange,
  handleValidationErrors
};