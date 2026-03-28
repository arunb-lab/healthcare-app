/**
 * One-time seed script — creates a test patient account for payment integration testing.
 * Run once:  node seed_test_patient.js
 * Delete this file after seeding if you don't want it in production.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");

// ── Test patient credentials ────────────────────────────────────────────────
const TEST_USER = {
  username: "TestPatient",
  email:    "testpatient@healthseva.com",
  password: "Test@12345",   // plain-text shown here only for reference
  role:     "patient",
  phone:    "9800000001",
  address:  "Kathmandu, Nepal",
};
// ────────────────────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(process.env.DB_URI);
  console.log("MongoDB connected");

  const existing = await User.findOne({ email: TEST_USER.email });
  if (existing) {
    console.log("\n⚠️  User already exists — no changes made.");
    console.log("   Email   :", TEST_USER.email);
    console.log("   Password:", TEST_USER.password);
    await mongoose.disconnect();
    return;
  }

  const hashed = await bcrypt.hash(TEST_USER.password, 10);
  await User.create({
    username:  TEST_USER.username,
    email:     TEST_USER.email,
    password:  hashed,
    role:      TEST_USER.role,
    phone:     TEST_USER.phone,
    address:   TEST_USER.address,
    isActive:  true,
  });

  console.log("\n✅ Test patient seeded successfully!");
  console.log("──────────────────────────────────────");
  console.log("  Username :", TEST_USER.username);
  console.log("  Email    :", TEST_USER.email);
  console.log("  Password :", TEST_USER.password);
  console.log("  Role     :", TEST_USER.role);
  console.log("  Phone    :", TEST_USER.phone);
  console.log("  Address  :", TEST_USER.address);
  console.log("──────────────────────────────────────");
  console.log("  Use these same credentials on the Register page");
  console.log("  (select Patient role) to test the full signup flow.");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
