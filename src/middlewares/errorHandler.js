const logger = require("../utils/logger");
const { STATUS_CODES } = require("../config/config");

module.exports = (err, req, res, next) => {
  const statusCode = err.statusCode || STATUS_CODES.SERVER_ERROR;
  const message = err.message || "Internal Server Error";

  logger.error(`Error ${statusCode}: ${message}`);
  
  res.status(statusCode).json({
    success: false,
    error: message
  });
};