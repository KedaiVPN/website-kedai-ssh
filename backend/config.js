require('dotenv').config();

const jwtSecret = process.env.JWT_SECRET;
const sessionSecret = process.env.SESSION_SECRET;

if (!jwtSecret) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in your .env file.");
  process.exit(1);
}

if (!sessionSecret) {
    console.error("FATAL ERROR: SESSION_SECRET is not defined in your .env file.");
    process.exit(1);
}


module.exports = {
  jwtSecret,
  sessionSecret,
};
