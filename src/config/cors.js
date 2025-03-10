const cors = require("cors");

// Configuración de CORS simple permitiendo todo con GET y POST
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
};

module.exports = cors(corsOptions);