const http = require('http');

// simple test to make sure the /payments/khalti/verify endpoint responds
process.env.KHALTI_TEST = 'true';

const data = JSON.stringify({ token: 'test', amount: 12345 });
const options = {
    hostname: 'localhost', port: 3000, path: '/payments/khalti/verify', method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        console.log('Status', res.statusCode);
        console.log('Response:', body);
    });
});
req.on('error', err => console.error('Error:', err));
req.write(data);
req.end();
