import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../../store/useStore';
import { getAudioContext } from '../../services/audioContext';

const VOLUME = 0.3;
const AUDIO_PATH = '/audio/background.ogg';

export default function BackgroundMusic() {
  const { camera } = useThree();
  const musicMuted = useStore((s) => s.musicMuted);
  const soundRef = useRef(null);

  useEffect(() => {
    const ctx = getAudioContext();
    const listener = new THREE.AudioListener(ctx);
    camera.add(listener);

    const sound = new THREE.Audio(listener);
    soundRef.current = sound;

    const loader = new THREE.AudioLoader();
    loader.load(
      AUDIO_PATH,
      (buffer) => {
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(musicMuted ? 0 : VOLUME);

        if (ctx.state === 'running') {
          sound.play();
        }
      },
      undefined,
      (err) => {
        console.error('Error cargando audio:', err);
      },
    );

    return () => {
      sound.stop();
      sound.disconnect();
      camera.remove(listener);
    };
  }, [camera]);

  // Sincronizar mute sin reiniciar el audio (solo baja/sube volumen)
  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.setVolume(musicMuted ? 0 : VOLUME);
    }
  }, [musicMuted]);

  // Componente invisible — no renderiza nada
  return null;
}
