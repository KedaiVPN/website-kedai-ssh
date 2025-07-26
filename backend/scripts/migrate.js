#!/usr/bin/env node

const { initDatabase } = require("../config/database");

console.log("🚀 Starting database migration...");

initDatabase()
  .then(() => {
    console.log("✅ Database migration completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Database migration failed:", error);
    process.exit(1);
  });