#!/usr/bin/env node

const { dbUtils } = require("../config/database");

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Insert sample servers
    const servers = [
      {
        name: "Singapore Server 1",
        domain: "sg1.kedaivpn.com",
        location: "Singapore",
        auth: "sample_auth_key_sg1",
        protocols: JSON.stringify(["ssh", "vmess", "vless", "trojan"]),
        max_users: 100,
        batas_create_akun: 50,
        ping: 15
      },
      {
        name: "Indonesia Server 1",
        domain: "id1.kedaivpn.com", 
        location: "Jakarta, Indonesia",
        auth: "sample_auth_key_id1",
        protocols: JSON.stringify(["ssh", "vmess", "vless"]),
        max_users: 150,
        batas_create_akun: 75,
        ping: 8
      },
      {
        name: "US Server 1",
        domain: "us1.kedaivpn.com",
        location: "New York, USA",
        auth: "sample_auth_key_us1", 
        protocols: JSON.stringify(["vmess", "vless", "trojan"]),
        max_users: 200,
        batas_create_akun: 100,
        ping: 180
      }
    ];

    // Check if servers already exist
    const existingServers = await dbUtils.get("SELECT COUNT(*) as count FROM servers");
    
    if (existingServers.count === 0) {
      console.log("📡 Inserting sample servers...");
      
      for (const server of servers) {
        await dbUtils.run(`
          INSERT INTO servers (name, domain, location, auth, protocols, max_users, batas_create_akun, ping, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          server.name,
          server.domain,
          server.location,
          server.auth,
          server.protocols,
          server.max_users,
          server.batas_create_akun,
          server.ping,
          'online'
        ]);
      }
      
      console.log("✅ Sample servers inserted successfully!");
    } else {
      console.log("📡 Servers already exist, skipping server seeding");
    }

    // Check if admin user exists
    const adminExists = await dbUtils.get("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    
    if (!adminExists) {
      console.log("👤 Admin user will be created automatically on first server start");
    } else {
      console.log("👤 Admin user already exists");
    }

    console.log("✅ Database seeding completed successfully!");
    
  } catch (error) {
    console.error("❌ Database seeding failed:", error);
    throw error;
  }
}

// Run seeding
seedDatabase()
  .then(() => {
    console.log("🎉 All done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Seeding failed:", error);
    process.exit(1);
  });