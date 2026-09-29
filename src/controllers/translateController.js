const translate = require("google-translate-api-x");
const logger = require("../utils/logger");
const { STATUS_CODES, SUPPORTED_LANGUAGES } = require("../config/config");

// Servidor: Caché en memoria para respuestas ultra-rápidas (0ms)
const serverTranslationCache = new Map();
const MAX_SERVER_CACHE_ENTRIES = 5000;

function getCachedTranslation(targetLanguage, str) {
  return serverTranslationCache.get(`${targetLanguage}:${str}`);
}

function setCachedTranslation(targetLanguage, str, translatedStr) {
  if (serverTranslationCache.size >= MAX_SERVER_CACHE_ENTRIES) {
    const iterator = serverTranslationCache.keys();
    for (let i = 0; i < 500; i++) {
      const nextKey = iterator.next().value;
      if (nextKey) serverTranslationCache.delete(nextKey);
      else break;
    }
  }
  serverTranslationCache.set(`${targetLanguage}:${str}`, translatedStr);
}

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
      const results = new Array(texts.length);
      const missingTexts = [];
      const missingIndices = [];

      for (let i = 0; i < texts.length; i++) {
        const original = texts[i];
        const cached = getCachedTranslation(targetLanguage, original);
        if (cached !== undefined) {
          results[i] = cached;
        } else {
          missingTexts.push(original);
          missingIndices.push(i);
        }
      }

      // Si todo estaba en caché, responder de inmediato
      if (missingTexts.length === 0) {
        return res.status(STATUS_CODES.OK).json({ translatedTexts: results });
      }

      // Traducir únicamente los textos faltantes con forceBatch: true (alta velocidad)
      const result = await translate(missingTexts, {
        to: targetLanguage,
        rejectOnPartialFail: false,
        forceBatch: true
      });

      const translatedBatch = Array.isArray(result)
        ? result.map((r, idx) => (r && r.text ? r.text : missingTexts[idx]))
        : [result.text || missingTexts[0]];

      for (let k = 0; k < missingIndices.length; k++) {
        const orig = missingTexts[k];
        const trans = translatedBatch[k] || orig;
        const targetIndex = missingIndices[k];
        results[targetIndex] = trans;
        setCachedTranslation(targetLanguage, orig, trans);
      }

      logger.info(`Lote: ${texts.length} textos (${missingTexts.length} vía red, ${texts.length - missingTexts.length} en caché servidor) a ${targetLanguage}`);
      return res.status(STATUS_CODES.OK).json({ translatedTexts: results });
    }

    // Texto unitario
    const cachedSingle = getCachedTranslation(targetLanguage, text);
    if (cachedSingle !== undefined) {
      return res.status(STATUS_CODES.OK).json({ translatedText: cachedSingle });
    }

    const result = await translate(text, { to: targetLanguage });
    const translatedText = result.text || text;
    setCachedTranslation(targetLanguage, text, translatedText);
    logger.info(`Texto traducido a ${targetLanguage}`);
    return res.status(STATUS_CODES.OK).json({ translatedText });
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