const http = require('http');

// Test doctor registration with location data
const doctorData = JSON.stringify({
    username: "drtestuser",
    email: "drtest@example.com",
    password: "password123",
    role: "doctor",
    phone: "9876543210",
    address: "123 Test Street",
    dateOfBirth: "1990-01-01",
    specialization: "Cardiology",
    licenseNumber: "TEST-LICENSE-123",
    qualifications: ["MBBS", "MD - Cardiology"],
    experience: 5,
    bio: "Test doctor for location functionality",
    consultationFee: 1500,
    // Required clinic and location fields
    clinicName: "Test Heart Clinic",
    clinicAddress: "456 Medical Road",
    clinicCity: "Kathmandu",
    clinicState: "Bagmati",
    clinicPostalCode: "44600",
    clinicPhone: "01-4567890",
    clinicEmail: "info@testclinic.com",
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
    console.log('Headers:', JSON.stringify(res.headers, null, 2));
    
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
                console.log('User ID:', response.userId);
                console.log('Role:', response.role);
                console.log('Requires verification:', response.requiresVerification);
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
