const http = require('http');

// Test admin functionality
function testAdminSystem() {
    console.log('--- Testing Admin System ---');
    
    // First, let's check if admin exists and login
    const adminLoginData = JSON.stringify({
        email: "admin@healthcare.com",
        password: "admin123"
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/users/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': adminLoginData.length
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
                    console.log('✅ Admin login successful');
                    testAdminFeatures(response.token);
                } else {
                    console.log('❌ Admin login failed:', response.message);
                    console.log('Trying to create admin user...');
                    // Try default admin credentials
                    testDefaultAdmin();
                }
            } catch (e) {
                console.log('Error parsing admin login:', e.message);
                testDefaultAdmin();
            }
        });
    });

    req.write(adminLoginData);
    req.end();
}

function testDefaultAdmin() {
    const adminLoginData = JSON.stringify({
        email: "admin@example.com",
        password: "admin123"
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/users/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': adminLoginData.length
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
                    console.log('✅ Default admin login successful');
                    testAdminFeatures(response.token);
                } else {
                    console.log('❌ Default admin login failed:', response.message);
                    console.log('Admin credentials not working. Check .env file for admin credentials.');
                }
            } catch (e) {
                console.log('Error parsing default admin login:', e.message);
            }
        });
    });

    req.write(adminLoginData);
    req.end();
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
                console.log('✅ Users retrieved:', users.length || users.count);
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
                console.log('✅ Unverified doctors retrieved:', doctors.length || doctors.count);
                if (doctors.length > 0) {
                    console.log('Sample unverified doctor:', doctors[0].name);
                    // Test doctor approval
                    testDoctorApproval(adminToken, doctors[0]._id);
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

function testDoctorApproval(adminToken, doctorId) {
    console.log('\n--- Testing Doctor Approval ---');
    
    const approvalData = JSON.stringify({
        doctorId: doctorId,
        action: 'approve'
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/admin/verify-doctor',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
            'Content-Length': approvalData.length
        }
    };

    const req = http.request(options, (res) => {
        console.log(`Doctor Approval Status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                if (res.statusCode === 200) {
                    console.log('✅ Doctor approved successfully');
                } else {
                    console.log('❌ Doctor approval failed:', response.message);
                }
            } catch (e) {
                console.log('Error parsing doctor approval:', e.message);
                console.log('Raw response:', data);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with doctor approval: ${e.message}`);
    });

    req.write(approvalData);
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
                console.log('✅ Appointments overview retrieved:', appointments.length || appointments.count);
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
                console.log('Total users:', reports.totalUsers);
                console.log('Total doctors:', reports.totalDoctors);
                console.log('Total patients:', reports.totalPatients);
                console.log('Total appointments:', reports.totalAppointments);
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

testAdminSystem();
