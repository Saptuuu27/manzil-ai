require('dotenv').config({ path: './backend/.env' });
const axios = require('axios');

async function testFast2SMS() {
  try {
    const resp = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        route: 'q',
        message: 'Test OTP is 123456',
        language: 'english',
        flash: 0,
        numbers: '9999999999', // replace with a dummy number
      },
      {
        headers: { authorization: process.env.FAST2SMS_API_KEY }
      }
    );
    console.log(resp.data);
  } catch (err) {
    console.log('ERROR:', err.response?.data || err.message);
  }
}
testFast2SMS();
