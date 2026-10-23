/**
 * separatorRoutes.js
 * Rutas para el Pilar 05: Separador de Voz e Instrumental (Vocal Remover & Stems)
 */
const express = require("express");
const router = express.Router();
const { rateLimiter } = require("../middlewares");
const { separatorController } = require("../controllers");

// Parser dedicado de 50MB solo para subida de audio/video en base64
const heavyBodyParser = express.json({ limit: "50mb" });

router.post("/separator/process", heavyBodyParser, rateLimiter.separatorLimiter, separatorController.processSeparation);
router.get("/separator/stream", separatorController.streamStem);
router.get("/separator/download", separatorController.downloadStem);

module.exports = router;
