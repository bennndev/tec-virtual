import { getAudioContext, ensureResumed } from './audioContext';

const COIN_PATH = '/audio/coin-pickup.wav';
let bufferPromise = null;

function loadBuffer() {
  if (!bufferPromise) {
    const ctx = getAudioContext();
    bufferPromise = fetch(COIN_PATH)
      .then((res) => res.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data))
      .catch((err) => {
        console.error('Error cargando sonido de moneda:', err);
        bufferPromise = null;
        return null;
      });
  }
  return bufferPromise;
}

export function preloadCoinPickup() {
  loadBuffer();
}

export async function playCoinPickup() {
  ensureResumed();
  const ctx = getAudioContext();
  const buffer = await loadBuffer();
  if (!buffer || ctx.state === 'closed') return;
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  gain.gain.value = 0.45;
  src.buffer = buffer;
  src.connect(gain);
  gain.connect(ctx.destination);
  src.start(0);
}
