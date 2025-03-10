const translate = require("google-translate-api-x");
const logger = require("../utils/logger");
const { STATUS_CODES } = require("../config/config");

/**
 * @desc Traduce texto a un idioma objetivo
 * @param {Object} req - Request con text y targetLanguage
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
exports.translateText = async (req, res, next) => {
  const { text, targetLanguage } = req.body;

  try {
    const result = await translate(text, { to: targetLanguage });
    logger.info(`Texto traducido a ${targetLanguage}`);
    res.status(STATUS_CODES.OK).json({ translatedText: result.text });
  } catch (error) {
    logger.error(`Error al traducir: ${error.message}`);
    next(error);
  }
};