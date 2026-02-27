const http = require('http');

// Test doctor search to get profile ID
function testDoctorSearch() {
    console.log('--- Testing Doctor Search ---');
    
    // First login as patient to get token
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
                searchDoctors(response.token);
            }
        });
    });

    req.write(patientLoginData);
    req.end();
}

function searchDoctors(patientToken) {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/doctors',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${patientToken}`,
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        console.log(`Doctor Search Status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('Doctor Search Response:', data);
            const doctors = JSON.parse(data);
            if (doctors.length > 0) {
                console.log('✅ Found doctors:', doctors.length);
                const doctorProfileId = doctors[0]._id;
                console.log('Using doctor profile ID:', doctorProfileId);
                bookAppointmentWithCorrectId(patientToken, doctorProfileId);
            } else {
                console.log('❌ No doctors found');
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with doctor search: ${e.message}`);
    });

    req.end();
}

function bookAppointmentWithCorrectId(patientToken, doctorProfileId) {
    console.log('\n--- Testing Appointment Booking with Correct ID ---');
    
    const appointmentData = JSON.stringify({
        doctorId: doctorProfileId,
        appointmentDate: "2026-02-25",
        appointmentTime: "10:00",
        reason: "Regular checkup"
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
            if (res.statusCode === 201) {
                console.log('✅ Appointment booked successfully!');
                testMyAppointments(patientToken);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with appointment booking: ${e.message}`);
    });

    req.write(appointmentData);
    req.end();
}

function testMyAppointments(patientToken) {
    console.log('\n--- Testing My Appointments ---');
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/appointments/my',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${patientToken}`,
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        console.log(`My Appointments Status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('My Appointments Response:', data);
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with my appointments: ${e.message}`);
    });

    req.end();
}

testDoctorSearch();
