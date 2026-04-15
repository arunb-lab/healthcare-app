const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');
const User = require('./models/User');
require('dotenv').config();

// Use production MongoDB URI if available, otherwise fallback to localhost
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare-appointment';

console.log('MongoDB URI:', mongoURI);

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Create test pending doctors
const createTestDoctors = async () => {
  try {
    // Create test users first
    const testUsers = [
      {
        username: 'doctor1',
        email: 'doctor1@test.com',
        password: 'password123',
        role: 'doctor',
        isActive: true
      },
      {
        username: 'doctor2', 
        email: 'doctor2@test.com',
        password: 'password123',
        role: 'doctor',
        isActive: true
      },
      {
        username: 'doctor3',
        email: 'doctor3@test.com', 
        password: 'password123',
        role: 'doctor',
        isActive: true
      }
    ];

    // Insert users
    const createdUsers = await User.insertMany(testUsers);
    console.log('Created test users:', createdUsers.length);

    // Create test doctors with isVerified: false
    const testDoctors = [
      {
        userId: createdUsers[0]._id,
        specialization: 'Cardiology',
        licenseNumber: 'TEST001',
        qualifications: ['MD Cardiology', 'Fellowship in Cardiology'],
        experience: 5,
        bio: 'Experienced cardiologist with expertise in heart diseases',
        consultationFee: 1500,
        isVerified: false, // This is key - pending verification
        clinicAddress: '123 Heart Street, Kathmandu',
        clinicCity: 'Kathmandu',
        clinicState: 'Bagmati',
        clinicPostalCode: '44600',
        clinicPhone: '+9771234567',
        clinicEmail: 'doctor1@test.com'
      },
      {
        userId: createdUsers[1]._id,
        specialization: 'Dentistry',
        licenseNumber: 'TEST002',
        qualifications: ['BDS', 'MDS'],
        experience: 3,
        bio: 'Experienced dentist specializing in cosmetic dentistry',
        consultationFee: 800,
        isVerified: false, // This is key - pending verification
        clinicAddress: '456 Smile Avenue, Kathmandu',
        clinicCity: 'Kathmandu',
        clinicState: 'Bagmati',
        clinicPostalCode: '44600',
        clinicPhone: '+9779876543',
        clinicEmail: 'doctor2@test.com'
      },
      {
        userId: createdUsers[2]._id,
        specialization: 'Pediatrics',
        licenseNumber: 'TEST003',
        qualifications: ['MD Pediatrics', 'Fellowship in Pediatrics'],
        experience: 4,
        bio: 'Experienced pediatrician caring for children\'s health',
        consultationFee: 600,
        isVerified: false, // This is key - pending verification
        clinicAddress: '789 Kids Street, Kathmandu',
        clinicCity: 'Kathmandu',
        clinicState: 'Bagmati',
        clinicPostalCode: '44600',
        clinicPhone: '+9778765432',
        clinicEmail: 'doctor3@test.com'
      }
    ];

    // Insert doctors
    const createdDoctors = await Doctor.insertMany(testDoctors);
    console.log('Created test pending doctors:', createdDoctors.length);

    console.log('Test data creation completed!');
    console.log('Login credentials for test doctors:');
    testUsers.forEach((user, index) => {
      console.log(`Doctor ${index + 1}: ${user.email} / password123`);
    });

  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    mongoose.connection.close();
  }
};

createTestDoctors();
