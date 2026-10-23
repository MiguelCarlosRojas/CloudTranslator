/**
 * translationService.js
 * Servicio de Traducción en la Nube con caché LRU en RAM y fragmentación paralela por lotes.
 */
const translate = require("google-translate-api-x");
const { languages } = require("google-translate-api-x");
const logger = require("../utils/logger");

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
 * Traduce un único texto optimizado con caché
 */
async function translateSingle(text, targetLanguage, sourceLanguage = "auto") {
  if (!text || NON_TRANSLATABLE_REGEX.test(text.trim())) {
    return text;
  }

  const cached = getCachedTranslation(targetLanguage, text);
  if (cached !== undefined) {
    return cached;
  }

  const result = await translate(text, {
    to: targetLanguage,
    from: sourceLanguage || "auto"
  });
  const translatedText = result && result.text ? result.text : text;
  setCachedTranslation(targetLanguage, text, translatedText);
  return translatedText;
}

/**
 * Traduce un lote de textos con deduplicación y caché
 */
async function translateBatch(texts, targetLanguage, sourceLanguage = "auto") {
  const totalCount = texts.length;
  const results = new Array(totalCount);
  const missingMap = new Map();

  for (let i = 0; i < totalCount; i++) {
    const original = texts[i];

    if (!original || NON_TRANSLATABLE_REGEX.test(original.trim())) {
      results[i] = original;
      continue;
    }

    const cached = getCachedTranslation(targetLanguage, original);
    if (cached !== undefined) {
      results[i] = cached;
      continue;
    }

    if (!missingMap.has(original)) {
      missingMap.set(original, [i]);
    } else {
      missingMap.get(original).push(i);
    }
  }

  if (missingMap.size === 0) {
    return results;
  }

  const uniqueMissingList = Array.from(missingMap.keys());
  const translatedBatch = await translateInParallelChunks(
    uniqueMissingList,
    targetLanguage,
    sourceLanguage,
    35
  );

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
  return results;
}

/**
 * Obtiene métricas de la caché de traducción
 */
function getCacheStats() {
  return {
    entries: serverTranslationCache.size,
    maxEntries: MAX_SERVER_CACHE_ENTRIES,
    hits: cacheHitsCount,
    misses: cacheMissesCount
  };
}

module.exports = {
  translateSingle,
  translateBatch,
  getCacheStats,
  supportedLanguages: languages
};
