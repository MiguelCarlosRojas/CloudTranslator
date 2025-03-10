const cors = require("cors");
require("dotenv").config();

module.exports = cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.ALLOWED_ORIGIN_LOCAL,
      process.env.ALLOWED_ORIGIN_PROD,
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
});