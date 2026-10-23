const logger = require("../utils/logger");
const { STATUS_CODES } = require("../config/config");

module.exports = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || STATUS_CODES.SERVER_ERROR || 500;
  const isProd = process.env.NODE_ENV === "production";

  // Registro detallado en logs internos protegidos
  logger.error(`[${req.method} ${req.originalUrl}] Error ${statusCode}: ${err.message}${err.stack ? `\n${err.stack}` : ""}`);

  // En producción, sanitizar errores 500 para evitar fugas de rutas o tecnologías del backend
  let message = err.message || "Internal Server Error";
  if (statusCode >= 500 && isProd) {
    message = "Ha ocurrido un error interno en el servidor. Por favor inténtelo más tarde.";
  }

  // Prevenir respuestas duplicadas si las cabeceras ya fueron enviadas (ej: durante streaming)
  if (res.headersSent) {
    return next(err);
  }

  res.status(statusCode).json({
    status: "error",
    success: false,
    statusCode,
    error: message
  });
};
