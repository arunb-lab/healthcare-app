const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');
const User = require('./models/User');
require('dotenv').config();

async function checkDatabaseData() {
    try {
        await mongoose.connect(process.env.DB_URI);
        console.log('Connected to MongoDB');

        // Check if doctors have location data
        const doctors = await Doctor.find({}).populate('userId', 'username');
        
        console.log(`Found ${doctors.length} doctors in database:`);
        
        doctors.forEach((doctor, index) => {
            console.log(`\nDoctor ${index + 1}:`);
            console.log(`  Name: ${doctor.userId.username}`);
            console.log(`  Specialization: ${doctor.specialization}`);
            console.log(`  Has location: ${!!doctor.location}`);
            console.log(`  Has clinic: ${!!doctor.clinic}`);
            
            if (doctor.location) {
                console.log(`  Location: ${JSON.stringify(doctor.location)}`);
            }
            
            if (doctor.clinic) {
                console.log(`  Clinic: ${JSON.stringify(doctor.clinic)}`);
            }
        });

    } catch (error) {
        console.error('Error checking database:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkDatabaseData();
