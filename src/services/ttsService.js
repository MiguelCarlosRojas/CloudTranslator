/**
 * ttsService.js
 * Servicio de Síntesis de Texto a Voz (TTS Neuronal)
 */
const {
  VOICE_CATALOG,
  synthesizeSpeech,
  getAudioById
} = require("../utils/audioSynthesizer");

/**
 * Obtiene el catálogo de voces disponibles
 */
function getVoices() {
  return VOICE_CATALOG;
}

/**
 * Sintetiza texto a voz neuronal
 */
async function generateSpeech(text, options = {}) {
  const { lang = "es", voice, voiceId, rate = 1.0, pitch = 1.0 } = options;
  const selectedVoiceId = voiceId || voice;

  return synthesizeSpeech(text, {
    voiceId: selectedVoiceId,
    lang,
    rate: Number(rate) || 1.0,
    pitch: Number(pitch) || 1.0
  });
}

/**
 * Recupera un audio en caché por su ID
 */
function findAudioById(id) {
  return getAudioById(id);
}

module.exports = {
  getVoices,
  generateSpeech,
  findAudioById
};
