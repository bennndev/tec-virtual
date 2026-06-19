import { useEffect, useRef } from 'react';
import useStore from '../../store/useStore';
import { getAudioContext } from '../../services/audioContext';

const VOICE_VOLUME = 0.8;

const VOICE_PATHS = [
  '/audio/voices/paquito/01-bienvenida.ogg',
  '/audio/voices/paquito/02-movimiento.ogg',
  '/audio/voices/paquito/03-salto.ogg',
  '/audio/voices/paquito/04-correr.ogg',
  '/audio/voices/paquito/05-mapa.ogg',
  '/audio/voices/paquito/06-interactuar.ogg',
  '/audio/voices/paquito/07-despedida.ogg',
];

function playBuffer(ctx, gain, buffer) {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(gain);
  source.start(0);
  return source;
}

export default function VoicePlayer() {
  const currentDialogueIndex = useStore((s) => s.currentDialogueIndex);
  const indexRef = useRef(currentDialogueIndex);
  indexRef.current = currentDialogueIndex;
  const buffersRef = useRef([]);
  const sourceRef = useRef(null);
  const gainRef = useRef(null);

  useEffect(() => {
    const ctx = getAudioContext();
    const gain = ctx.createGain();
    gain.gain.value = VOICE_VOLUME;
    gain.connect(ctx.destination);
    gainRef.current = gain;

    VOICE_PATHS.forEach((path, i) => {
      fetch(path)
        .then((res) => res.arrayBuffer())
        .then((buf) => ctx.decodeAudioData(buf))
        .then((audioBuffer) => {
          buffersRef.current[i] = audioBuffer;

          if (i === indexRef.current) {
            if (sourceRef.current) {
              try { sourceRef.current.stop(); } catch { /* ya detenido */ }
              sourceRef.current.disconnect();
            }
            sourceRef.current = playBuffer(ctx, gain, audioBuffer);
          }
        })
        .catch((err) => {
          console.error(`Error cargando voz ${path}:`, err);
        });
    });

    return () => {
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch { /* ya detenido */ }
        sourceRef.current.disconnect();
      }
      gain.disconnect();
    };
  }, []);

  useEffect(() => {
    const buffer = buffersRef.current[currentDialogueIndex];
    if (!buffer) return;

    const ctx = getAudioContext();
    if (ctx.state === 'closed') return;

    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch { /* ya detenido */ }
      sourceRef.current.disconnect();
    }

    sourceRef.current = playBuffer(ctx, gainRef.current, buffer);
  }, [currentDialogueIndex]);

  return null;
}
