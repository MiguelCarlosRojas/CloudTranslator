/**
 * server.js
 * Punto de entrada del servidor Vork con protección anti-crash y graceful shutdown.
 */
const app = require("./app");
const { PORT } = require("./config/config");
const logger = require("./utils/logger");

// Inicio del servidor con timeouts ajustados para Render Free Tier (evita caídas 502 por Keep-Alive)
const server = app.listen(PORT, () => {
  logger.info(`Servidor Vork escuchando en puerto ${PORT}`);
});

server.keepAliveTimeout = 65000; // Supera el timeout de 60s del reverse proxy de Render
server.headersTimeout = 66000;

// Cierre Seguro y Captura de Errores Globales (Graceful Shutdown & Anti-Crash)
function handleGracefulShutdown(signal) {
  logger.info(`Recibida señal ${signal}. Cerrando servidor HTTP de forma ordenada...`);
  server.close(() => {
    logger.info("Servidor HTTP cerrado exitosamente.");
    process.exit(0);
  });

  setTimeout(() => {
    logger.error("Tiempo de espera agotado para el cierre graceful. Forzando terminación.");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGTERM", () => handleGracefulShutdown("SIGTERM"));
process.on("SIGINT", () => handleGracefulShutdown("SIGINT"));

process.on("uncaughtException", (err) => {
  logger.error(`Excepción no capturada (uncaughtException): ${err.message}\n${err.stack}`);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error(`Promesa rechazada no manejada (unhandledRejection) en ${promise}: ${reason}`);
});

module.exports = { app, server };
