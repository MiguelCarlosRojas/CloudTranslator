const translate = require("google-translate-api-x");
const logger = require("../utils/logger");
const { STATUS_CODES, SUPPORTED_LANGUAGES } = require("../config/config");

/**
 * @desc Traduce texto o lista de textos a un idioma objetivo
 * @param {Object} req - Request con text o texts y targetLanguage
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
exports.translateText = async (req, res, next) => {
  const data = req.method === "GET" ? req.query : req.body;
  const { text, texts, targetLanguage } = data;

  try {
    if (texts && Array.isArray(texts)) {
      const result = await translate(texts, {
        to: targetLanguage,
        rejectOnPartialFail: false,
        forceBatch: false
      });
      const translatedTexts = Array.isArray(result) 
        ? result.map((r, idx) => (r && r.text ? r.text : texts[idx])) 
        : [result.text || texts[0]];
      logger.info(`Lista de ${texts.length} textos traducida a ${targetLanguage}`);
      return res.status(STATUS_CODES.OK).json({ translatedTexts });
    }

    const result = await translate(text, { to: targetLanguage });
    logger.info(`Texto traducido a ${targetLanguage}`);
    return res.status(STATUS_CODES.OK).json({ translatedText: result.text });
  } catch (error) {
    logger.error(`Error al traducir: ${error.message}`);
    next(error);
  }
};

/**
 * @desc Lista de idiomas soportados
 */
exports.getLanguages = (req, res) => {
  res.status(STATUS_CODES.OK).json({
    success: true,
    languages: SUPPORTED_LANGUAGES
  });
};

/**
 * @desc Estado de salud del servicio
 */
exports.getHealth = (req, res) => {
  res.status(STATUS_CODES.OK).json({
    success: true,
    status: "ok",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
};