const axios = require('axios');

async function testLocationWorkaround() {
    console.log('Testing location search using search endpoint (workaround)...');
    
    try {
        // Use the search endpoint with location parameters (we know this works)
        const response = await axios.get('http://localhost:3000/doctors/search', {
            params: {
                lat: 27.7172,
                lng: 85.3240,
                maxDistance: 25
            }
        });
        
        console.log('✅ Success! Found', response.data.count, 'doctors');
        
        if (response.data.doctors && response.data.doctors.length > 0) {
            console.log('\n🗺️ Location-based search is working!');
            console.log('Sample results:');
            
            response.data.doctors.forEach((doctor, index) => {
                console.log(`\nDoctor ${index + 1}:`);
                console.log(`  Name: Dr. ${doctor.name}`);
                console.log(`  Specialization: ${doctor.specialization}`);
                console.log(`  Has location: ${!!doctor.location}`);
                console.log(`  Has clinic: ${!!doctor.clinic}`);
                
                if (doctor.location && doctor.location.coordinates) {
                    console.log(`  Coordinates: [${doctor.location.coordinates[1]}, ${doctor.location.coordinates[0]}]`);
                }
                
                if (doctor.clinic) {
                    console.log(`  Clinic: ${doctor.clinic.name}`);
                    console.log(`  Address: ${doctor.clinic.address}`);
                }
                
                // Calculate distance manually if coordinates exist
                if (doctor.location && doctor.location.coordinates) {
                    const userLat = 27.7172;
                    const userLng = 85.3240;
                    const doctorLat = doctor.location.coordinates[1];
                    const doctorLng = doctor.location.coordinates[0];
                    
                    // Simple distance calculation (Haversine formula)
                    const R = 6371; // Earth's radius in km
                    const dLat = (doctorLat - userLat) * Math.PI / 180;
                    const dLng = (doctorLng - userLng) * Math.PI / 180;
                    const a = 
                        Math.sin(dLat/2) * Math.sin(dLat/2) +
                        Math.cos(userLat * Math.PI / 180) * Math.cos(doctorLat * Math.PI / 180) *
                        Math.sin(dLng/2) * Math.sin(dLng/2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                    const distance = R * c;
                    
                    console.log(`  Distance: ${Math.round(distance * 10) / 10} km`);
                }
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testLocationWorkaround();
