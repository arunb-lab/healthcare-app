// Test script to add pending doctors via API
const axios = require('axios');

const createPendingDoctors = async () => {
  try {
    // Test doctor data
    const testDoctors = [
      {
        userId: "507f1f77bcf869d61790a5f9c",
        specialization: 'Cardiology',
        licenseNumber: 'TEST001',
        qualifications: ['MD Cardiology', 'Fellowship in Cardiology'],
        experience: 5,
        bio: 'Experienced cardiologist with expertise in heart diseases',
        consultationFee: 1500,
        isVerified: false,
        clinicAddress: '123 Heart Street, Kathmandu',
        clinicCity: 'Kathmandu',
        clinicState: 'Bagmati',
        clinicPostalCode: '44600',
        clinicPhone: '+9771234567',
        clinicEmail: 'doctor1@test.com'
      },
      {
        userId: "507f1f77bcf869d61790a5f9d",
        specialization: 'Dentistry',
        licenseNumber: 'TEST002',
        qualifications: ['BDS', 'MDS'],
        experience: 3,
        bio: 'Experienced dentist specializing in cosmetic dentistry',
        consultationFee: 800,
        isVerified: false,
        clinicAddress: '456 Smile Avenue, Kathmandu',
        clinicCity: 'Kathmandu',
        clinicState: 'Bagmati',
        clinicPostalCode: '44600',
        clinicPhone: '+9779876543',
        clinicEmail: 'doctor2@test.com'
      }
    ];

    console.log('Creating test pending doctors...');
    console.log('Backend URL:', process.env.BACKEND_URL || 'http://localhost:3000');

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    
    for (const doctor of testDoctors) {
      try {
        // First create user (this would normally be done during registration)
        console.log('Creating doctor with specialization:', doctor.specialization);
        
        const response = await axios.post(`${backendUrl}/users/register`, {
          username: `doctor_${Date.now()}`,
          email: doctor.clinicEmail,
          password: 'password123',
          role: 'doctor',
          specialization: doctor.specialization,
          licenseNumber: doctor.licenseNumber,
          qualifications: doctor.qualifications,
          experience: doctor.experience,
          bio: doctor.bio,
          consultationFee: doctor.consultationFee,
          clinicAddress: doctor.clinicAddress,
          clinicCity: doctor.clinicCity,
          clinicState: doctor.clinicState,
          clinicPostalCode: doctor.clinicPostalCode,
          clinicPhone: doctor.clinicPhone,
          clinicEmail: doctor.clinicEmail,
          clinicLat: '27.7172',
          clinicLng: '85.3240'
        });

        console.log(`Created user for ${doctor.specialization}:`, response.data.user._id);

        // Then create doctor profile
        const doctorResponse = await axios.post(`${backendUrl}/doctors`, {
          userId: response.data.user._id,
          specialization: doctor.specialization,
          licenseNumber: doctor.licenseNumber,
          qualifications: doctor.qualifications,
          experience: doctor.experience,
          bio: doctor.bio,
          consultationFee: doctor.consultationFee,
          clinicAddress: doctor.clinicAddress,
          clinicCity: doctor.clinicCity,
          clinicState: doctor.clinicState,
          clinicPostalCode: doctor.clinicPostalCode,
          clinicPhone: doctor.clinicPhone,
          clinicEmail: doctor.clinicEmail,
          clinicLat: '27.7172',
          clinicLng: '85.3240'
        });

        console.log(`Created doctor profile for ${doctor.specialization}:`, doctorResponse.data._id);

      } catch (error) {
        console.error(`Error creating ${doctor.specialization} doctor:`, error.response?.data || error.message);
      }
    }

    console.log('Test pending doctors creation completed!');
    console.log('You can now test the DoctorVerification page');
    console.log('Login credentials for test doctors:');
    console.log('Email: doctor1@test.com / Password: password123');
    console.log('Email: doctor2@test.com / Password: password123');
    console.log('Email: doctor3@test.com / Password: password123');
    
  } catch (error) {
    console.error('Error in test script:', error);
  }
};

createPendingDoctors();
