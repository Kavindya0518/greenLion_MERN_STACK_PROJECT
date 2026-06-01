// BACKEND/Seed/seed.js
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import User from "../Models/User.js";
import bcrypt from "bcryptjs";

dotenv.config();

async function run() {
  try {
    await connectDB();

    const seed = [
      { name: "Main Admin",   email: "admin@greenlion.lk",    username: "admin",     password: "Admin#123", role: "admin" },
      { name: "Supplier One", email: "supplier@greenlion.lk", username: "supplier1", password: "Supp#123",  role: "supplier" },
      { name: "Employee One", email: "employee@greenlion.lk", username: "emp1",      password: "Emp#123",   role: "employee" },
    ];

    for (const u of seed) {
      const hash = await bcrypt.hash(u.password, 10);
      await User.findOneAndUpdate(
        { $or: [{ email: u.email.toLowerCase() }, { username: u.username.toLowerCase() }] },
        {
          $setOnInsert: {
            name: u.name,
            email: u.email.toLowerCase(),
            username: u.username.toLowerCase(),
            password: hash,
            role: u.role,
            isActive: true,
          },
        },
        { upsert: true, new: true }
      );
    }

    console.log("✅ Seed complete");
  } catch (e) {
    console.error("❌ Seed error:", e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
