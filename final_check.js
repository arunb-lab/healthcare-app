const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');
const User = require('./models/User');
require('dotenv').config();

async function checkDatabase() {
  try {
    console.log('Connecting to Atlas...');
    await mongoose.connect(process.env.DB_URI);
    console.log('Connected.');

    // Find Dr. Kabir by username
    const user = await User.findOne({ username: /Kabir/i });
    if (!user) {
      console.log('User Kabir not found.');
      process.exit(0);
    }
    console.log('User found:', user._id, user.username);

    // Find his Doctor Profile
    const profile = await Doctor.findOne({ userId: user._id });
    if (!profile) {
      console.log('Doctor Profile for Kabir not found.');
    } else {
      console.log('--- DOCTOR PROFILE DATA ---');
      console.log('ID:', profile._id);
      console.log('Specialization:', profile.specialization);
      console.log('IsVerified:', profile.isVerified);
      console.log('Availability:', JSON.stringify(profile.availability, null, 2));
      console.log('Other fields:', Object.keys(profile.toObject()));
    }

    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err);
    process.exit(1);
  }
}

checkDatabase();
