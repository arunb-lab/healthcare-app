const axios = require('axios');

async function testNearbySearch() {
    console.log('Testing nearby search using search endpoint with location parameters...');
    
    try {
        const response = await axios.get('http://localhost:3000/doctors/search', {
            params: {
                lat: 27.7172,
                lng: 85.3240,
                maxDistance: 25
            }
        });
        
        console.log('✅ Success! Found', response.data.count, 'doctors');
        console.log('Sample doctor with location data:');
        
        if (response.data.doctors && response.data.doctors.length > 0) {
            const doctor = response.data.doctors[0];
            console.log('Name:', doctor.name);
            console.log('Specialization:', doctor.specialization);
            console.log('Has location:', !!doctor.location);
            console.log('Has clinic:', !!doctor.clinic);
            
            if (doctor.location) {
                console.log('Location coordinates:', doctor.location.coordinates);
            }
            
            if (doctor.clinic) {
                console.log('Clinic name:', doctor.clinic.name);
                console.log('Clinic address:', doctor.clinic.address);
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testNearbySearch();
