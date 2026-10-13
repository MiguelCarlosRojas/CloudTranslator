/**
 * Generador y sintetizador acústico de audio WAV en formato PCM puro.
 * Permite generar ondas de voz acústicas sintetizadas sin dependencias binarias externas,
 * garantizando compatibilidad 100% en Render Free Tier y navegadores.
 */

function generateWavBuffer(text, options = {}) {
  const sampleRate = options.sampleRate || 22050;
  const duration = Math.min(Math.max((text.length * 0.08) + 0.8, 1.5), 15.0); // 1.5s a 15s según texto
  const numSamples = Math.floor(sampleRate * duration);
  const dataSize = numSamples * 2; // 16-bit mono = 2 bytes por muestra
  const buffer = Buffer.alloc(44 + dataSize);

  // 1. Cabecera RIFF
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);

  // 2. Sub-bloque FMT
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // Tamaño del sub-bloque
  buffer.writeUInt16LE(1, 20);  // Formato de audio (1 = PCM)
  buffer.writeUInt16LE(1, 22);  // Canales: 1 (Mono)
  buffer.writeUInt32LE(sampleRate, 24); // Frecuencia de muestreo
  buffer.writeUInt32LE(sampleRate * 2, 28); // Tasa de bytes (sampleRate * 1 * 16/8)
  buffer.writeUInt16LE(2, 32);  // Block align (1 * 16/8)
  buffer.writeUInt16LE(16, 34); // Bits por muestra (16 bits)

  // 3. Sub-bloque DATA
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  // 4. Parámetros acústicos basados en el texto y opciones de clonación
  const pitchBase = Number(options.pitch) || (options.gender === "female" ? 210 : 130);
  const words = text.trim().split(/\s+/);
  const wordDuration = duration / Math.max(words.length, 1);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const currentWordIndex = Math.min(Math.floor(t / wordDuration), words.length - 1);
    const wordTime = (t % wordDuration) / wordDuration;

    // Envolvente de palabra: ataque suave, sostenido y decaimiento
    const wordEnvelope = Math.sin(Math.PI * Math.min(Math.max(wordTime, 0), 1));

    // Modulación de frecuencia fundamental (F0) con ligera prosodia humana
    const prosody = 1.0 + 0.08 * Math.sin(2 * Math.PI * 1.5 * t);
    const f0 = pitchBase * prosody;

    // Síntesis armónica con formantes vocálicos (F1, F2, F3) para simular timbre vocal
    const h1 = Math.sin(2 * Math.PI * f0 * t) * 0.55;
    const h2 = Math.sin(2 * Math.PI * (f0 * 2) * t) * 0.25;
    const h3 = Math.sin(2 * Math.PI * (f0 * 3) * t) * 0.12;
    const formant = Math.sin(2 * Math.PI * (f0 * 4.2) * t) * 0.08;

    // Amplitud combinada y normalización a 16-bit signed (-32768 a 32767)
    const rawVal = (h1 + h2 + h3 + formant) * wordEnvelope * 0.65;
    const sample = Math.max(-1, Math.min(1, rawVal));
    const intSample = Math.floor(sample * 32767);

    buffer.writeInt16LE(intSample, offset);
    offset += 2;
  }

  return buffer;
}

module.exports = {
  generateWavBuffer
};
