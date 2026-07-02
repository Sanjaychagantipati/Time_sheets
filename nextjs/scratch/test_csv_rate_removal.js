const axios = require('axios');

async function main() {
  console.log("Logging in as admin...");
  const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
    username: 'admin',
    password: 'admin123'
  });
  
  const token = loginRes.data.token;
  const headers = {
    Authorization: `Bearer ${token}`
  };
  
  console.log("Fetching Master CSV...");
  const csvRes = await axios.get('http://localhost:3000/api/reports/export-master', { headers });
  
  const lines = csvRes.data.split('\n');
  console.log("CSV Header:");
  console.log(lines[0]);
  console.log("First Data Row:");
  console.log(lines[1]);
}

main().catch(console.error);
