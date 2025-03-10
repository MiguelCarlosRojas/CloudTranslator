const cors = require("cors");

// Convertir la string de ALLOWED_ORIGINS en array
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(",");

module.exports = cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
});