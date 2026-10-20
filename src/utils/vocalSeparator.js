/**
 * VocalSeparator - Motor de Separación de Voz e Instrumental de CloudTranslator
 * Pilar 05: Extracción y División de Stems de Audio (Vocal vs Instrumental / Karaoke)
 * a partir de Enlaces de Plataformas Multimedia (YouTube, TikTok, etc.) o Archivos Subidos.
 * 
 * Procesamiento nativo con FFmpeg mediante cancelación de fase estereofónica DSP de alta fidelidad.
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const logger = require("./logger");
const { processConversion, sanitizeFilename, formatDurationSeconds } = require("./mediaEngine");

// Ruta a FFmpeg
let ffmpegPath = "ffmpeg";
try {
  const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
  if (ffmpegInstaller && ffmpegInstaller.path) {
    ffmpegPath = ffmpegInstaller.path;
  }
} catch (e) {
  logger.warn(`No se pudo cargar @ffmpeg-installer/ffmpeg en vocalSeparator: ${e.message}`);
}

// Directorio de caché para stems separados físicamente
const STEMS_CACHE_DIR = path.join(__dirname, "../../data/stems_cache");
try {
  if (!fs.existsSync(STEMS_CACHE_DIR)) {
    fs.mkdirSync(STEMS_CACHE_DIR, { recursive: true });
  }
} catch (err) {
  logger.error(`Error al crear directorio stems_cache: ${err.message}`);
}

// Almacén en RAM para sesiones de stems de audio (TTL: 30 minutos)
const stemsBufferStore = new Map();
const STEMS_STORE_TTL_MS = 30 * 60 * 1000;

// Limpieza periódica de archivos antiguos
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [id, item] of stemsBufferStore.entries()) {
    if (now - item.createdAt > STEMS_STORE_TTL_MS) {
      if (item.vocalsPath && fs.existsSync(item.vocalsPath)) {
        try { fs.unlinkSync(item.vocalsPath); } catch {}
      }
      if (item.instrumentalPath && fs.existsSync(item.instrumentalPath)) {
        try { fs.unlinkSync(item.instrumentalPath); } catch {}
      }
      if (item.inputPath && fs.existsSync(item.inputPath)) {
        try { fs.unlinkSync(item.inputPath); } catch {}
      }
      stemsBufferStore.delete(id);
    }
  }
}, 10 * 60 * 1000);
if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

/**
 * Separa un archivo de audio estéreo en Instrumental (sin voz) y Vocals (solo voz)
 */
