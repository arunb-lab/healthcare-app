const http = require('http');

process.env.KHALTI_TEST = 'true';

// Test complete appointment flow
function testCompleteFlow() {
    console.log('--- Testing Complete Appointment Flow ---');
    
    // Login as patient
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
                console.log('✅ Patient login successful');
                searchDoctorsAndBook(response.token);
            }
        });
    });

    req.write(patientLoginData);
    req.end();
}

function searchDoctorsAndBook(patientToken) {
    console.log('\n--- Searching Doctors ---');
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/doctors/search',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${patientToken}`,
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const searchResponse = JSON.parse(data);
                console.log('✅ Doctors found:', searchResponse.count);
                
                if (searchResponse.doctors && searchResponse.doctors.length > 0) {
                    const firstDoctor = searchResponse.doctors[0];
                    console.log('Selected doctor:', firstDoctor.name);
                    bookAppointment(patientToken, firstDoctor.id);
                } else {
                    console.log('❌ No doctors available');
                }
            } catch (e) {
                console.log('Error parsing doctor search:', e.message);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with doctor search: ${e.message}`);
    });

    req.end();
}

function bookAppointment(patientToken, doctorId) {
    console.log('\n--- Booking Appointment ---');
    
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
            try {
                const appointmentResponse = JSON.parse(data);
                if (res.statusCode === 201) {
                    console.log('✅ Appointment booked successfully!');
                    console.log('Appointment ID:', appointmentResponse.appointment?.id);
                    testMyAppointments(patientToken);
                } else {
                    console.log('❌ Appointment booking failed:', appointmentResponse.message);
                }
            } catch (e) {
                console.log('Error parsing appointment response:', e.message);
                console.log('Raw response:', data);
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
            try {
                const appointments = JSON.parse(data);
                console.log('✅ Appointments retrieved:', appointments.length);
                appointments.forEach((apt, index) => {
                    console.log(`Appointment ${index + 1}:`, apt.status, apt.reason);
                });
            } catch (e) {
                console.log('Error parsing appointments:', e.message);
                console.log('Raw response:', data);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with my appointments: ${e.message}`);
    });

    req.end();
}

testCompleteFlow();
