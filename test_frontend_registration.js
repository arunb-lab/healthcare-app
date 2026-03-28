const http = require('http');

// Test registration that mimics what the frontend sends
const frontendData = JSON.stringify({
    username: "frontend_test_" + Date.now(),
    email: "frontend_" + Date.now() + "@example.com",
    password: "password123",
    role: "doctor",
    phone: "9876543210",
    address: "123 Test Street",
    dateOfBirth: "1990-01-01",
    specialization: "Cardiology",
    licenseNumber: "LICENSE_" + Date.now(),
    qualifications: "MBBS, MD",
    experience: "5",
    bio: "Test doctor bio",
    consultationFee: "1000",
    // New clinic and location fields that frontend now sends
    clinicName: "Test Heart Clinic",
    clinicAddress: "456 Medical Road",
    clinicCity: "Kathmandu",
    clinicState: "Bagmati",
    clinicPostalCode: "44600",
    clinicLat: "27.7172",
    clinicLng: "85.3240"
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/users/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(frontendData)
    }
};

const req = http.request(options, (res) => {
    console.log('Status:', res.statusCode);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('Response:', data);
        
        try {
            const response = JSON.parse(data);
            if (res.statusCode === 201) {
                console.log('✅ Frontend-style registration successful!');
                console.log('User ID:', response.userId);
                console.log('Role:', response.role);
                console.log('Requires verification:', response.requiresVerification);
            } else {
                console.log('❌ Frontend-style registration failed');
                console.log('Error:', response.message);
            }
        } catch (parseError) {
            console.log('❌ Failed to parse response:', parseError.message);
        }
    });
});

req.on('error', (err) => {
    console.error('❌ Request error:', err.message);
});

req.write(frontendData);
req.end();
