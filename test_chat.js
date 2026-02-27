const http = require('http');

// Test chat functionality
function testChatSystem() {
    console.log('--- Testing Chat System ---');
    
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
                testAvailableDoctors(response.token);
            }
        });
    });

    req.write(patientLoginData);
    req.end();
}

function testAvailableDoctors(patientToken) {
    console.log('\n--- Testing Available Doctors for Chat ---');
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/chat/available-doctors',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${patientToken}`,
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        console.log(`Available Doctors Status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const doctors = JSON.parse(data);
                console.log('✅ Available doctors for chat:', doctors.length);
                if (doctors.length > 0) {
                    console.log('First available doctor:', doctors[0].name);
                    testCreateConversation(patientToken, doctors[0].id);
                } else {
                    console.log('❌ No doctors available for chat');
                }
            } catch (e) {
                console.log('Error parsing available doctors:', e.message);
                console.log('Raw response:', data);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with available doctors: ${e.message}`);
    });

    req.end();
}

function testCreateConversation(patientToken, doctorId) {
    console.log('\n--- Testing Create Conversation ---');
    
    const conversationData = JSON.stringify({
        doctorId: doctorId
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/chat/conversations',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${patientToken}`,
            'Content-Type': 'application/json',
            'Content-Length': conversationData.length
        }
    };

    const req = http.request(options, (res) => {
        console.log(`Create Conversation Status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const conversation = JSON.parse(data);
                if (res.statusCode === 200 || res.statusCode === 201) {
                    console.log('✅ Conversation created/retrieved successfully');
                    console.log('Conversation ID:', conversation._id || conversation.id);
                    testSendMessage(patientToken, conversation._id || conversation.id);
                } else {
                    console.log('❌ Conversation creation failed:', conversation.message);
                }
            } catch (e) {
                console.log('Error parsing conversation:', e.message);
                console.log('Raw response:', data);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with conversation creation: ${e.message}`);
    });

    req.write(conversationData);
    req.end();
}

function testSendMessage(patientToken, conversationId) {
    console.log('\n--- Testing Send Message ---');
    
    const messageData = JSON.stringify({
        content: "Hello doctor, I have a question about my appointment"
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: `/chat/conversations/${conversationId}/messages`,
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${patientToken}`,
            'Content-Type': 'application/json',
            'Content-Length': messageData.length
        }
    };

    const req = http.request(options, (res) => {
        console.log(`Send Message Status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const message = JSON.parse(data);
                if (res.statusCode === 201) {
                    console.log('✅ Message sent successfully');
                    console.log('Message ID:', message._id || message.id);
                    testGetMessages(patientToken, conversationId);
                } else {
                    console.log('❌ Message sending failed:', message.message);
                }
            } catch (e) {
                console.log('Error parsing message:', e.message);
                console.log('Raw response:', data);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with sending message: ${e.message}`);
    });

    req.write(messageData);
    req.end();
}

function testGetMessages(patientToken, conversationId) {
    console.log('\n--- Testing Get Messages ---');
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: `/chat/conversations/${conversationId}/messages`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${patientToken}`,
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        console.log(`Get Messages Status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const messages = JSON.parse(data);
                console.log('✅ Messages retrieved:', messages.length);
                messages.forEach((msg, index) => {
                    console.log(`Message ${index + 1}:`, msg.content, `(${msg.senderRole})`);
                });
            } catch (e) {
                console.log('Error parsing messages:', e.message);
                console.log('Raw response:', data);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with getting messages: ${e.message}`);
    });

    req.end();
}

testChatSystem();
