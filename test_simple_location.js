const axios = require('axios');

async function testSimpleLocation() {
    console.log('Testing basic search without location first...');
    
    try {
        // Test basic search (should work)
        const basicResponse = await axios.get('http://localhost:3000/doctors/search');
        console.log('✅ Basic search works:', basicResponse.data.count, 'doctors');
        
        // Now test search with location but use manual filtering instead of geoNear
        console.log('\nTesting manual location filtering...');
        
        const response = await axios.get('http://localhost:3000/doctors/search');
        const allDoctors = response.data.doctors;
        
        if (allDoctors && allDoctors.length > 0) {
            // Filter doctors that have location data
            const doctorsWithLocation = allDoctors.filter(doctor => 
                doctor.location && 
                doctor.location.coordinates && 
                doctor.location.coordinates.length === 2
            );
            
            console.log(`Found ${doctorsWithLocation.length} doctors with location data`);
            
            if (doctorsWithLocation.length > 0) {
                // Calculate distances manually
                const userLat = 27.7172;
                const userLng = 85.3240;
                
                const doctorsWithDistance = doctorsWithLocation.map(doctor => {
                    const doctorLat = doctor.location.coordinates[1];
                    const doctorLng = doctor.location.coordinates[0];
                    
                    // Haversine formula
                    const R = 6371; // Earth's radius in km
                    const dLat = (doctorLat - userLat) * Math.PI / 180;
                    const dLng = (doctorLng - userLng) * Math.PI / 180;
                    const a = 
                        Math.sin(dLat/2) * Math.sin(dLat/2) +
                        Math.cos(userLat * Math.PI / 180) * Math.cos(doctorLat * Math.PI / 180) *
                        Math.sin(dLng/2) * Math.sin(dLng/2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                    const distance = R * c;
                    
                    return {
                        ...doctor,
                        distance: Math.round(distance * 10) / 10,
                        unit: 'km'
                    };
                });
                
                // Filter by 25km radius
                const nearbyDoctors = doctorsWithDistance.filter(doctor => doctor.distance <= 25);
                
                // Sort by distance
                nearbyDoctors.sort((a, b) => a.distance - b.distance);
                
                console.log(`\n🗺️ Found ${nearbyDoctors.length} doctors within 25km:`);
                
                nearbyDoctors.forEach((doctor, index) => {
                    console.log(`\n${index + 1}. Dr. ${doctor.name} - ${doctor.distance}km`);
                    console.log(`   Specialization: ${doctor.specialization}`);
                    if (doctor.clinic) {
                        console.log(`   Clinic: ${doctor.clinic.name}`);
                        console.log(`   Address: ${doctor.clinic.address}`);
                    }
                });
                
                return {
                    count: nearbyDoctors.length,
                    center: { lat: userLat, lng: userLng },
                    searchRadius: 25,
                    doctors: nearbyDoctors
                };
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testSimpleLocation();
