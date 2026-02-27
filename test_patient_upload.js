const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Test patient file upload
const testPatientUpload = async () => {
  try {
    console.log('--- Testing Patient File Upload ---');
    
    // Step 1: Login as patient
    console.log('1. Logging in as patient...');
    const loginResponse = await axios.post('http://localhost:3000/users/login', {
      email: 'test@example.com',
      password: '123456'
    });
    
    if (!loginResponse.data.token) {
      console.log('❌ Patient login failed');
      return;
    }
    
    console.log('✅ Patient login successful');
    const token = loginResponse.data.token;
    
    // Step 2: Get available doctors
    console.log('2. Getting available doctors...');
    const doctorsResponse = await axios.get('http://localhost:3000/chat/available-doctors', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (doctorsResponse.data.length === 0) {
      console.log('❌ No available doctors');
      return;
    }
    
    console.log(`✅ Found ${doctorsResponse.data.length} available doctors`);
    const doctorId = doctorsResponse.data[0].id;
    
    // Step 3: Create conversation
    console.log('3. Creating conversation...');
    const convResponse = await axios.post('http://localhost:3000/chat/conversations', {
      doctorId: doctorId
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Conversation created');
    const conversationId = convResponse.data._id;
    
    // Step 4: Create a test file
    console.log('4. Creating test PDF file...');
    const testFilePath = path.join(__dirname, 'test-prescription.pdf');
    
    // Create a minimal PDF file (simple PDF header)
    const pdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Test Prescription) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000203 00000 n\ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n312\n%%EOF');
    fs.writeFileSync(testFilePath, pdfContent);
    
    // Step 5: Upload file
    console.log('5. Uploading file...');
    const formData = new FormData();
    formData.append('prescription', fs.createReadStream(testFilePath));
    
    const uploadResponse = await axios.post(
      `http://localhost:3000/chat/conversations/${conversationId}/prescription`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ...formData.getHeaders()
        }
      }
    );
    
    console.log('✅ File uploaded successfully!');
    console.log('Upload response:', uploadResponse.data);
    
    // Step 6: Get messages to verify
    console.log('6. Verifying upload in messages...');
    const messagesResponse = await axios.get(
      `http://localhost:3000/chat/conversations/${conversationId}/messages`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    const prescriptionMessages = messagesResponse.data.filter(m => m.type === 'prescription');
    console.log(`✅ Found ${prescriptionMessages.length} prescription messages`);
    
    if (prescriptionMessages.length > 0) {
      console.log('Latest prescription message:', {
        id: prescriptionMessages[0]._id,
        fileName: prescriptionMessages[0].prescriptionFileName,
        senderRole: prescriptionMessages[0].senderRole,
        type: prescriptionMessages[0].type
      });
    }
    
    // Clean up
    fs.unlinkSync(testFilePath);
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
};

testPatientUpload();
