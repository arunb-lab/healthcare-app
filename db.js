const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.DB_URI;
  if (!uri) {
    throw new Error("MongoDB URI not found in environment variables. Please check Vercel settings.");
  }
  
  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    throw error; // Let the caller handle the error without killing the process
  }
};

module.exports = connectDB;
