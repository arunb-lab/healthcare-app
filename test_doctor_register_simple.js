const http = require('http');

// Test doctor registration with required fields
const doctorData = JSON.stringify({
    username: "drtest" + Date.now(),
    email: "dr" + Date.now() + "@example.com",
    password: "password123",
    role: "doctor",
    phone: "9876543210",
    dateOfBirth: "1990-01-01",
    specialization: "Cardiology",
    licenseNumber: "TEST-LICENSE-" + Date.now(),
    consultationFee: 1000,
    // Required clinic fields
    clinicName: "Test Heart Clinic",
    clinicAddress: "123 Medical Road",
    clinicCity: "Kathmandu",
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
        'Content-Length': Buffer.byteLength(doctorData)
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
                console.log('✅ Doctor registration successful!');
            } else {
                console.log('❌ Doctor registration failed');
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

req.write(doctorData);
req.end();
