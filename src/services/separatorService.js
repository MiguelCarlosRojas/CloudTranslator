/**
 * separatorService.js
 * Servicio de Separación de Voz e Instrumental (Vocal Remover & Stems)
 */
const {
  processSeparation,
  getStemById
} = require("../utils/vocalSeparator");

/**
 * Procesa la separación de voz e instrumental desde URL o archivo base64
 */
async function separateAudio({ url, audioBase64, filename, quality = "320k" }) {
  return processSeparation({ url, audioBase64, filename, quality });
}

/**
 * Busca un stem procesado por ID
 */
function findStemById(id) {
  return getStemById(id);
}

module.exports = {
  separateAudio,
  findStemById
};
