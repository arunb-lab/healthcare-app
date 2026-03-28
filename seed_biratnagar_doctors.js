const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');
const User = require('./models/User');
require('dotenv').config();

const biratnagarDoctors = [
  {
    username: 'dr-biplov-sharma',
    email: 'biplov.sharma@biratnagar.com',
    password: 'password123',
    phone: '+977-9800000001',
    role: 'doctor'
  },
  {
    username: 'dr-manisha-ghimire',
    email: 'manisha.ghimire@biratnagar.com',
    password: 'password123',
    phone: '+977-9800000002',
    role: 'doctor'
  }
];

const biratnagarProfiles = [
  {
    specialization: 'Neurology',
    licenseNumber: 'NMC-2023-BRT-001',
    qualifications: ['MBBS', 'MD - Neurology'],
    experience: 10,
    bio: 'Specialist Neurologist based in Biratnagar.',
    consultationFee: 1200,
    clinic: {
      name: 'Birat Neurology Care',
      address: 'Main Road, Biratnagar',
      city: 'Biratnagar',
      state: 'Koshi',
      postalCode: '56600',
      phone: '+977-21-555555',
      email: 'contact@biratneurology.com'
    },
    location: {
      type: 'Point',
      coordinates: [87.2718, 26.4525] // Biratnagar center
    }
  },
  {
    specialization: 'Cardiology',
    licenseNumber: 'NMC-2023-BRT-002',
    qualifications: ['MBBS', 'MD - Cardiology'],
    experience: 12,
    bio: 'Experienced Cardiologist serving the Biratnagar community.',
    consultationFee: 1500,
    clinic: {
      name: 'Koshi Heart Center',
      address: 'Hospital Road, Biratnagar',
      city: 'Biratnagar',
      state: 'Koshi',
      postalCode: '56600',
      phone: '+977-21-666666',
      email: 'info@koshiheart.com'
    },
    location: {
      type: 'Point',
      coordinates: [87.2835, 26.4842] // Near Biratnagar Hospital
    }
  }
];

async function seedBiratnagar() {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log('Connected to MongoDB');

    for (let i = 0; i < biratnagarDoctors.length; i++) {
      // Check if user already exists
      let user = await User.findOne({ email: biratnagarDoctors[i].email });
      if (!user) {
        user = new User(biratnagarDoctors[i]);
        await user.save();
      }

      // Check if doctor profile already exists
      let doctor = await Doctor.findOne({ userId: user._id });
      if (!doctor) {
        doctor = new Doctor({
          userId: user._id,
          ...biratnagarProfiles[i],
          isVerified: true,
          verifiedAt: new Date()
        });
        await doctor.save();
      }
      console.log(`Ensured doctor: Dr. ${user.username} in Biratnagar`);
    }

    console.log('Successfully seeded Biratnagar doctors!');
  } catch (error) {
    console.error('Error seeding Biratnagar doctors:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedBiratnagar();
