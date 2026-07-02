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
  
  console.log("Fetching employees list...");
  const empRes = await axios.get('http://localhost:3000/api/admin/employees', { headers });
  
  const adminFound = empRes.data.some(emp => emp.username === 'admin');
  console.log(`Admin found in employee listing? ${adminFound ? 'YES' : 'NO'}`);
  console.log("List of users returned:");
  empRes.data.forEach(emp => {
    console.log(`- ${emp.name} (${emp.username}) - Role: ${emp.role}`);
  });
}

main().catch(console.error);
