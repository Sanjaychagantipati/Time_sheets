const axios = require('axios');

async function main() {
  console.log("Simulating Login...");
  const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
    username: 'admin',
    password: 'admin123'
  });
  
  const token = loginRes.data.token;
  console.log("Logged in.");
  
  const headers = {
    Authorization: `Bearer ${token}`
  };
  
  console.log("Fetching monthly-attendance PDF...");
  try {
    const res = await axios.get('http://localhost:3000/api/reports/monthly-attendance', {
      params: {
        employeeId: '1def9e4a-6592-4c47-b9c5-b486f5aca62e',
        month: 7,
        year: 2026
      },
      headers
    });
    console.log("PDF Success! Size:", res.data.length);
  } catch (err) {
    console.log("PDF Failed:", err.response?.status, err.response?.data);
  }
}

main().catch(console.error);
