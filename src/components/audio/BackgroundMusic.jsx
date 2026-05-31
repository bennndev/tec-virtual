import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../../store/useStore';

const VOLUME = 0.3;
const AUDIO_PATH = '/audio/background.ogg';

export default function BackgroundMusic() {
  const { camera } = useThree();
  const musicMuted = useStore((s) => s.musicMuted);
  const listenerRef = useRef(null);
  const soundRef = useRef(null);

  useEffect(() => {
    // 1. Crear el listener y pegarlo a la cámara
    const listener = new THREE.AudioListener();
    camera.add(listener);
    listenerRef.current = listener;

    // 2. Crear la fuente de audio global (no posicional)
    const sound = new THREE.Audio(listener);
    soundRef.current = sound;

    const context = listener.context;
    let isLoaded = false;

    // 3. Cargar el buffer
    const loader = new THREE.AudioLoader();
    loader.load(
      AUDIO_PATH,
      (buffer) => {
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(musicMuted ? 0 : VOLUME);
        isLoaded = true;

        // Solo reproducir si el AudioContext ya está activo
        if (context.state === 'running') {
          sound.play();
        }
      },
      undefined,
      (err) => {
        console.error('Error cargando audio:', err);
      },
    );

    // 4. Reanudar AudioContext en el primer click del usuario
    const resume = () => {
      if (context.state === 'suspended') {
        context.resume().then(() => {
          if (isLoaded && !sound.isPlaying) {
            sound.play();
          }
        });
      }
    };
    window.addEventListener('pointerdown', resume, { once: true });

    // Cleanup total al desmontar
    return () => {
      window.removeEventListener('pointerdown', resume);
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
