const mongoose = require("mongoose");

let cached = global._mongoose;

if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI || process.env.DB_URI;

  if (!uri) {
    throw new Error("MongoDB URI not found");
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;
