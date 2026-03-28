const http = require('http');

// Test user registration
const testData = JSON.stringify({
    username: "testpatient" + Date.now(),
    email: "test" + Date.now() + "@example.com",
    password: "123456",
    role: "patient"
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
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('Response:', data);
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(testData);
req.end();
