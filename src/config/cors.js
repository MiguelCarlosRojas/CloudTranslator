const cors = require("cors");

// Divide la string de orígenes permitidos desde el .env en un array
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