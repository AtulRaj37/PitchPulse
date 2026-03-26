const axios = require('axios');
async function test() {
  try {
    const res = await axios.post('http://localhost:3000/api/v1/commands/score-run', {
      matchId: '12345678-1234-1234-1234-123456789012',
      runs: 1,
      batsmanId: '12345678-1234-1234-1234-123456789012',
      bowlerId: '12345678-1234-1234-1234-123456789012'
    });
    console.log(res.data);
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}
test();
