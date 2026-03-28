/**
 * One-time seed script — creates a verified test doctor account for payment integration testing.
 * Run once:  node seed_test_doctor.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");
const Doctor = require("./models/Doctor");

// ── Test doctor credentials ─────────────────────────────────────────────────
const TEST_DOCTOR_USER = {
  username: "TestDoctor",
  email:    "testdoctor@healthseva.com",
  password: "Test@12345",
  role:     "doctor",
  phone:    "9800000002",
  address:  "Kathmandu, Nepal",
};

const TEST_DOCTOR_PROFILE = {
  specialization:  "General Medicine",
  licenseNumber:   "TEST-LIC-001",
  qualifications:  ["MBBS", "MD"],
  experience:      5,
  bio:             "Test doctor account for payment integration testing.",
  consultationFee: 500,   // Rs 500 → 50000 paisa
  isVerified:      true,  // pre-verified so patients can book immediately
  availability: {
    monday:    [{ start: "09:00", end: "17:00" }],
    tuesday:   [{ start: "09:00", end: "17:00" }],
    wednesday: [{ start: "09:00", end: "17:00" }],
    thursday:  [{ start: "09:00", end: "17:00" }],
    friday:    [{ start: "09:00", end: "17:00" }],
    saturday:  [{ start: "10:00", end: "14:00" }],
    sunday:    [],
  },
};
// ────────────────────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(process.env.DB_URI);
  console.log("MongoDB connected");

  // --- User ---
  let user = await User.findOne({ email: TEST_DOCTOR_USER.email });
  if (user) {
    console.log("\n⚠️  Doctor user already exists — skipping user creation.");
  } else {
    const hashed = await bcrypt.hash(TEST_DOCTOR_USER.password, 10);
    user = await User.create({
      username:  TEST_DOCTOR_USER.username,
      email:     TEST_DOCTOR_USER.email,
      password:  hashed,
      role:      TEST_DOCTOR_USER.role,
      phone:     TEST_DOCTOR_USER.phone,
      address:   TEST_DOCTOR_USER.address,
      isActive:  true,
    });
    console.log("✅ Doctor user created.");
  }

  // --- Doctor profile ---
  const existingProfile = await Doctor.findOne({ userId: user._id });
  if (existingProfile) {
    console.log("⚠️  Doctor profile already exists — skipping profile creation.");
  } else {
    const existingLicense = await Doctor.findOne({ licenseNumber: TEST_DOCTOR_PROFILE.licenseNumber });
    if (existingLicense) {
      console.log("⚠️  License number already in use — skipping profile creation.");
    } else {
      await Doctor.create({
        userId:          user._id,
        ...TEST_DOCTOR_PROFILE,
        verifiedAt:      new Date(),
        status:          "Available",
      });
      console.log("✅ Doctor profile created and verified.");
    }
  }

  console.log("\n─────────────────────────────────────────────────");
  console.log(" TEST DOCTOR ACCOUNT");
  console.log("─────────────────────────────────────────────────");
  console.log("  Email          :", TEST_DOCTOR_USER.email);
  console.log("  Password       :", TEST_DOCTOR_USER.password);
  console.log("  Specialization :", TEST_DOCTOR_PROFILE.specialization);
  console.log("  Fee            : Rs.", TEST_DOCTOR_PROFILE.consultationFee);
  console.log("  Working hours  : Mon–Fri 09:00–17:00, Sat 10:00–14:00");
  console.log("  Verified       : YES (patients can book immediately)");
  console.log("─────────────────────────────────────────────────");
  console.log("\n TEST PATIENT ACCOUNT");
  console.log("─────────────────────────────────────────────────");
  console.log("  Email    : testpatient@healthseva.com");
  console.log("  Password : Test@12345");
  console.log("─────────────────────────────────────────────────");
  console.log("\n Both accounts are ready. KHALTI_TEST=true is set,");
  console.log(" so no real payment is needed — click Book and it goes through.");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
