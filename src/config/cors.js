const cors = require("cors");

module.exports = cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS", "HEAD"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  optionsSuccessStatus: 204
});