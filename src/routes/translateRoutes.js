const express = require("express");
const router = express.Router();
const validateRequest = require("../middlewares/validateRequest");
const { translateText, getLanguages, getHealth } = require("../controllers/translateController");
const {
  VOICE_CATALOG,
  synthesizeSpeech,
  cloneVoice,
  getAudioById
} = require("../utils/audioSynthesizer");

// Endpoints Base y Utilidades
router.get("/ping", (req, res) => res.status(200).send("pong"));
router.get("/health", getHealth);
router.get("/languages", getLanguages);

// Pilar 1: Traductor en la Nube
router.route("/translate")
  .get(validateRequest, translateText)
  .post(validateRequest, translateText);

// Pilar 2: Texto a Voz (TTS Studio)
// Catálogo completo de voces humanas reales
router.get("/tts/voices", (req, res) => {
  res.json({
    status: "success",
    total: VOICE_CATALOG.length,
    voices: VOICE_CATALOG
  });
});

// Síntesis neuronal de voz en el backend
router.post("/tts", async (req, res) => {
  try {
    const { text, lang = "es", voice, voiceId, rate = 1.0, pitch = 1.0 } = req.body || {};
    if (!text || (typeof text !== "string" && !Array.isArray(text))) {
      return res.status(400).json({
        status: "error",
        error: "El campo 'text' es obligatorio y debe ser una cadena o arreglo de texto."
      });
    }

    const inputText = Array.isArray(text) ? text.join(" ") : String(text);
    const selectedVoiceId = voiceId || voice;

    const result = await synthesizeSpeech(inputText, {
      voiceId: selectedVoiceId,
      lang,
      rate: Number(rate) || 1.0,
      pitch: Number(pitch) || 1.0
    });

    res.json({
      status: "success",
      service: "CloudTranslator TTS Studio (Backend Neural Engine)",
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
      message: "Audio generado con éxito desde el backend de CloudTranslator."
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: "Error interno al sintetizar audio: " + error.message
    });
  }
});

// Streaming de audio TTS (para etiquetas <audio> o reproductores de clientes)
router.get("/tts/stream", (req, res) => {
  const { id } = req.query;
  const audioItem = getAudioById(id);
  if (!audioItem) {
    return res.status(404).send("Audio no encontrado o expirado (TTL 30 min).");
  }

  res.setHeader("Content-Type", audioItem.mimeType);
  res.setHeader("Content-Length", audioItem.buffer.length);
  res.setHeader("Accept-Ranges", "bytes");
  res.send(audioItem.buffer);
});

// Descarga directa de archivo de audio TTS
router.get("/tts/download", (req, res) => {
  const { id } = req.query;
  const audioItem = getAudioById(id);
  if (!audioItem) {
    return res.status(404).send("Audio no encontrado o expirado para descarga.");
  }

  const ext = audioItem.mimeType.includes("wav") ? "wav" : "mp3";
  res.setHeader("Content-Type", audioItem.mimeType);
  res.setHeader("Content-Disposition", `attachment; filename="voz-tts-cloudtranslator.${ext}"`);
  res.setHeader("Content-Length", audioItem.buffer.length);
  res.send(audioItem.buffer);
});

// Pilar 3: Clonación de Voz con IA
router.post("/voice-clone", async (req, res) => {
  try {
    const { text, audioSampleBase64, pitch = 1.0, similarity = "high", lang = "es" } = req.body || {};
    if (!text || typeof text !== "string") {
      return res.status(400).json({
        status: "error",
        error: "El campo 'text' es obligatorio para la síntesis de voz clonada."
      });
    }

    const result = await cloneVoice(text, {
      audioSampleBase64,
      lang,
      pitch: Number(pitch) || 1.0,
      similarity
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: "Error interno en clonación vocal: " + error.message
    });
  }
});

// Streaming de voz clonada
router.get("/voice-clone/stream", (req, res) => {
  const { id } = req.query;
  const audioItem = getAudioById(id);
  if (!audioItem) {
    return res.status(404).send("Audio clonado no encontrado o expirado.");
  }

  res.setHeader("Content-Type", audioItem.mimeType);
  res.setHeader("Content-Length", audioItem.buffer.length);
  res.setHeader("Accept-Ranges", "bytes");
  res.send(audioItem.buffer);
});

// Descarga directa de archivo de voz clonada
router.get("/voice-clone/download", (req, res) => {
  const { id } = req.query;
  const audioItem = getAudioById(id);
  if (!audioItem) {
    return res.status(404).send("Audio clonado no encontrado para descarga.");
  }

  const ext = audioItem.mimeType.includes("wav") ? "wav" : "mp3";
  res.setHeader("Content-Type", audioItem.mimeType);
  res.setHeader("Content-Disposition", `attachment; filename="voz-clonada-cloudtranslator.${ext}"`);
  res.setHeader("Content-Length", audioItem.buffer.length);
  res.send(audioItem.buffer);
});

module.exports = router;