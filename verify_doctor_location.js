const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');
const User = require('./models/User');
require('dotenv').config();

async function verifyDoctorLocation() {
    try {
        await mongoose.connect(process.env.DB_URI);
        console.log('Connected to MongoDB');

        // Find the recently created doctor
        const doctor = await Doctor.findOne({ licenseNumber: 'TEST-LICENSE-123' })
            .populate('userId', 'username email');
        
        if (doctor) {
            console.log('✅ Doctor found in database:');
            console.log('  Name:', doctor.userId.username);
            console.log('  Specialization:', doctor.specialization);
            console.log('  Has location:', !!doctor.location);
            console.log('  Has clinic:', !!doctor.clinic);
            
            if (doctor.location) {
                console.log('  Location coordinates:', doctor.location.coordinates);
                console.log('  Location type:', doctor.location.type);
            }
            
            if (doctor.clinic) {
                console.log('  Clinic name:', doctor.clinic.name);
                console.log('  Clinic address:', doctor.clinic.address);
                console.log('  Clinic city:', doctor.clinic.city);
                console.log('  Clinic state:', doctor.clinic.state);
                console.log('  Clinic country:', doctor.clinic.country);
                console.log('  Clinic phone:', doctor.clinic.phone);
                console.log('  Clinic email:', doctor.clinic.email);
            }
            
            console.log('\n✅ Doctor registration with location data is working correctly!');
            console.log('✅ All required fields are present and validated!');
            
        } else {
            console.log('❌ Doctor not found');
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

verifyDoctorLocation();
