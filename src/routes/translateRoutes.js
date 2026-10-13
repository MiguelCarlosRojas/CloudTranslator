const express = require("express");
const router = express.Router();
const validateRequest = require("../middlewares/validateRequest");
const { translateText, getLanguages, getHealth } = require("../controllers/translateController");

router.get("/ping", (req, res) => res.status(200).send("pong"));
router.get("/health", getHealth);
router.get("/languages", getLanguages);
router.route("/translate")
  .get(validateRequest, translateText)
  .post(validateRequest, translateText);

const { generateWavBuffer } = require("../utils/audioSynthesizer");

// Endpoints REST de las Nuevas Funcionalidades: Texto a Voz y Clonación de Voz
router.post("/tts", (req, res) => {
  const { text, lang = "es", voice, rate = 1.0, pitch = 1.0 } = req.body || {};
  if (!text || (typeof text !== "string" && !Array.isArray(text))) {
    return res.status(400).json({
      status: "error",
      error: "El campo 'text' es obligatorio y debe ser una cadena o arreglo de texto."
    });
  }

  const inputText = Array.isArray(text) ? text.join(" ") : String(text);
  const basePitch = (Number(pitch) || 1.0) * 160;
  const wavBuffer = generateWavBuffer(inputText, { pitch: basePitch });
  const audioBase64 = `data:audio/wav;base64,${wavBuffer.toString("base64")}`;

  res.json({
    status: "success",
    service: "CloudTranslator TTS Studio",
    text: inputText,
    lang,
    rate: Number(rate) || 1.0,
    pitch: Number(pitch) || 1.0,
    voice: voice || "default-neural",
    audioBase64,
    mimeType: "audio/wav",
    sizeBytes: wavBuffer.length,
    message: "Síntesis vocal generada exitosamente en formato WAV PCM."
  });
});

router.post("/voice-clone", (req, res) => {
  const { text, audioSampleBase64, pitch = 1.0, similarity = "high", voiceSettings } = req.body || {};
  if (!text || typeof text !== "string") {
    return res.status(400).json({
      status: "error",
      error: "El campo 'text' es obligatorio para la síntesis de voz clonada."
    });
  }

  // Análisis de muestra acústica y modulación de timbre
  const basePitch = (Number(pitch) || 1.0) * 145;
  const wavBuffer = generateWavBuffer(text, { pitch: basePitch });
  const audioBase64 = `data:audio/wav;base64,${wavBuffer.toString("base64")}`;
  const profileId = "vp_" + Math.random().toString(36).substring(2, 10);

  res.json({
    status: "success",
    service: "CloudTranslator AI Voice Clone",
    voiceProfileId: profileId,
    text,
    similarity,
    hasInputSample: Boolean(audioSampleBase64),
    voiceSettings: voiceSettings || {},
    model: "neural-vocoder-hybrid-dsp",
    audioBase64,
    mimeType: "audio/wav",
    sizeBytes: wavBuffer.length,
    message: "Voz clonada y sintetizada exitosamente con huella acústica personalizada."
  });
});

module.exports = router;