// BACKEND/config/db.js
const mongoose = require("mongoose");

async function connectDB(uri) {
  const mongoUri = uri || process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI (or MONGODB_URI) is missing");
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri);
  console.log("✅ MongoDB connected");
}

module.exports = { connectDB };
