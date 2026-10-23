/**
 * voiceCloneController.js
 * Controlador HTTP para Clonación de Voz con IA y Análisis Acústico
 * Blindado contra ataques DoS por sobrecarga de texto/audio e inyección de identificadores.
 */
const { voiceCloneService } = require("../services");
const { streamAudioBuffer } = require("../utils/streamHelper");
const { sanitizeId, sanitizeFilenameHeader } = require("../utils/securitySanitizer");
const logger = require("../utils/logger");

/**
 * Analiza la muestra de audio en base64 para extraer tono, formantes, género y frecuencia fundamental
 */
exports.analyzeVoice = async (req, res) => {
  try {
    const { audioSampleBase64 } = req.body || {};
    if (!audioSampleBase64 || typeof audioSampleBase64 !== "string") {
      return res.status(400).json({
        status: "error",
        error: "Debe proporcionar el campo 'audioSampleBase64' con la muestra grabada o subida."
      });
    }

    // 🛡️ Límite máximo de tamaño base64 (70MB caracteres)
    if (audioSampleBase64.length > 70 * 1024 * 1024) {
      return res.status(400).json({
        status: "error",
        error: "La muestra en base64 supera el tamaño máximo permitido."
      });
    }

    const analysis = await voiceCloneService.analyzeAudioSample(audioSampleBase64);
    res.json({
      status: "success",
      analysis
    });
  } catch (error) {
    logger.error(`Error en voiceCloneController.analyzeVoice: ${error.message}`);
    res.status(400).json({
      status: "error",
      error: "Error al analizar muestra de audio: " + error.message
    });
  }
};

/**
 * Ejecuta la clonación y síntesis de voz con validación de límites
 */
exports.cloneVoice = async (req, res) => {
  try {
    const {
      text,
      audioSampleBase64,
      pitch = 1.0,
      similarity = "high",
      lang = "es",
      gender = "auto",
      format = "wav"
    } = req.body || {};

    if (!text || typeof text !== "string") {
      return res.status(400).json({
        status: "error",
        error: "El campo 'text' es obligatorio para la síntesis de voz clonada."
      });
    }

    if (text.length > 5000) {
      return res.status(400).json({
        status: "error",
        error: "El texto para clonación excede el máximo permitido de 5,000 caracteres."
      });
    }

    const numericPitch = Math.max(0.5, Math.min(2.0, Number(pitch) || 1.0));
    const selectedFormat = format === "mp3" ? "mp3" : "wav";

    const result = await voiceCloneService.generateClonedVoice(text, {
      audioSampleBase64,
      lang: typeof lang === "string" ? lang.slice(0, 16) : "es",
      gender: typeof gender === "string" ? gender.slice(0, 16) : "auto",
      pitch: numericPitch,
      similarity: typeof similarity === "string" ? similarity.slice(0, 16) : "high",
      format: selectedFormat
    });

    res.json(result);
  } catch (error) {
    logger.error(`Error en voiceCloneController.cloneVoice: ${error.message}`);
    res.status(500).json({
      status: "error",
      error: "Error interno en clonación vocal: " + error.message
    });
  }
};

/**
 * Streaming de voz clonada con validación de ID
 */
exports.streamVoiceClone = (req, res) => {
  const safeId = sanitizeId(req.query.id);
  if (!safeId) {
    return res.status(400).send("Identificador de audio clonado inválido o no seguro.");
  }

  const audioItem = voiceCloneService.findClonedAudioById(safeId);
  if (!audioItem) {
    return res.status(404).send("Audio clonado no encontrado o expirado.");
  }

  streamAudioBuffer(req, res, audioItem);
};

/**
 * Descarga directa de archivo de voz clonada con validación de ID
 */
exports.downloadVoiceClone = (req, res) => {
  const safeId = sanitizeId(req.query.id);
  if (!safeId) {
    return res.status(400).send("Identificador de audio clonado inválido o no seguro.");
  }

  const audioItem = voiceCloneService.findClonedAudioById(safeId);
  if (!audioItem) {
    return res.status(404).send("Audio clonado no encontrado para descarga.");
  }

  const ext = audioItem.mimeType.includes("wav") ? "wav" : "mp3";
  const safeFilename = sanitizeFilenameHeader(`voz-clonada-vork.${ext}`);

  res.setHeader("Content-Type", audioItem.mimeType);
  res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
  res.setHeader("Content-Length", audioItem.buffer.length);
  res.send(audioItem.buffer);
};
