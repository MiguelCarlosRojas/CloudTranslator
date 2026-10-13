const translate = require("google-translate-api-x");
const { languages } = require("google-translate-api-x");
const logger = require("../utils/logger");
const { STATUS_CODES, POPULAR_LANGUAGES } = require("../config/config");

// Servidor: Caché LRU de alto rendimiento en memoria RAM para respuestas en 0ms
const serverTranslationCache = new Map();
const MAX_SERVER_CACHE_ENTRIES = 10000;
let cacheHitsCount = 0;
let cacheMissesCount = 0;

function getCachedTranslation(targetLanguage, str) {
  const key = `${targetLanguage}:${str}`;
  if (serverTranslationCache.has(key)) {
    const val = serverTranslationCache.get(key);
    // LRU refresh: mover al final
    serverTranslationCache.delete(key);
    serverTranslationCache.set(key, val);
    cacheHitsCount++;
    return val;
  }
  cacheMissesCount++;
  return undefined;
}

function setCachedTranslation(targetLanguage, str, translatedStr) {
  const key = `${targetLanguage}:${str}`;
  if (serverTranslationCache.has(key)) {
    serverTranslationCache.delete(key);
  } else if (serverTranslationCache.size >= MAX_SERVER_CACHE_ENTRIES) {
    // Eliminar los 1,000 registros más antiguos
    const iterator = serverTranslationCache.keys();
    for (let i = 0; i < 1000; i++) {
      const nextKey = iterator.next().value;
      if (nextKey) serverTranslationCache.delete(nextKey);
      else break;
    }
  }
  serverTranslationCache.set(key, translatedStr);
}

