import { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import ClayButton from './ClayButton';
import styles from './StartScreen.module.css';
import logoImg from '../../assets/tec-virtual.png';

const MODELS = [
  '/scenes/tecsup.glb',
  '/models/Alejandro.glb',
  '/models/Felipe.glb',
  '/models/Isabella.glb',
  '/models/Sofia.glb',
];

const AUDIO_PATHS = [
  '/audio/background.ogg',
  '/audio/voices/paquito/01-bienvenida.ogg',
  '/audio/voices/paquito/02-movimiento.ogg',
  '/audio/voices/paquito/03-salto.ogg',
  '/audio/voices/paquito/04-correr.ogg',
  '/audio/voices/paquito/05-mapa.ogg',
  '/audio/voices/paquito/06-interactuar.ogg',
  '/audio/voices/paquito/07-despedida.ogg',
];

export default function StartScreen({ onStart }) {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const rafRef = useRef(null);

  useEffect(() => {
    let audiosLoaded = 0;
    const totalAudios = AUDIO_PATHS.length;
    const startTime = Date.now();
    const MIN_LOAD_MS = 2000;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / MIN_LOAD_MS, 1);
      const simulated = t < 1 ? 90 * (1 - Math.pow(1 - t, 3)) : 90;

      setProgress(Math.round(audiosLoaded === totalAudios ? 100 : simulated));

      if (audiosLoaded < totalAudios) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    MODELS.forEach((url) => useGLTF.preload(url));

    const audioLoader = new THREE.AudioLoader();
    AUDIO_PATHS.forEach((path) => {
      audioLoader.load(
        path,
        () => {
          audiosLoaded++;
          if (audiosLoaded === totalAudios) {
            setProgress(100);
            setTimeout(() => setReady(true), 400);
          }
        },
        undefined,
        () => {
          audiosLoaded++;
          if (audiosLoaded === totalAudios) {
            setProgress(100);
            setTimeout(() => setReady(true), 400);
          }
        },
      );
    });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className={styles.overlay}>
      {/* Floating 3D Wireframes */}
      <div className={styles.wireframes}>
        <svg className={`${styles.shape} ${styles.shape1}`} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
          <polygon points="50,10 85,30 85,70 50,90 15,70 15,30" />
          <polyline points="50,50 50,10" />
          <polyline points="50,50 85,70" />
          <polyline points="50,50 15,70" />
        </svg>

        <svg className={`${styles.shape} ${styles.shape2}`} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
          <polygon points="50,10 85,30 85,70 50,90 15,70 15,30" />
          <polyline points="50,50 50,10" />
          <polyline points="50,50 85,70" />
          <polyline points="50,50 15,70" />
        </svg>

        <svg className={`${styles.shape} ${styles.shape3}`} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
          <polygon points="50,15 15,75 85,75" />
          <polyline points="50,15 50,55" />
          <polyline points="15,75 50,55 85,75" />
        </svg>

        <svg className={`${styles.shape} ${styles.shape4}`} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
          <polygon points="50,10 85,50 50,90 15,50" />
          <polyline points="15,50 50,35 85,50" />
          <polyline points="15,50 50,65 85,50" />
          <polyline points="50,10 50,35 50,90" />
          <polyline points="50,10 50,65 50,90" />
        </svg>

        <svg className={`${styles.shape} ${styles.shape5}`} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
          <polygon points="50,15 15,75 85,75" />
          <polyline points="50,15 50,55" />
          <polyline points="15,75 50,55 85,75" />
        </svg>
      </div>

      <img src={logoImg} alt="TecVirtual" className={styles.logo} />

      <div className={styles.bottomContent}>
        <p className={styles.slogan}>Vive Tecsup a tu manera</p>

        {!ready ? (
          <div className={styles.loaderContainer}>
            <div className={styles.progressBarContainer}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className={styles.progressText}>{progress}%</p>
            <p className={styles.loadingText}>Cargando recursos...</p>
          </div>
        ) : (
          <div className={styles.btnWrapper}>
            <ClayButton
              onClick={onStart}
              variant="cyan-light"
              className={styles.startBtn}
            >
              INICIAR
            </ClayButton>
          </div>
        )}
      </div>
    </div>
  );
}
