const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { userId: "123", email: "test@test.com", role: "ADMIN" },
  "your-super-secret-jwt-key-minimum-32-characters-long",
  { expiresIn: "24h" }
);

console.log("Token:", token);

try {
  const decoded = jwt.verify(token, "your-super-secret-jwt-key-minimum-32-characters-long");
  console.log("Decoded:", decoded);
  console.log("Current Time:", Math.floor(Date.now() / 1000));
  console.log("Exp Time:", decoded.exp);
  console.log("Difference:", decoded.exp - Math.floor(Date.now() / 1000), "seconds");
} catch (e) {
  console.error(e.message);
}
