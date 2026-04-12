const mongoose = require('mongoose');
const User = require('./models/User');
const Doctor = require('./models/Doctor');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/healthcare-appointment');

const createTestPendingDoctor = async () => {
  try {
    // Create a test user for the doctor
    const testUser = new User({
      username: 'testdoctor',
      email: 'testdoctor@example.com',
      password: 'password123',
      role: 'doctor',
      isActive: true
    });
    
    await testUser.save();
    console.log('Test user created:', testUser._id);

    // Create a test doctor with isVerified: false
    const testDoctor = new Doctor({
      userId: testUser._id,
      specialization: 'Cardiologist',
      licenseNumber: 'TEST-12345',
      qualifications: ['MBBS', 'MD - Cardiology'],
      experience: 10,
      bio: 'Test doctor for verification',
      consultationFee: 1500,
      isVerified: false // This should make it appear in pending doctors
    });
    
    await testDoctor.save();
    console.log('Test doctor created:', testDoctor._id);
    
    console.log('Test pending doctor created successfully!');
    console.log('You should now see this doctor in the admin verification page.');
    
  } catch (error) {
    console.error('Error creating test doctor:', error);
  } finally {
    mongoose.connection.close();
  }
};

createTestPendingDoctor();
