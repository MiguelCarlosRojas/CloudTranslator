/**
 * voiceCloneRoutes.js
 * Rutas para el Pilar 03: Clonación de Voz con IA y Análisis Acústico
 */
const express = require("express");
const router = express.Router();
const { rateLimiter } = require("../middlewares");
const { voiceCloneController } = require("../controllers");

// Parser dedicado de 50MB solo para subida de muestras base64
const heavyBodyParser = express.json({ limit: "50mb" });

router.post("/voice-clone/analyze", heavyBodyParser, rateLimiter.voiceCloneLimiter, voiceCloneController.analyzeVoice);
router.post("/voice-clone", heavyBodyParser, rateLimiter.voiceCloneLimiter, voiceCloneController.cloneVoice);
router.get("/voice-clone/stream", voiceCloneController.streamVoiceClone);
router.get("/voice-clone/download", voiceCloneController.downloadVoiceClone);

module.exports = router;
