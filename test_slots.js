const axios = require('axios');
async function test() {
  try {
    const res = await axios.get('http://localhost:3000/doctors/slots/69d48513e9267c53a9fadb93?date=2026-04-14');
    console.log('SUCCESS:', res.data);
  } catch (err) {
    console.log('ERROR:', err.response?.status, err.response?.data);
  }
}
test();
