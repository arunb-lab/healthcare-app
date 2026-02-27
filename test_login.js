const http = require('http');

// Test user login
const testData = JSON.stringify({
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
        'Content-Length': testData.length
    }
};

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('Response:', data);
        const response = JSON.parse(data);
        if (response.token) {
            console.log('✅ Login successful! Token received');
            testProtectedRoutes(response.token);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(testData);
req.end();

// Test protected routes
function testProtectedRoutes(token) {
    console.log('\n--- Testing Protected Routes ---');
    
    const testData = JSON.stringify({});
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/users/profile',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Content-Length': testData.length
        }
    };

    const req = http.request(options, (res) => {
        console.log(`Profile Status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('Profile Response:', data);
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with profile request: ${e.message}`);
    });

    req.write(testData);
    req.end();
}
