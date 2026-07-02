const axios = require('axios');

async function main() {
  console.log("Simulating Login...");
  const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
    username: 'sanjay',
    password: 'emp123'
  });
  
  const token = loginRes.data.token;
  console.log("Logged in. Token:", token ? "FOUND" : "MISSING");
  
  const headers = {
    Authorization: `Bearer ${token}`
  };
  
  console.log("Simulating Clock-In...");
  try {
    const clockinRes = await axios.post('http://localhost:3000/api/timesheets/clock-in', {
      clientElapsedMs: 0
    }, { headers });
    console.log("Clock-In Success:", clockinRes.data);
  } catch (err) {
    console.log("Clock-In Failed:", err.response?.status, err.response?.data);
  }
}

main().catch(console.error);
