const fs = require("fs");

const privateKey = fs.readFileSync("./certificates/private.key", "utf8");
const certificate = fs.readFileSync("./certificates/certificate.crt", "utf8");

module.exports = {
  key: privateKey,
  cert: certificate,
};
