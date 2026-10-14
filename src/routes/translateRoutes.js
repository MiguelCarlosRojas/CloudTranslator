const fs = require("fs");
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
const {
  SUPPORTED_PLATFORMS,
  extractMediaInfo,
  processConversion,
  getMediaById
} = require("../utils/mediaEngine");
const axios = require("axios");
const logger = require("../utils/logger");

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
    const { text, audioSampleBase64, pitch = 1.0, similarity = "high", lang = "es", gender = "auto" } = req.body || {};
    if (!text || typeof text !== "string") {
      return res.status(400).json({
        status: "error",
        error: "El campo 'text' es obligatorio para la síntesis de voz clonada."
      });
    }

    const result = await cloneVoice(text, {
      audioSampleBase64,
      lang,
      gender,
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

// =========================================================================
// Pilar 04: Conversor Multimedia Universal (YouTube, TikTok, Instagram, etc. a MP3 / MP4)
// =========================================================================

// Catálogo de plataformas compatibles
router.get("/media/platforms", (req, res) => {
  res.json({
    status: "success",
    service: "CloudTranslator Media Converter API (Pilar 04)",
    total: SUPPORTED_PLATFORMS.length,
    platforms: SUPPORTED_PLATFORMS
  });
});

// Extracción de metadatos de video (Título, autor, miniatura, plataformas y formatos disponibles)
router.post("/media/info", async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url || typeof url !== "string") {
      return res.status(400).json({
        status: "error",
        error: "Debe proporcionar el campo 'url' con el enlace del video (YouTube, TikTok, Instagram, etc.)."
      });
    }

    const info = await extractMediaInfo(url);
    res.json({
      status: "success",
      ...info
    });
  } catch (error) {
    logger.error(`Error en /media/info: ${error.message}`);
    res.status(500).json({
      status: "error",
      error: error.message || "Error al analizar el enlace multimedia."
    });
  }
});

// Conversión a MP3 o MP4 con calidad seleccionada
router.post("/media/convert", async (req, res) => {
  try {
    const { url, format = "mp3", quality = "320k" } = req.body || {};
    if (!url || typeof url !== "string") {
      return res.status(400).json({
        status: "error",
        error: "El campo 'url' es obligatorio para realizar la conversión."
      });
    }

    const result = await processConversion({ url, format, quality });
    res.json(result);
  } catch (error) {
    logger.error(`Error en /media/convert: ${error.message}`);
    res.status(500).json({
      status: "error",
      error: error.message || "Error al procesar la conversión multimedia."
    });
  }
});

// Procesamiento por lotes (múltiples enlaces simultáneos)
router.post("/media/batch", async (req, res) => {
  try {
    const { urls, format = "mp3", quality = "320k" } = req.body || {};
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        status: "error",
        error: "El campo 'urls' es obligatorio y debe ser un arreglo con al menos un enlace."
      });
    }

    const results = await Promise.all(
      urls.slice(0, 10).map(async (link) => {
        try {
          return await processConversion({ url: link, format, quality });
        } catch (itemErr) {
          return {
            status: "error",
            url: link,
            error: itemErr.message
          };
        }
      })
    );

    res.json({
      status: "success",
      total: results.length,
      format,
      quality,
      items: results
    });
  } catch (error) {
    logger.error(`Error en /media/batch: ${error.message}`);
    res.status(500).json({
      status: "error",
      error: error.message || "Error en procesamiento por lotes multimedia."
    });
  }
});

// Streaming de video o audio en tiempo real (para reproductor HTML5 <video> / <audio>)
router.get("/media/stream", async (req, res) => {
  try {
    const { id } = req.query;
    const item = getMediaById(id);
    if (!item) {
      return res.status(404).send("Medio no encontrado o expirado (TTL 30 min).");
    }

    // Servir desde archivo físico en disco generado por FFmpeg (con soporte Range 206)
    if (item.filePath && fs.existsSync(item.filePath)) {
      const stat = fs.statSync(item.filePath);
      const total = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
        const chunkSize = end - start + 1;

        res.status(206);
        res.setHeader("Content-Range", `bytes ${start}-${end}/${total}`);
        res.setHeader("Accept-Ranges", "bytes");
        res.setHeader("Content-Length", chunkSize);
        res.setHeader("Content-Type", item.mimeType);

        const stream = fs.createReadStream(item.filePath, { start, end });
        return stream.pipe(res);
      }

      res.setHeader("Content-Type", item.mimeType);
      res.setHeader("Content-Length", total);
      res.setHeader("Accept-Ranges", "bytes");
      const stream = fs.createReadStream(item.filePath);
      return stream.pipe(res);
    }

    // Respaldo en memoria si existe buffer directo
    if (item.buffer) {
      const total = item.buffer.length;
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
        const chunkSize = end - start + 1;
        res.status(206);
        res.setHeader("Content-Range", `bytes ${start}-${end}/${total}`);
        res.setHeader("Accept-Ranges", "bytes");
        res.setHeader("Content-Length", chunkSize);
        res.setHeader("Content-Type", item.mimeType);
        return res.send(item.buffer.slice(start, end + 1));
      }
      res.setHeader("Content-Type", item.mimeType);
      res.setHeader("Content-Length", total);
      res.setHeader("Accept-Ranges", "bytes");
      return res.send(item.buffer);
    }

    res.status(404).send("No hay archivo ni buffer multimedia disponible.");
  } catch (err) {
    logger.error(`Error en /media/stream: ${err.message}`);
    res.status(500).send("Error interno en streaming de medios.");
  }
});

// Descarga directa física del archivo (.mp3 o .mp4) desde el servidor local
router.get("/media/download", async (req, res) => {
  try {
    const { id } = req.query;
    const item = getMediaById(id);
    if (!item) {
      return res.status(404).send("Medio no encontrado o expirado para descarga.");
    }

    const asciiFilename = (item.filename || `media.${item.format}`).replace(/[^\x20-\x7E]/g, "_");

    // Servir directamente desde el disco del servidor (100% nativo sin redirecciones a terceros)
    if (item.filePath && fs.existsSync(item.filePath)) {
      const stat = fs.statSync(item.filePath);
      res.setHeader("Content-Disposition", `attachment; filename="${asciiFilename}"`);
      res.setHeader("Content-Type", item.mimeType);
      res.setHeader("Content-Length", stat.size);
      const stream = fs.createReadStream(item.filePath);
      return stream.pipe(res);
    }

    if (item.buffer) {
      res.setHeader("Content-Disposition", `attachment; filename="${asciiFilename}"`);
      res.setHeader("Content-Type", item.mimeType);
      res.setHeader("Content-Length", item.buffer.length);
      return res.send(item.buffer);
    }

    res.status(404).send("Archivo multimedia no disponible para descarga.");
  } catch (err) {
    logger.error(`Error en /media/download: ${err.message}`);
    res.status(500).send("Error al descargar archivo multimedia.");
  }
});

module.exports = router;