const fs = require('node:fs');
const path = require('node:path');

function generateTone(frequency, durationSec, sampleRate, volume) {
  const numSamples = Math.floor(sampleRate * durationSec);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const attack = Math.min(1, i / (sampleRate * 0.008));
    const releaseStart = numSamples - Math.floor(sampleRate * 0.06);
    const release = i >= releaseStart ? Math.max(0, 1 - (i - releaseStart) / (sampleRate * 0.06)) : 1;
    const t = i / sampleRate;
    samples[i] = Math.sin(2 * Math.PI * frequency * t) * volume * attack * release;
  }
  return samples;
}

function concatSamples(arrays) {
  const total = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const out = new Float32Array(total);
  let offset = 0;
  for (const arr of arrays) {
    out.set(arr, offset);
    offset += arr.length;
  }
  return out;
}

function floatTo16BitPcm(float32Array) {
  const buffer = Buffer.alloc(float32Array.length * 2);
  for (let i = 0; i < float32Array.length; i++) {
    const sample = Math.max(-1, Math.min(1, float32Array[i]));
    buffer.writeInt16LE(sample < 0 ? sample * 0x8000 : sample * 0x7fff, i * 2);
  }
  return buffer;
}

function writeWav(filepath, samples, sampleRate) {
  const pcm = floatTo16BitPcm(samples);
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  fs.writeFileSync(filepath, Buffer.concat([header, pcm]));
}

const sampleRate = 44100;
const samples = concatSamples([
  generateTone(880, 0.09, sampleRate, 0.28),
  new Float32Array(Math.floor(sampleRate * 0.035)),
  generateTone(1174.66, 0.14, sampleRate, 0.24),
]);

const outPath = path.join(__dirname, '../assets/sounds/launch-alert.wav');
writeWav(outPath, samples, sampleRate);
console.log(`OK: ${outPath}`);
