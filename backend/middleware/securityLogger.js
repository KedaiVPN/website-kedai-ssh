const fs = require('fs');
const path = require('path');

// Configure the log stream to append to security.log
const logStream = fs.createWriteStream(path.join(__dirname, '..', 'security.log'), { flags: 'a' });

const securityLogger = (req, res, next) => {
  // Get the IP address from the request, prioritizing Cloudflare headers
  const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

  let userIdentifier = 'USER (Guest)';

  // 1. Check for authenticated user first
  if (req.user) {
    userIdentifier = `USER (${req.user.email} | ${req.user.username})`;
  }
  // 2. Fallback to checking request body for unauthenticated routes
  else {
    const { email, username } = req.body;
    if (email && username) {
      userIdentifier = `USER (${email} | ${username})`;
    } else if (email) {
      userIdentifier = `USER (${email})`;
    } else if (username) {
      userIdentifier = `USER (${username})`;
    }
  }

  // Format the log line
  const logLine = `[${new Date().toISOString()}] ${userIdentifier} from IP ${ip} → ${req.method} ${req.originalUrl}\n`;

  // Write to the log file and console
  logStream.write(logLine);
  console.log(`[SECURITY LOG] ${logLine.trim()}`);

  next();
};

module.exports = { securityLogger, logStream };