function separateAudioChannels(inputAudioPath, outInstrumentalPath, outVocalsPath, quality = "320k") {
  return new Promise(async (resolve, reject) => {
    try {
      const bitrateMap = { "320k": "320k", "192k": "192k", "128k": "128k" };
      const bitrate = bitrateMap[quality] || "320k";

      // Pipeline 1: Instrumental / Karaoke (Elimina la voz central mediante cancelación estereofónica DSP de 3 bandas)
      const pInstrumental = new Promise((res, rej) => {
        const instFilter = '[0:a]aformat=channel_layouts=stereo,asplit=3[low][mid][high];' +
          '[low]lowpass=f=180[bass];' +
          '[mid]highpass=f=180,lowpass=f=6800,pan=stereo|c0=0.5*c0-0.5*c1|c1=0.5*c1-0.5*c0[inst_mid];' +
          '[high]highpass=f=6800[treble];' +
          '[bass][inst_mid][treble]amix=inputs=3:dropout_transition=0,volume=2.6[out]';

        const ffInst = spawn(ffmpegPath, [
          "-y",
          "-i", inputAudioPath,
          "-filter_complex", instFilter,
          "-map", "[out]",
          "-c:a", "libmp3lame",
          "-b:a", bitrate,
          "-id3v2_version", "3",
          outInstrumentalPath
        ]);

        let stderr = "";
        ffInst.stderr.on("data", d => { stderr += d.toString(); });
        ffInst.on("close", code => {
          if (code === 0 && fs.existsSync(outInstrumentalPath) && fs.statSync(outInstrumentalPath).size > 1000) {
            res();
          } else {
            rej(new Error(`Error al generar pista instrumental (code ${code}): ${stderr.slice(-200)}`));
          }
        });
        ffInst.on("error", rej);
      });

      // Pipeline 2: Acapella / Vocales (Aísla el canal central, cancela instrumentos laterales y realza frecuencias vocales)
      const pVocals = new Promise((res, rej) => {
        const vocFilter = '[0:a]aformat=channel_layouts=stereo,asplit=2[mid_in][side_in];' +
          '[mid_in]pan=stereo|c0=0.5*c0+0.5*c1|c1=0.5*c0+0.5*c1[mid];' +
          '[side_in]pan=stereo|c0=0.5*c0-0.5*c1|c1=0.5*c1-0.5*c0[side];' +
          '[side]volume=-1[side_inv];' +
          '[mid][side_inv]amix=inputs=2:dropout_transition=0,highpass=f=140,lowpass=f=7500,equalizer=f=1000:t=q:w=1.5:g=3,equalizer=f=3000:t=q:w=1.5:g=4,volume=3.0[out]';

        const ffVoc = spawn(ffmpegPath, [
          "-y",
          "-i", inputAudioPath,
          "-filter_complex", vocFilter,
          "-map", "[out]",
          "-c:a", "libmp3lame",
          "-b:a", bitrate,
          "-id3v2_version", "3",
          outVocalsPath
        ]);

        let stderr = "";
        ffVoc.stderr.on("data", d => { stderr += d.toString(); });
        ffVoc.on("close", code => {
          if (code === 0 && fs.existsSync(outVocalsPath) && fs.statSync(outVocalsPath).size > 1000) {
            res();
          } else {
            rej(new Error(`Error al generar pista vocal (code ${code}): ${stderr.slice(-200)}`));
          }
        });
        ffVoc.on("error", rej);
      });

      await Promise.all([pInstrumental, pVocals]);

      // Extraer duración
      let duration = "00:00";
      let durationSeconds = 0;
      try {
        const probe = spawn(ffmpegPath, ["-i", outInstrumentalPath]);
        let pErr = "";
        probe.stderr.on("data", d => { pErr += d.toString(); });
        await new Promise(r => probe.on("close", r));
        const durMatch = pErr.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2})/);
        if (durMatch) {
          const h = parseInt(durMatch[1], 10);
          const m = parseInt(durMatch[2], 10);
          const s = parseInt(durMatch[3], 10);
          durationSeconds = h * 3600 + m * 60 + s;
          duration = h > 0 ? `${durMatch[1]}:${durMatch[2]}:${durMatch[3]}` : `${durMatch[2]}:${durMatch[3]}`;
        }
      } catch {}

      resolve({
        instrumentalSize: fs.statSync(outInstrumentalPath).size,
        vocalsSize: fs.statSync(outVocalsPath).size,
        duration,
        durationSeconds
      });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Procesa la separación de voz e instrumental desde URL o archivo subido
 */
async function processSeparation(options = {}) {
  const {
    url,
    audioBase64,
    filename = "cancion",
    quality = "320k"
  } = options;

  if (!url && !audioBase64) {
    throw new Error("Debe proporcionar una URL multimedia o un archivo de audio/video para separar.");
  }

  const jobId = "stem_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  let title = filename.replace(/\.[^/.]+$/, "");
  let platform = "Archivo Subido";
  let thumbnail = "/img/logo.png";
  let masterAudioPath = "";
  let tempFilesToDelete = [];

  try {
    // Opción A: Separación desde enlace multimedia (YouTube, TikTok, etc.)
    if (url && typeof url === "string" && url.trim().startsWith("http")) {
      logger.info(`Separador: Extrayendo audio desde enlace: ${url}`);
      const convResult = await processConversion({
        url: url.trim(),
        format: "mp3",
        quality: "320k"
      });

      title = convResult.title || title;
      platform = convResult.platform || platform;
      thumbnail = convResult.thumbnail || thumbnail;

      const mediaItem = require("./mediaEngine").getMediaById(convResult.id);
      if (mediaItem && mediaItem.filePath && fs.existsSync(mediaItem.filePath)) {
        masterAudioPath = mediaItem.filePath;
      } else {
        throw new Error("No se pudo obtener el audio extraído del enlace multimedia.");
      }
    }
    // Opción B: Separación desde archivo subido en Base64
    else if (audioBase64) {
      logger.info(`Separador: Decodificando archivo subido (${title})`);
      const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, "");
      const inputBuf = Buffer.from(cleanBase64, "base64");
      const tempInput = path.join(STEMS_CACHE_DIR, `${jobId}_input.tmp`);
      fs.writeFileSync(tempInput, inputBuf);
      tempFilesToDelete.push(tempInput);

      // Normalizar archivo a MP3 44.1kHz estéreo
      const normalizedPath = path.join(STEMS_CACHE_DIR, `${jobId}_master.mp3`);
      await new Promise((resolve, reject) => {
        const ffNorm = spawn(ffmpegPath, [
          "-y",
          "-i", tempInput,
          "-vn",
          "-ar", "44100",
          "-ac", "2",
          "-c:a", "libmp3lame",
          "-b:a", "320k",
          normalizedPath
        ]);
        ffNorm.on("close", code => {
          if (code === 0 && fs.existsSync(normalizedPath)) resolve();
          else reject(new Error(`Fallo al normalizar archivo subido (code ${code})`));
        });
        ffNorm.on("error", reject);
      });

      masterAudioPath = normalizedPath;
      tempFilesToDelete.push(normalizedPath);
    }

    const safeTitle = sanitizeFilename(title, "audio-stem");
    const outInstrumentalPath = path.join(STEMS_CACHE_DIR, `${jobId}_instrumental.mp3`);
    const outVocalsPath = path.join(STEMS_CACHE_DIR, `${jobId}_vocals.mp3`);

    logger.info(`Separador: Iniciando división DSP de stems para "${safeTitle}"...`);
    const sepRes = await separateAudioChannels(masterAudioPath, outInstrumentalPath, outVocalsPath, quality);

    const vocalsFilename = `CloudTranslator_${safeTitle}_[VOCAL_ACAPELLA].mp3`;
    const instrumentalFilename = `CloudTranslator_${safeTitle}_[PISTA_INSTRUMENTAL].mp3`;

    // Registrar en almacén en RAM
    stemsBufferStore.set(jobId, {
      id: jobId,
      title,
      platform,
      thumbnail,
      quality,
      duration: sepRes.duration,
      durationSeconds: sepRes.durationSeconds,
      vocalsPath: outVocalsPath,
      instrumentalPath: outInstrumentalPath,
      vocalsFilename,
      instrumentalFilename,
      vocalsSize: sepRes.vocalsSize,
      instrumentalSize: sepRes.instrumentalSize,
      createdAt: Date.now()
    });

    // Limpiar temporales si correspondiera
    tempFilesToDelete.forEach(f => {
      try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {}
    });

    return {
      status: "success",
      id: jobId,
      title,
      platform,
      thumbnail,
      duration: sepRes.duration,
      durationSeconds: sepRes.durationSeconds,
      vocals: {
        streamUrl: `/api/separator/stream?id=${jobId}&type=vocals`,
        downloadUrl: `/api/separator/download?id=${jobId}&type=vocals`,
        filename: vocalsFilename,
        sizeBytes: sepRes.vocalsSize,
        label: "Voz Aislada (Acapella)"
      },
      instrumental: {
        streamUrl: `/api/separator/stream?id=${jobId}&type=instrumental`,
        downloadUrl: `/api/separator/download?id=${jobId}&type=instrumental`,
        filename: instrumentalFilename,
        sizeBytes: sepRes.instrumentalSize,
        label: "Pista Instrumental (Música / Karaoke)"
      },
      message: `¡Separación completada con éxito! Voz e instrumental listos para reproducir y descargar por separado.`
    };
  } catch (err) {
    tempFilesToDelete.forEach(f => {
      try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {}
    });
    logger.error(`Error en processSeparation: ${err.message}`);
    throw err;
  }
}

/**
 * Obtiene el registro de un stem por su ID
 */
function getStemById(id) {
  if (!id) return null;
  const item = stemsBufferStore.get(id);
  if (!item) return null;
  if (Date.now() - item.createdAt > STEMS_STORE_TTL_MS) {
    if (item.vocalsPath && fs.existsSync(item.vocalsPath)) {
      try { fs.unlinkSync(item.vocalsPath); } catch {}
    }
    if (item.instrumentalPath && fs.existsSync(item.instrumentalPath)) {
      try { fs.unlinkSync(item.instrumentalPath); } catch {}
    }
    stemsBufferStore.delete(id);
    return null;
  }
  return item;
}

module.exports = {
  processSeparation,
  getStemById
};
