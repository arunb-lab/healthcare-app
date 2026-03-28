const http = require('http');
const axios = require('axios');

// Test configuration
const API_BASE = 'http://localhost:3000';

// Test user credentials
const testUser = {
    username: "testpatient",
    email: "test@example.com", 
    password: "123456",
    role: "patient"
};

// Test location (Kathmandu city center)
const testLocation = {
    lat: 27.7172,
    lng: 85.3240
};

let authToken = '';

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: body
                });
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (data) {
            req.write(data);
        }
        req.end();
    });
}

// Test functions
async function testUserRegistration() {
    console.log('\n=== Testing User Registration ===');
    try {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/users/register',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(JSON.stringify(testUser))
            }
        };

        const response = await makeRequest(options, JSON.stringify(testUser));
        console.log('Status:', response.statusCode);
        console.log('Response:', response.body);

        if (response.statusCode === 201) {
            console.log('✅ User registration successful');
        } else {
            console.log('❌ User registration failed');
        }
    } catch (error) {
        console.error('❌ Registration error:', error.message);
    }
}

async function testUserLogin() {
    console.log('\n=== Testing User Login ===');
    try {
        const loginData = {
            email: testUser.email,
            password: testUser.password
        };

        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/users/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(JSON.stringify(loginData))
            }
        };

        const response = await makeRequest(options, JSON.stringify(loginData));
        console.log('Status:', response.statusCode);
        console.log('Response:', response.body);

        if (response.statusCode === 200) {
            const result = JSON.parse(response.body);
            authToken = result.token;
            console.log('✅ User login successful');
            console.log('Token:', authToken.substring(0, 50) + '...');
        } else {
            console.log('❌ User login failed');
        }
    } catch (error) {
        console.error('❌ Login error:', error.message);
    }
}

async function testSearchDoctors() {
    console.log('\n=== Testing Doctor Search ===');
    try {
        const response = await axios.get(`${API_BASE}/doctors/search`);
        console.log('Status:', response.status);
        console.log('Doctors found:', response.data.count);
        
        if (response.data.doctors && response.data.doctors.length > 0) {
            console.log('✅ Doctor search successful');
            console.log('Sample doctor:', {
                name: response.data.doctors[0].name,
                specialization: response.data.doctors[0].specialization,
                hasLocation: !!response.data.doctors[0].location,
                hasClinic: !!response.data.doctors[0].clinic
            });
        } else {
            console.log('❌ No doctors found');
        }
    } catch (error) {
        console.error('❌ Search error:', error.message);
    }
}

async function testNearbyDoctors() {
    console.log('\n=== Testing Nearby Doctors (Location-based Search) ===');
    console.log('Using location:', testLocation);
    
    try {
        const response = await axios.get(`${API_BASE}/doctors/nearby`, {
            params: {
                lat: testLocation.lat,
                lng: testLocation.lng,
                maxDistance: 25 // 25km radius
            }
        });
        
        console.log('Status:', response.status);
        console.log('Nearby doctors found:', response.data.count);
        console.log('Search center:', response.data.center);
        console.log('Search radius:', response.data.searchRadius, 'km');
        
        if (response.data.doctors && response.data.doctors.length > 0) {
            console.log('✅ Nearby doctors search successful');
            
            response.data.doctors.forEach((doctor, index) => {
                console.log(`\nDoctor ${index + 1}:`);
                console.log(`  Name: Dr. ${doctor.name}`);
                console.log(`  Specialization: ${doctor.specialization}`);
                console.log(`  Clinic: ${doctor.clinic?.name}`);
                console.log(`  Address: ${doctor.clinic?.address}`);
                console.log(`  Distance: ${doctor.distance} ${doctor.unit}`);
                console.log(`  Fee: Rs. ${doctor.consultationFee}`);
                console.log(`  Rating: ${doctor.averageRating} (${doctor.totalReviews} reviews)`);
            });
        } else {
            console.log('❌ No nearby doctors found');
        }
    } catch (error) {
        console.error('❌ Nearby search error:', error.message);
    }
}

async function testDoctorDetails() {
    console.log('\n=== Testing Doctor Details ===');
    try {
        // First get a list of doctors to get an ID
        const searchResponse = await axios.get(`${API_BASE}/doctors/search`);
        
        if (searchResponse.data.doctors && searchResponse.data.doctors.length > 0) {
            const doctorId = searchResponse.data.doctors[0].id;
            console.log('Testing doctor ID:', doctorId);
            
            const response = await axios.get(`${API_BASE}/doctors/${doctorId}`);
            console.log('Status:', response.status);
            
            const doctor = response.data;
            console.log('✅ Doctor details successful');
            console.log('Doctor details:', {
                name: doctor.name,
                specialization: doctor.specialization,
                clinic: doctor.clinic?.name,
                address: doctor.clinic?.address,
                phone: doctor.clinic?.phone,
                coordinates: doctor.location?.coordinates,
                availability: doctor.availability ? Object.keys(doctor.availability).length + ' days' : 'Not set'
            });
        } else {
            console.log('❌ No doctors available to test details');
        }
    } catch (error) {
        console.error('❌ Doctor details error:', error.message);
    }
}

async function testLocationBasedSearchWithFilters() {
    console.log('\n=== Testing Location-based Search with Filters ===');
    
    try {
        // Test nearby doctors with specialization filter
        const response = await axios.get(`${API_BASE}/doctors/nearby`, {
            params: {
                lat: testLocation.lat,
                lng: testLocation.lng,
                maxDistance: 10, // 10km radius
                specialization: 'Cardiology'
            }
        });
        
        console.log('Status:', response.status);
        console.log('Cardiologists nearby:', response.data.count);
        
        if (response.data.doctors && response.data.doctors.length > 0) {
            console.log('✅ Location-based search with filters successful');
            response.data.doctors.forEach((doctor, index) => {
                console.log(`  ${index + 1}. Dr. ${doctor.name} - ${doctor.distance} km away`);
            });
        } else {
            console.log('ℹ️ No cardiologists found in 10km radius');
        }
    } catch (error) {
        console.error('❌ Filtered search error:', error.message);
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting API Tests for Location-based Features');
    console.log('==============================================');
    
    // Test basic functionality first
    await testUserRegistration();
    await testUserLogin();
    await testSearchDoctors();
    await testDoctorDetails();
    
    // Test location-based features
    await testNearbyDoctors();
    await testLocationBasedSearchWithFilters();
    
    console.log('\n✅ All tests completed!');
    console.log('\n📝 Summary:');
    console.log('- User authentication tested');
    console.log('- Doctor search tested');
    console.log('- Location-based search tested');
    console.log('- Distance calculation tested');
    console.log('- Filtered search tested');
    console.log('\n🔧 To test the map in browser:');
    console.log('1. Start backend: npm run dev');
    console.log('2. Start frontend: npm run dev');
    console.log('3. Visit: http://localhost:5173/nearby-doctors');
    console.log('4. Allow location access when prompted');
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = {
    testUserRegistration,
    testUserLogin,
    testSearchDoctors,
    testNearbyDoctors,
    testDoctorDetails,
    testLocationBasedSearchWithFilters
};
