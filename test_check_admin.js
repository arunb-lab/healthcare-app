const http = require('http');

// Test to find existing admin
function testFindAdmin() {
    console.log('--- Checking for Existing Admin ---');
    
    // Try common admin credentials
    const adminCredentials = [
        { email: "admin@healthcare.com", password: "admin123" },
        { email: "admin@example.com", password: "admin123" },
        { email: "admin@test.com", password: "admin123" },
        { email: "admin@localhost.com", password: "admin123" },
        { email: "admin", password: "admin" },
        { email: "admin", password: "123456" }
    ];

    let attempts = 0;
    
    function tryNextCredential() {
        if (attempts >= adminCredentials.length) {
            console.log('❌ No valid admin credentials found');
            testDoctorFeatures();
            return;
        }

        const credential = adminCredentials[attempts];
        console.log(`Trying: ${credential.email} / ${credential.password}`);
        
        const loginData = JSON.stringify(credential);

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
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.token) {
                        console.log(`✅ Admin login successful with: ${credential.email}`);
                        testAdminFeatures(response.token);
                    } else {
                        attempts++;
                        tryNextCredential();
                    }
                } catch (e) {
                    attempts++;
                    tryNextCredential();
                }
            });
        });

        req.on('error', (e) => {
            console.error(`Problem with admin login attempt ${attempts}: ${e.message}`);
            attempts++;
            tryNextCredential();
        });

        req.write(loginData);
        req.end();
    }

    tryNextCredential();
}

function testAdminFeatures(adminToken) {
    console.log('\n--- Testing Admin Features ---');
    
    // Test user management
    testUserManagement(adminToken);
    
    // Test doctor verification
    setTimeout(() => testDoctorVerification(adminToken), 1000);
    
    // Test appointments overview
    setTimeout(() => testAppointmentsOverview(adminToken), 2000);
    
    // Test reports
    setTimeout(() => testReports(adminToken), 3000);
}

function testUserManagement(adminToken) {
    console.log('\n--- Testing User Management ---');
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/admin/users',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        console.log(`User Management Status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const users = JSON.parse(data);
                console.log('✅ Users retrieved:', users.length || users.count || 'Data received');
                if (users.users) {
                    console.log('Sample users:', users.users.slice(0, 2).map(u => ({ name: u.username, role: u.role })));
                }
            } catch (e) {
                console.log('Error parsing users:', e.message);
                console.log('Raw response:', data);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with user management: ${e.message}`);
    });

    req.end();
}

function testDoctorVerification(adminToken) {
    console.log('\n--- Testing Doctor Verification ---');
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/admin/unverified-doctors',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        console.log(`Doctor Verification Status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const doctors = JSON.parse(data);
                console.log('✅ Unverified doctors retrieved:', doctors.length || doctors.count || 'Data received');
                if (doctors.length > 0) {
                    console.log('Sample unverified doctor:', doctors[0].name);
                }
            } catch (e) {
                console.log('Error parsing unverified doctors:', e.message);
                console.log('Raw response:', data);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with doctor verification: ${e.message}`);
    });

    req.end();
}

function testAppointmentsOverview(adminToken) {
    console.log('\n--- Testing Appointments Overview ---');
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/admin/appointments',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        console.log(`Appointments Overview Status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const appointments = JSON.parse(data);
                console.log('✅ Appointments overview retrieved:', appointments.length || appointments.count || 'Data received');
            } catch (e) {
                console.log('Error parsing appointments overview:', e.message);
                console.log('Raw response:', data);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with appointments overview: ${e.message}`);
    });

    req.end();
}

function testReports(adminToken) {
    console.log('\n--- Testing Reports ---');
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/admin/reports',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        console.log(`Reports Status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const reports = JSON.parse(data);
                console.log('✅ Reports retrieved successfully');
                if (reports.totalUsers !== undefined) {
                    console.log('Total users:', reports.totalUsers);
                    console.log('Total doctors:', reports.totalDoctors);
                    console.log('Total patients:', reports.totalPatients);
                    console.log('Total appointments:', reports.totalAppointments);
                }
            } catch (e) {
                console.log('Error parsing reports:', e.message);
                console.log('Raw response:', data);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with reports: ${e.message}`);
    });

    req.end();
}

function testDoctorFeatures() {
    console.log('\n--- Testing Doctor Features (since admin not available) ---');
    
    // Login as doctor
    const doctorLoginData = JSON.stringify({
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
            'Content-Length': doctorLoginData.length
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                if (response.token) {
                    console.log('✅ Doctor login successful');
                    testDoctorDashboard(response.token);
                } else {
                    console.log('❌ Doctor login failed:', response.message);
                }
            } catch (e) {
                console.log('Error parsing doctor login:', e.message);
            }
        });
    });

    req.write(doctorLoginData);
    req.end();
}

function testDoctorDashboard(doctorToken) {
    console.log('\n--- Testing Doctor Dashboard ---');
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/doctors/appointments/my',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${doctorToken}`,
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        console.log(`Doctor Appointments Status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const appointments = JSON.parse(data);
                console.log('✅ Doctor appointments retrieved:', appointments.length || appointments.count || 'Data received');
            } catch (e) {
                console.log('Error parsing doctor appointments:', e.message);
                console.log('Raw response:', data);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with doctor appointments: ${e.message}`);
    });

    req.end();
}

testFindAdmin();
