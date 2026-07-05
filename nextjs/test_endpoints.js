async function testVapidKey() {
  try {
    const res = await fetch('http://localhost:3000/api/notifications/vapid-public-key');
    console.log("Status:", res.status);
    const json = await res.json();
    console.log("JSON:", json);
  } catch (err) {
    console.error("Error:", err.message);
  }
}
testVapidKey();
