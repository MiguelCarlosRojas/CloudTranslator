/**
 * ttsRoutes.js
 * Rutas para el Pilar 02: Texto a Voz Neuronal (TTS Studio)
 */
const express = require("express");
const router = express.Router();
const { rateLimiter } = require("../middlewares");
const { ttsController } = require("../controllers");

router.get("/tts/voices", ttsController.getVoices);
router.post("/tts", rateLimiter.ttsLimiter, ttsController.synthesize);
router.get("/tts/stream", ttsController.streamTts);
router.get("/tts/download", ttsController.downloadTts);

module.exports = router;
