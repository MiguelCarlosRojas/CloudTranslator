const cors = require("cors");

// Configuración flexible y segura de CORS:
// Permite especificar dominios autorizados en producción mediante la variable CORS_ORIGIN
// Si no se especifica, permite acceso público (*) manteniendo cabeceras seguras
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map(o => o.trim())
  : "*";

module.exports = cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "OPTIONS", "HEAD"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  optionsSuccessStatus: 204
});
