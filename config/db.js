/**
 * Database Configuration - DairyFlow
 */

import mongoose from "mongoose";

/**
 * Connect MongoDB Atlas
 */
const connectDB = async () => {
  try {
    // Read env INSIDE function
    const MONGODB_URI = process.env.MONGODB_URI;

    // Validate URI
    if (!MONGODB_URI) {
      throw new Error("❌ MONGODB_URI missing in .env");
    }

    console.log("🔄 Connecting MongoDB Atlas...");

    const conn = await mongoose.connect(MONGODB_URI);

    console.log(`
╔════════════════════════════════════╗
║       ✅ MongoDB Connected         ║
╠════════════════════════════════════╣
║ Host : ${conn.connection.host}
║ DB   : ${conn.connection.name}
║ Port : ${conn.connection.port}
╚════════════════════════════════════╝
    `);

    return conn;

  } catch (error) {
    console.error("❌ MongoDB Connection Failed");
    console.error(error.message);

    process.exit(1);
  }
};

/**
 * Disconnect MongoDB
 */
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log("🔌 MongoDB Disconnected");
  } catch (error) {
    console.error("❌ Disconnect Error:", error.message);
  }
};

export { connectDB, disconnectDB };