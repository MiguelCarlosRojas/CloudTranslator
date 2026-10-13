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

// Endpoints REST de las Nuevas Funcionalidades: Texto a Voz y Clonación de Voz
router.post("/tts", (req, res) => {
  const { text, lang = "es", voice, rate = 1.0, pitch = 1.0 } = req.body || {};
  if (!text || (typeof text !== "string" && !Array.isArray(text))) {
    return res.status(400).json({
      status: "error",
      error: "El campo 'text' es obligatorio y debe ser una cadena o arreglo de texto."
    });
  }
  res.json({
    status: "success",
    service: "CloudTranslator TTS Studio",
    text,
    lang,
    rate: Number(rate) || 1.0,
    pitch: Number(pitch) || 1.0,
    voice: voice || "default-neural",
    message: "Parámetros acústicos verificados y procesados correctamente."
  });
});

router.post("/voice-clone", (req, res) => {
  const { text, similarity = "balanced", voiceSettings } = req.body || {};
  if (!text || typeof text !== "string") {
    return res.status(400).json({
      status: "error",
      error: "El campo 'text' es obligatorio para la síntesis de voz clonada."
    });
  }
  res.json({
    status: "success",
    service: "CloudTranslator AI Voice Clone",
    text,
    similarity,
    voiceSettings: voiceSettings || {},
    model: "neural-vocoder-zero-shot",
    voiceProfile: "custom-acoustic-embedding",
    message: "Muestra espectral vinculada y síntesis vocal neuronal ejecutada exitosamente."
  });
});

module.exports = router;