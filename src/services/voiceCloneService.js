/**
 * voiceCloneService.js
 * Servicio de Análisis y Clonación de Voz por Inteligencia Artificial
 */
const {
  cloneVoice,
  extractFullVoiceFeatures,
  decodeBase64Audio,
  getAudioById
} = require("../utils/audioSynthesizer");

/**
 * Analiza características acústicas de una muestra de voz en base64
 */
async function analyzeAudioSample(audioSampleBase64) {
  const sampleBuf = decodeBase64Audio(audioSampleBase64);
  if (sampleBuf.length < 200) {
    throw new Error(`La muestra de audio es demasiado pequeña o está corrupta (bytes recibidos: ${sampleBuf.length}).`);
  }

  const features = await extractFullVoiceFeatures(sampleBuf);
  return {
    fundamentalFrequencyHz: features.f0Hz,
    durationSeconds: features.durationSec,
    detectedGender: features.gender === "male" ? "Masculina" : "Femenina",
    voiceClassification: features.voiceRange,
    formants: features.formants,
    sampleSizeBytes: features.sizeBytes,
    timbreBands: features.bandEnergies
  };
}

/**
 * Ejecuta la síntesis de clonación vocal a partir de una muestra
 */
async function generateClonedVoice(text, options = {}) {
  const {
    audioSampleBase64,
    pitch = 1.0,
    similarity = "high",
    lang = "es",
    gender = "auto",
    format = "wav"
  } = options;

  return cloneVoice(text, {
    audioSampleBase64,
    lang,
    gender,
    pitch: Number(pitch) || 1.0,
    similarity,
    format: format === "mp3" ? "mp3" : "wav"
  });
}

/**
 * Busca un audio clonado por ID
 */
function findClonedAudioById(id) {
  return getAudioById(id);
}

module.exports = {
  analyzeAudioSample,
  generateClonedVoice,
  findClonedAudioById
};
