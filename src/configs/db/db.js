import mongoose from "mongoose";
import dns from "node:dns";

// Configure DNS resolution for Windows / ISP DNS reliability
try {
  dns.setDefaultResultOrder("ipv4first");
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore in environments where setting DNS servers is restricted
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectToDb = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!process.env.MONGODB_URL) {
    throw new Error("MONGODB_URL environment variable is not defined");
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      dbName: process.env.DB_NAME || "EverBloomCafe",
      maxPoolSize: 10,
    };

    cached.promise = mongoose.connect(process.env.MONGODB_URL, opts).then((mongooseInstance) => {
      console.log(`✅ Connected to MongoDB Database: ${opts.dbName}`);
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error("❌ MongoDB connection error:", error.message);
    throw error;
  }

  return cached.conn;
};

export default connectToDb;
