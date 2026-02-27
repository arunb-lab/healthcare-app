const http = require('http');

// Test admin login with correct credentials from .env
function testAdminLogin() {
    console.log('--- Testing Admin Login with Correct Credentials ---');
    
    // Use the admin credentials from .env file
    const adminLoginData = JSON.stringify({
        email: "admin22@gmail.com",
        password: "Admin@123"
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
                    console.log('✅ Admin login successful!');
                    console.log('Admin user:', response.user.username);
                    console.log('Admin role:', response.user.role);
                    testAdminFeatures(response.token);
                } else {
                    console.log('❌ Admin login failed:', response.message);
                }
            } catch (e) {
                console.log('Error parsing admin login:', e.message);
                console.log('Raw response:', data);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with admin login: ${e.message}`);
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
                console.log('✅ Users retrieved successfully');
                console.log('Total users:', users.length || users.count || 'Data received');
                if (users.users) {
                    console.log('Sample users:', users.users.slice(0, 3).map(u => ({ name: u.username, role: u.role, email: u.email })));
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
                console.log('✅ Unverified doctors retrieved successfully');
                console.log('Unverified doctors count:', doctors.length || doctors.count || 'Data received');
                if (doctors.length > 0) {
                    console.log('Sample unverified doctor:', {
                        name: doctors[0].name,
                        email: doctors[0].email,
                        specialization: doctors[0].specialization
                    });
                    
                    // Test doctor approval
                    testDoctorApproval(adminToken, doctors[0]._id);
                } else {
                    console.log('No unverified doctors found - all doctors are verified');
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
                    console.log('✅ Doctor approved successfully!');
                    console.log('Approval response:', response.message);
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
                console.log('✅ Appointments overview retrieved successfully');
                console.log('Total appointments:', appointments.length || appointments.count || 'Data received');
                if (appointments.length > 0) {
                    console.log('Sample appointment:', {
                        patient: appointments[0].patient?.name,
                        doctor: appointments[0].doctor?.name,
                        status: appointments[0].status,
                        date: appointments[0].appointmentDate
                    });
                }
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
    console.log('\n--- Testing System Reports ---');
    
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
                console.log('✅ System reports retrieved successfully');
                console.log('📊 SYSTEM STATISTICS:');
                console.log(`   Total Users: ${reports.totalUsers || 'N/A'}`);
                console.log(`   Total Doctors: ${reports.totalDoctors || 'N/A'}`);
                console.log(`   Total Patients: ${reports.totalPatients || 'N/A'}`);
                console.log(`   Total Appointments: ${reports.totalAppointments || 'N/A'}`);
                console.log(`   Pending Appointments: ${reports.pendingAppointments || 'N/A'}`);
                console.log(`   Approved Appointments: ${reports.approvedAppointments || 'N/A'}`);
                console.log(`   Completed Appointments: ${reports.completedAppointments || 'N/A'}`);
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

testAdminLogin();
