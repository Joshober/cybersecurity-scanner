// Should trigger: crypto.tls.reject-unauthorized
const https = require("https");
const options = {
  hostname: "api.example.com",
  rejectUnauthorized: false,
};
