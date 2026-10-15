const fs = require("fs");
const express = require("express");
const router = express.Router();
const validateRequest = require("../middlewares/validateRequest");
const { translateText, getLanguages, getHealth } = require("../controllers/translateController");
const {
  VOICE_CATALOG,
  synthesizeSpeech,
  cloneVoice,
  extractFullVoiceFeatures,
  getAudioById,
  decodeBase64Audio
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
router.post("/voice-clone/analyze", async (req, res) => {
  try {
    const { audioSampleBase64 } = req.body || {};
    if (!audioSampleBase64 || typeof audioSampleBase64 !== "string") {
      return res.status(400).json({
        status: "error",
        error: "Debe proporcionar el campo 'audioSampleBase64' con la muestra grabada o subida."
      });
    }

    const sampleBuf = decodeBase64Audio(audioSampleBase64);
    if (sampleBuf.length < 200) {
      return res.status(400).json({
        status: "error",
        error: "La muestra de audio es demasiado pequeña o está corrupta (bytes recibidos: " + sampleBuf.length + ")."
      });
    }

    const features = await extractFullVoiceFeatures(sampleBuf);
    res.json({
      status: "success",
      analysis: {
        fundamentalFrequencyHz: features.f0Hz,
        durationSeconds: features.durationSec,
        detectedGender: features.gender === "male" ? "Masculina" : "Femenina",
        voiceClassification: features.voiceRange,
        formants: features.formants,
        sampleSizeBytes: features.sizeBytes,
        timbreBands: features.bandEnergies
      }
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: "Error al analizar muestra de audio: " + error.message
    });
  }
});

router.post("/voice-clone", async (req, res) => {
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

    const result = await cloneVoice(text, {
      audioSampleBase64,
      lang,
      gender,
      pitch: Number(pitch) || 1.0,
      similarity,
      format: format === "mp3" ? "mp3" : "wav"
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

function generateThumbnailSvg(title, platform = "MEDIA", author = "") {
  const safeTitle = String(title || "Video Multimedia").replace(/[<>&"]/g, "").slice(0, 42);
  const safeAuthor = String(author || "").replace(/[<>&"]/g, "").slice(0, 30);
  const plat = String(platform || "MEDIA").toLowerCase();
  let color = "#00f0ff";
  let platName = String(platform || "MEDIA").toUpperCase();

  if (plat.includes("tiktok")) {
    color = "#ff0050";
    platName = "TIKTOK";
  } else if (plat.includes("instagram")) {
    color = "#e1306c";
    platName = "INSTAGRAM";
  } else if (plat.includes("facebook")) {
    color = "#1877f2";
    platName = "FACEBOOK";
  } else if (plat.includes("twitter") || plat.includes("x")) {
    color = "#1da1f2";
    platName = "X / TWITTER";
  } else if (plat.includes("youtube")) {
    color = "#ff0000";
    platName = "YOUTUBE";
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0a0c12"/>
        <stop offset="50%" stop-color="#141824"/>
        <stop offset="100%" stop-color="#0a0c12"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <rect x="15" y="15" width="610" height="330" rx="16" fill="none" stroke="${color}" stroke-opacity="0.4" stroke-width="2"/>
    <circle cx="320" cy="140" r="48" fill="${color}" fill-opacity="0.18" stroke="${color}" stroke-width="2"/>
    <polygon points="310,122 338,140 310,158" fill="${color}"/>
    <rect x="230" y="202" width="180" height="26" rx="13" fill="${color}" fill-opacity="0.18" stroke="${color}" stroke-opacity="0.5" stroke-width="1"/>
    <text x="320" y="219" fill="${color}" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" text-anchor="middle" letter-spacing="2">${platName}</text>
    <text x="320" y="262" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="700" text-anchor="middle">${safeTitle}</text>
    ${safeAuthor ? `<text x="320" y="292" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" text-anchor="middle">${safeAuthor.startsWith('@') ? safeAuthor : '@' + safeAuthor}</text>` : ''}
  </svg>`;
}

// Proxy de miniaturas multimedia para evitar bloqueos por CORS o Referer de TikTok/Instagram/Facebook
router.get("/media/thumbnail-proxy", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

  const { url, title, platform, author } = req.query;
  if (!url || typeof url !== "string") {
    res.setHeader("Content-Type", "image/svg+xml");
    return res.send(generateThumbnailSvg(title, platform, author));
  }

  try {
    const targetUrl = req.query.url;
    const reqHeaders = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
    };

    if (targetUrl.includes("tiktok") || targetUrl.includes("byteoversea") || targetUrl.includes("ibytedtos")) {
      reqHeaders["Referer"] = "https://www.tiktok.com/";
    } else if (targetUrl.includes("instagram") || targetUrl.includes("cdninstagram") || targetUrl.includes("fbcdn")) {
      reqHeaders["Referer"] = "https://www.instagram.com/";
    }

    const imgRes = await axios.get(targetUrl, {
      responseType: "stream",
      headers: reqHeaders,
      timeout: 9000
    });

    res.setHeader("Content-Type", imgRes.headers["content-type"] || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
    imgRes.data.pipe(res);
  } catch (err) {
    logger.warn(`Fallback proxy de miniatura para ${url}: ${err.message}`);
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(generateThumbnailSvg(title, platform, author));
  }
});

// Miniatura física extraída localmente por FFmpeg durante la conversión
router.get("/media/thumbnail", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  const { id } = req.query;
  const item = getMediaById(id);
  if (item && item.thumbPath && fs.existsSync(item.thumbPath)) {
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");
    return fs.createReadStream(item.thumbPath).pipe(res);
  }
  res.setHeader("Content-Type", "image/svg+xml");
  res.send(generateThumbnailSvg(item ? item.title : "Video Multimedia", item ? item.platform : "MEDIA", item ? item.author : ""));
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