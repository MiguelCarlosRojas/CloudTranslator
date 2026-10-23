/**
 * Middlewares de Vork
 */
const cleanUrl = require("./cleanUrl");
const securityHeaders = require("./securityHeaders");
const compressionMiddleware = require("./compressionMiddleware");
const validateRequest = require("./validateRequest");
const errorHandler = require("./errorHandler");
const rateLimiter = require("./rateLimiter");

module.exports = {
  cleanUrl,
  securityHeaders,
  compressionMiddleware,
  validateRequest,
  errorHandler,
  rateLimiter
};
