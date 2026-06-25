import { useEffect, useRef } from 'react';
import useStore from '../../store/useStore';
import { getAudioContext } from '../../services/audioContext';

const VOICE_VOLUME = 0.8;

const PAQUITO_TUTORIAL = [
  '/audio/voices/paquito/01-bienvenida.ogg',
  '/audio/voices/paquito/02-movimiento.ogg',
  '/audio/voices/paquito/03-salto.ogg',
  '/audio/voices/paquito/04-correr.ogg',
  '/audio/voices/paquito/05-mapa.ogg',
  '/audio/voices/paquito/06-interactuar.ogg',
  '/audio/voices/paquito/07-despedida.ogg',
];

const PAQUITO_GAME = [
  '/audio/voices/paquito/08-guia-marketing-1.ogg',
  '/audio/voices/paquito/09-guia-marketing-2.ogg',
  '/audio/voices/paquito/10-guia-marketing-3.ogg',
  '/audio/voices/paquito/11-llegaste-marketing.ogg',
  '/audio/voices/paquito/12-divertido.ogg',
  '/audio/voices/paquito/13-explorar-redes.ogg',
  '/audio/voices/paquito/14-explorar-carreras.ogg',
  '/audio/voices/paquito/15-termina-recorrido.ogg',
  '/audio/voices/paquito/16-despedida-final.ogg',
];

const GUARDIA = [
  '/audio/voices/guardia/01-buenos-dias.ogg',
  '/audio/voices/guardia/02-identificacion.ogg',
  '/audio/voices/guardia/03-todo-en-orden.ogg',
  '/audio/voices/guardia/04-bienvenido.ogg',
];

const DOCENTE_MARKETING = [
  '/audio/voices/teacher/marketing/01-bienvenida.ogg',
  '/audio/voices/teacher/marketing/02-anuncios-campanas.ogg',
  '/audio/voices/teacher/marketing/03-marketing-hoy.ogg',
  '/audio/voices/teacher/marketing/04-estacion-mision.ogg',
];

const DOCENTE_REDES = [
  '/audio/voices/teacher/redes/01-bienvenida.ogg',
  '/audio/voices/teacher/redes/02-disenar-redes.ogg',
  '/audio/voices/teacher/redes/03-ciberseguridad.ogg',
  '/audio/voices/teacher/redes/04-dos-misiones.ogg',
];

const VOICE_CONFIG = {
  'paquito-bot': { game: PAQUITO_GAME },
  'guardia_tecsup': { game: GUARDIA },
  'docente_marketing': { game: DOCENTE_MARKETING },
  'docente_redes': { game: DOCENTE_REDES },
};

function resolvePaths(npcId, gameState) {
  if (gameState === 'tutorial') return PAQUITO_TUTORIAL;
  if (gameState === 'game' && npcId && VOICE_CONFIG[npcId]?.[gameState]) {
    return VOICE_CONFIG[npcId][gameState];
  }
  return null;
}

function playBuffer(ctx, gain, buffer) {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(gain);
  source.start(0);
  return source;
}

export default function VoicePlayer() {
  const currentDialogueIndex = useStore((s) => s.currentDialogueIndex);
  const npcId = useStore((s) => s.activeDialogueNPC?.id);
  const gameState = useStore((s) => s.gameState);

  const voiceKey = npcId ? `${npcId}-${gameState}` : gameState;
  const paths = resolvePaths(npcId, gameState);

  const indexRef = useRef(currentDialogueIndex);
  indexRef.current = currentDialogueIndex;
  const buffersRef = useRef([]);
  const sourceRef = useRef(null);
  const gainRef = useRef(null);

  useEffect(() => {
    if (!paths) return;

    const ctx = getAudioContext();
    const gain = ctx.createGain();
    gain.gain.value = VOICE_VOLUME;
    gain.connect(ctx.destination);
    gainRef.current = gain;

    const localBuffers = [];
    buffersRef.current = localBuffers;

    paths.forEach((path, i) => {
      fetch(path)
        .then((res) => res.arrayBuffer())
        .then((buf) => ctx.decodeAudioData(buf))
        .then((audioBuffer) => {
          localBuffers[i] = audioBuffer;

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
        sourceRef.current = null;
      }
      gain.disconnect();
      buffersRef.current = [];
    };
  }, [voiceKey]);

  useEffect(() => {
    if (!paths) return;

    const buffer = buffersRef.current[currentDialogueIndex];
    if (!buffer) return;

    const ctx = getAudioContext();
    if (ctx.state === 'closed') return;

    if (sourceRef.current) {
      try { sourceRef.current.stop(); } catch { /* ya detenido */ }
      sourceRef.current.disconnect();
    }

    sourceRef.current = playBuffer(ctx, gainRef.current, buffer);
  }, [currentDialogueIndex, paths]);

  return null;
}
