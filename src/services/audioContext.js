let instance = null;

export function getAudioContext() {
  if (!instance) {
    instance = new AudioContext();
  }
  return instance;
}

export function ensureResumed() {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
}