// Regex para detectar cadenas que no requieren traducción externa (números, símbolos, espacios)
const NON_TRANSLATABLE_REGEX = /^[\d\s\-_.,:;!?()\[\]{}@#$%&*+=/\\|<>'"~`]*$/;

/**
 * Traduce un lote en paralelo dividiéndolo en fragmentos más pequeños (chunks de 35)
 * para evitar demoras y límites de tasa en la capa gratuita de Render.
 */
async function translateInParallelChunks(uniqueTexts, targetLanguage, sourceLanguage = "auto", chunkSize = 35) {
  const chunks = [];
  for (let i = 0; i < uniqueTexts.length; i += chunkSize) {
    chunks.push(uniqueTexts.slice(i, i + chunkSize));
  }

  const chunkPromises = chunks.map(async (chunk) => {
    try {
      const res = await translate(chunk, {
        to: targetLanguage,
        from: sourceLanguage || "auto",
        rejectOnPartialFail: false,
        forceBatch: true
      });
      return Array.isArray(res)
        ? res.map((r, idx) => (r && r.text ? r.text : chunk[idx]))
        : [res && res.text ? res.text : chunk[0]];
    } catch (chunkError) {
      logger.warn(`Fallback individual para chunk de ${chunk.length} elementos: ${chunkError.message}`);
      // Fallback: traducir individualmente si el lote falla
      const individualResults = await Promise.all(
        chunk.map(async (text) => {
          try {
            const singleRes = await translate(text, {
              to: targetLanguage,
              from: sourceLanguage || "auto"
            });
            return singleRes && singleRes.text ? singleRes.text : text;
          } catch {
            return text; // Preservar texto original si falla
          }
        })
      );
      return individualResults;
    }
  });

  const resolvedChunks = await Promise.all(chunkPromises);
  return resolvedChunks.flat();
}

/**
 * @desc Traduce texto o lista de textos a un idioma objetivo con deduplicación y caché en RAM
 * @param {Object} req - Request con text o texts, targetLanguage, sourceLanguage opcional
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
exports.translateText = async (req, res, next) => {
  const data = req.method === "GET" ? req.query : req.body;
  const { text, texts, targetLanguage, sourceLanguage } = data;

  try {
    // 1. Manejo de Lotes de Texto (/api/translate con texts: [...])
    if (texts && Array.isArray(texts)) {
      const totalCount = texts.length;
      const results = new Array(totalCount);

      // Mapa para deduplicar textos faltantes: originalText -> Array de índices en `results`
      const missingMap = new Map();

      for (let i = 0; i < totalCount; i++) {
        const original = texts[i];

        // Caso A: Texto vacío o solo números/símbolos -> no enviar a red
        if (!original || NON_TRANSLATABLE_REGEX.test(original.trim())) {
          results[i] = original;
          continue;
        }

        // Caso B: Está en caché del servidor (0ms)
        const cached = getCachedTranslation(targetLanguage, original);
        if (cached !== undefined) {
          results[i] = cached;
          continue;
        }

        // Caso C: Faltante para traducir -> agrupar por texto único
        if (!missingMap.has(original)) {
          missingMap.set(original, [i]);
        } else {
          missingMap.get(original).push(i);
        }
      }

      // Si todo se resolvió con la caché o filtros de números, responder de inmediato
      if (missingMap.size === 0) {
        return res.status(STATUS_CODES.OK).json({
          success: true,
          translatedTexts: results,
          targetLanguage,
          count: results.length
        });
      }

      // Lista única de textos que realmente necesitan red
      const uniqueMissingList = Array.from(missingMap.keys());

      // Traducir en paralelo por fragmentos
      const translatedBatch = await translateInParallelChunks(
        uniqueMissingList,
        targetLanguage,
        sourceLanguage,
        35
      );

      // Poblar resultados y almacenar en caché
      for (let k = 0; k < uniqueMissingList.length; k++) {
        const orig = uniqueMissingList[k];
        const trans = translatedBatch[k] || orig;
        setCachedTranslation(targetLanguage, orig, trans);

        const indices = missingMap.get(orig);
        for (let idx = 0; idx < indices.length; idx++) {
          results[indices[idx]] = trans;
        }
      }

      logger.info(`Lote optimizado: ${totalCount} textos procesados (${uniqueMissingList.length} únicos a red) a '${targetLanguage}'`);
      return res.status(STATUS_CODES.OK).json({
        success: true,
        translatedTexts: results,
        targetLanguage,
        count: results.length
      });
    }

    // 2. Manejo de Texto Unitario (/api/translate con text: "...")
    if (typeof text === "string") {
      if (!text || NON_TRANSLATABLE_REGEX.test(text.trim())) {
        return res.status(STATUS_CODES.OK).json({
          success: true,
          translatedText: text,
          targetLanguage
        });
      }

      const cachedSingle = getCachedTranslation(targetLanguage, text);
      if (cachedSingle !== undefined) {
        return res.status(STATUS_CODES.OK).json({
          success: true,
          translatedText: cachedSingle,
          targetLanguage
        });
      }

      const result = await translate(text, {
        to: targetLanguage,
        from: sourceLanguage || "auto"
      });
      const translatedText = result && result.text ? result.text : text;
      setCachedTranslation(targetLanguage, text, translatedText);

      return res.status(STATUS_CODES.OK).json({
        success: true,
        translatedText,
        targetLanguage
      });
    }

    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success: false,
      error: "Parámetros inválidos. Debe proporcionar 'text' o 'texts' junto a 'targetLanguage'."
    });
  } catch (error) {
    logger.error(`Error en translateText: ${error.message}`);
    return res.status(STATUS_CODES.SERVER_ERROR).json({
      success: false,
      error: "Error en el servicio de traducción: " + (error.message || "Fallo inesperado")
    });
  }
};

/**
 * @desc Lista oficial y completa de más de 200 idiomas soportados
 */
exports.getLanguages = (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
  const langKeys = Object.keys(languages).filter((k) => k !== "auto");
  res.status(STATUS_CODES.OK).json({
    success: true,
    total: langKeys.length,
    popular: POPULAR_LANGUAGES,
    languages: langKeys,
    dictionary: languages
  });
};

/**
 * @desc Estado de salud del servicio con telemetría de memoria y caché
 */
exports.getHealth = (req, res) => {
  const mem = process.memoryUsage();
  res.setHeader("Cache-Control", "no-cache");
  res.status(STATUS_CODES.OK).json({
    success: true,
    status: "ok",
    uptime: Math.floor(process.uptime()),
    cache: {
      entries: serverTranslationCache.size,
      maxEntries: MAX_SERVER_CACHE_ENTRIES,
      hits: cacheHitsCount,
      misses: cacheMissesCount
    },
    memory: {
      rssMb: Math.round(mem.rss / 1024 / 1024),
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024)
    },
    timestamp: new Date().toISOString()
  });
};