/**
 * ttsController.js
 * Controlador HTTP para Texto a Voz Neuronal (TTS Studio)
 * Blindado contra ataques DoS por sobrecarga de texto e inyección de identificadores.
 */
const { ttsService } = require("../services");
const { streamAudioBuffer } = require("../utils/streamHelper");
const { sanitizeId, sanitizeFilenameHeader } = require("../utils/securitySanitizer");
const logger = require("../utils/logger");

/**
 * Catálogo completo de voces humanas disponibles
 */
exports.getVoices = (req, res) => {
  const voices = ttsService.getVoices();
  res.json({
    status: "success",
    total: voices.length,
    voices
  });
};

/**
 * Síntesis neuronal de voz
 * Blindado contra Payload Bombs y desbordamiento de cadenas
 */
exports.synthesize = async (req, res) => {
  try {
    const { text, lang = "es", voice, voiceId, rate = 1.0, pitch = 1.0 } = req.body || {};
    if (!text || (typeof text !== "string" && !Array.isArray(text))) {
      return res.status(400).json({
        status: "error",
        error: "El campo 'text' es obligatorio y debe ser una cadena o arreglo de texto."
      });
    }

    const inputText = Array.isArray(text) ? text.join(" ") : String(text);
    if (inputText.length > 5000) {
      return res.status(400).json({
        status: "error",
        error: "El texto excede el límite máximo permitido de 5,000 caracteres por síntesis."
      });
    }

    // Sanitizar parámetros numéricos y cadenas
    const numericRate = Math.max(0.25, Math.min(3.0, Number(rate) || 1.0));
    const numericPitch = Math.max(0.5, Math.min(2.0, Number(pitch) || 1.0));
    const rawVoiceId = voiceId || voice;
    const selectedVoiceId = typeof rawVoiceId === "string" ? rawVoiceId.slice(0, 64) : undefined;
    const cleanLang = typeof lang === "string" ? lang.slice(0, 16) : "es";

    const result = await ttsService.generateSpeech(inputText, {
      voiceId: selectedVoiceId,
      voice,
      lang: cleanLang,
      rate: numericRate,
      pitch: numericPitch
    });

    res.json({
      status: "success",
      service: "Vork TTS Studio (Backend Neural Engine)",
      text: inputText,
      lang: result.voice.lang,
      voice: result.voice.name,
      voiceId: result.voice.id,
      voiceDetails: result.voice,
      audioBase64: result.audioBase64,
      streamUrl: result.streamUrl,
      downloadUrl: result.downloadUrl,
      format: result.format,
      mimeType: result.mimeType,
      sizeBytes: result.sizeBytes,
      source: result.source,
      message: "Audio generado con éxito desde el backend de Vork."
    });
  } catch (error) {
    logger.error(`Error en ttsController.synthesize: ${error.message}`);
    res.status(500).json({
      status: "error",
      error: "Error interno al sintetizar audio: " + error.message
    });
  }
};

/**
 * Streaming de audio TTS con validación de ID
 */
exports.streamTts = (req, res) => {
  const safeId = sanitizeId(req.query.id);
  if (!safeId) {
    return res.status(400).send("Identificador de audio inválido o no seguro.");
  }

  const audioItem = ttsService.findAudioById(safeId);
  if (!audioItem) {
    return res.status(404).send("Audio no encontrado o expirado (TTL 30 min).");
  }

  streamAudioBuffer(req, res, audioItem);
};

/**
 * Descarga directa de archivo de audio TTS con validación de ID
 */
exports.downloadTts = (req, res) => {
  const safeId = sanitizeId(req.query.id);
  if (!safeId) {
    return res.status(400).send("Identificador de audio inválido o no seguro.");
  }

  const audioItem = ttsService.findAudioById(safeId);
  if (!audioItem) {
    return res.status(404).send("Audio no encontrado o expirado para descarga.");
  }

  const ext = audioItem.mimeType.includes("wav") ? "wav" : "mp3";
  const safeFilename = sanitizeFilenameHeader(`voz-tts-vork.${ext}`);

  res.setHeader("Content-Type", audioItem.mimeType);
  res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
  res.setHeader("Content-Length", audioItem.buffer.length);
  res.send(audioItem.buffer);
};
