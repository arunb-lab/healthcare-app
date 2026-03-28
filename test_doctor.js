const http = require('http');

// run integration tests in payment test mode (skips real Khalti calls)
process.env.KHALTI_TEST = 'true';

// Test doctor registration
const testData = JSON.stringify({
    username: "testdoctor",
    email: "doctor@example.com",
    password: "123456",
    role: "doctor",
    specialization: "Cardiology",
    licenseNumber: "DOC123456",
    qualifications: ["MBBS", "MD"],
    experience: 5,
    bio: "Experienced cardiologist",
    consultationFee: 1000
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/users/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': testData.length
    }
};

const req = http.request(options, (res) => {
    console.log(`Doctor Registration Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('Doctor Registration Response:', data);
        if (res.statusCode === 201) {
            console.log('✅ Doctor registered successfully');
            testDoctorLogin();
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(testData);
req.end();

// Test doctor login
function testDoctorLogin() {
    console.log('\n--- Testing Doctor Login ---');
    
    const loginData = JSON.stringify({
        email: "doctor@example.com",
        password: "123456"
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/users/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': loginData.length
        }
    };

    const req = http.request(options, (res) => {
        console.log(`Doctor Login Status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('Doctor Login Response:', data);
            const response = JSON.parse(data);
            if (response.token) {
                console.log('✅ Doctor login successful!');
                testAppointmentBooking(response.token, response.user.id);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with doctor login: ${e.message}`);
    });

    req.write(loginData);
    req.end();
}

// Test appointment booking
function testAppointmentBooking(doctorToken, doctorId) {
    console.log('\n--- Testing Appointment Booking ---');
    
    // First login as patient to get patient token
    const patientLoginData = JSON.stringify({
        email: "test@example.com",
        password: "123456"
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/users/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': patientLoginData.length
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            const response = JSON.parse(data);
            if (response.token) {
                bookAppointment(response.token, doctorId);
            }
        });
    });

    req.write(patientLoginData);
    req.end();
}

function bookAppointment(patientToken, doctorId) {
    const appointmentData = JSON.stringify({
        doctorId: doctorId,
        appointmentDate: "2026-02-25",
        appointmentTime: "10:00",
        reason: "Regular checkup",
        paymentToken: "test",
        paymentAmount: 0
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/appointments/book',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${patientToken}`,
            'Content-Type': 'application/json',
            'Content-Length': appointmentData.length
        }
    };

    const req = http.request(options, (res) => {
        console.log(`Appointment Booking Status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('Appointment Booking Response:', data);
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with appointment booking: ${e.message}`);
    });

    req.write(appointmentData);
    req.end();
}
