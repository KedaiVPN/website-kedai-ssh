const fs = require("fs");
const path = require("path");

// Ensure logs directory exists
const logsDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const LOG_FILE = path.join(logsDir, "kedaivpn.log");
const ERROR_LOG_FILE = path.join(logsDir, "error.log");

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const CURRENT_LOG_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] || LOG_LEVELS.INFO;

// Utility function to format log messages
const formatMessage = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level}] ${message}${metaStr}\n`;
};

// Write to log file
const writeToFile = (filename, content) => {
  try {
    fs.appendFileSync(filename, content);
  } catch (error) {
    console.error("Failed to write to log file:", error);
  }
};

// Logger object
const logger = {
  error: (message, meta = {}) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.ERROR) {
      const formattedMessage = formatMessage("ERROR", message, meta);
      console.error(formattedMessage.trim());
      writeToFile(ERROR_LOG_FILE, formattedMessage);
      writeToFile(LOG_FILE, formattedMessage);
    }
  },

  warn: (message, meta = {}) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.WARN) {
      const formattedMessage = formatMessage("WARN", message, meta);
      console.warn(formattedMessage.trim());
      writeToFile(LOG_FILE, formattedMessage);
    }
  },

  info: (message, meta = {}) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.INFO) {
      const formattedMessage = formatMessage("INFO", message, meta);
      console.log(formattedMessage.trim());
      writeToFile(LOG_FILE, formattedMessage);
    }
  },

  debug: (message, meta = {}) => {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.DEBUG) {
      const formattedMessage = formatMessage("DEBUG", message, meta);
      console.debug(formattedMessage.trim());
      writeToFile(LOG_FILE, formattedMessage);
    }
  },

  // Log API requests
  logRequest: (req, res, next) => {
    const start = Date.now();
    const { method, url, ip } = req;
    
    // Log request
    logger.info(`${method} ${url}`, {
      ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
      const duration = Date.now() - start;
      logger.info(`${method} ${url} - ${res.statusCode}`, {
        ip,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
      originalEnd.call(this, chunk, encoding);
    };

    next();
  },

  // Log database operations
  logDB: (operation, table, meta = {}) => {
    logger.debug(`DB Operation: ${operation} on ${table}`, meta);
  },

  // Log authentication events
  logAuth: (event, userId, meta = {}) => {
    logger.info(`Auth Event: ${event}`, {
      userId,
      timestamp: new Date().toISOString(),
      ...meta
    });
  },

  // Log VPN operations
  logVPN: (operation, userId, serverId, meta = {}) => {
    logger.info(`VPN Operation: ${operation}`, {
      userId,
      serverId,
      timestamp: new Date().toISOString(),
      ...meta
    });
  }
};

module.exports = logger;