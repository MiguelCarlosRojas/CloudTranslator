const fs = require("fs");
const path = require("path");
const winston = require("winston");

// Asegurar que el directorio de logs exista para evitar excepciones en entornos efímeros (Render)
const logsDir = path.join(__dirname, "../../logs");
if (!fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir, { recursive: true });
  } catch (e) {}
}

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: path.join(logsDir, "error.log"), 
      level: "error" 
    }),
    new winston.transports.File({ 
      filename: path.join(logsDir, "combined.log") 
    })
  ]
});

module.exports = logger;