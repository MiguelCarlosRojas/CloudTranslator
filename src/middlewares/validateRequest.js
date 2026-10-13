const { languages } = require("google-translate-api-x");
const { STATUS_CODES } = require("../config/config");

// Mapa normalizado en memoria para resolución instantánea insensible a mayúsculas
const normalizedLangMap = new Map();
for (const [code, name] of Object.entries(languages)) {
  normalizedLangMap.set(code.toLowerCase(), code);
  normalizedLangMap.set(name.toLowerCase(), code);
}

/**
 * Middleware de validación ultraligero y de alto rendimiento:
 * - Valida 'text' (string) o 'texts' (array de strings)
 * - Admite 'targetLanguage', 'to' o 'target_language'
 * - Admite 'sourceLanguage', 'from' o 'source_language' (opcional, default 'auto')
 * - Resuelve más de 200 idiomas compatibles en O(1) sin dependencias externas
 * - Previene ataques por desbordamiento de memoria limitando tamaños
 */
module.exports = (req, res, next) => {
  const data = req.method === "GET" ? req.query : req.body;

  if (!data || typeof data !== "object") {
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success: false,
      error: "Cuerpo de solicitud inválido o ausente. Debe enviar un JSON con los parámetros requeridos."
    });
  }

  // 1. Normalizar idioma objetivo
  const rawTarget = data.targetLanguage || data.to || data.target_language;
  if (!rawTarget || typeof rawTarget !== "string" || !rawTarget.trim()) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success: false,
      error: "El idioma objetivo es requerido. Proporcione 'targetLanguage' o 'to' (ej: 'en', 'es', 'fr', 'ja')."
    });
  }

  const targetClean = rawTarget.trim().toLowerCase();
  const validTargetCode = normalizedLangMap.get(targetClean);

  if (!validTargetCode || validTargetCode === "auto") {
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success: false,
      error: `El código de idioma '${rawTarget}' no está soportado. Consulta /api/languages para ver la lista oficial.`
    });
  }

  // 2. Normalizar idioma origen (opcional)
  const rawSource = data.sourceLanguage || data.from || data.source_language;
  let validSourceCode = "auto";
  if (rawSource && typeof rawSource === "string" && rawSource.trim()) {
    const sourceClean = rawSource.trim().toLowerCase();
    const resolvedSource = normalizedLangMap.get(sourceClean);
    if (resolvedSource) {
      validSourceCode = resolvedSource;
    }
  }

  // 3. Validar texto o lista de textos
  const hasText = typeof data.text === "string";
  const hasTexts = Array.isArray(data.texts);

  if (!hasText && !hasTexts) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success: false,
      error: "Debe proporcionar 'text' (cadena) o 'texts' (arreglo de cadenas) para traducir."
    });
  }

  const validatedData = {
    targetLanguage: validTargetCode,
    sourceLanguage: validSourceCode
  };

  if (hasTexts) {
    const list = data.texts;
    if (list.length === 0) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        error: "El arreglo 'texts' no puede estar vacío."
      });
    }
    if (list.length > 1000) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        error: "El límite máximo es de 1,000 elementos por consulta en lote."
      });
    }

    // Convertir de forma segura cada elemento a string
    validatedData.texts = list.map(item => (item !== null && item !== undefined ? String(item) : ""));
  } else {
    const singleText = data.text;
    if (singleText.trim().length === 0) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        error: "El texto a traducir no puede estar vacío."
      });
    }
    if (singleText.length > 50000) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        error: "El texto excede el límite máximo de 50,000 caracteres."
      });
    }
    validatedData.text = singleText;
  }

  if (req.method === "GET") {
    req.query = validatedData;
  } else {
    req.body = validatedData;
  }

  next();
};