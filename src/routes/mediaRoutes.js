/**
 * mediaRoutes.js
 * Rutas para el Pilar 04: Conversor Multimedia Universal (YouTube, TikTok, Instagram a MP3 / MP4)
 */
const express = require("express");
const router = express.Router();
const { rateLimiter } = require("../middlewares");
const { mediaController } = require("../controllers");

router.get("/media/platforms", mediaController.getPlatforms);
router.post("/media/info", rateLimiter.mediaLimiter, mediaController.getMediaInfo);
router.get("/media/thumbnail-proxy", mediaController.getThumbnailProxy);
router.get("/media/thumbnail", mediaController.getThumbnail);
router.post("/media/convert", rateLimiter.mediaLimiter, mediaController.convertMedia);
router.post("/media/batch", rateLimiter.mediaLimiter, mediaController.batchConvert);
router.get("/media/stream", mediaController.streamMedia);
router.get("/media/download", mediaController.downloadMedia);

module.exports = router;
