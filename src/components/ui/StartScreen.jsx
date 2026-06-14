import { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader, DRACOLoader, MeshoptDecoder } from 'three-stdlib';
import { preload as cachePreload } from 'suspend-react';
import ClayButton from './ClayButton';
import styles from './StartScreen.module.css';
import logoImg from '../../assets/tec-virtual.png';

const DRACO_DECODER_PATH = 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/';

const ASSETS = [
  { type: 'model', path: '/scenes/tecsup.glb' },
  { type: 'model', path: '/models/Alejandro.glb' },
  { type: 'model', path: '/models/Felipe.glb' },
  { type: 'model', path: '/models/Isabella.glb' },
  { type: 'model', path: '/models/Sofia.glb' },
  { type: 'audio', path: '/audio/background.ogg' },
];

const TOTAL = ASSETS.length;

export default function StartScreen({ onStart }) {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let loaded = 0;

    const onLoad = () => {
      loaded++;
      setProgress(Math.round((loaded / TOTAL) * 100));

      if (loaded === TOTAL) {
        // Esperar 1 segundo antes de mostrar el botón
        setTimeout(() => setReady(true), 1000);
      }
    };

    // Loader reutilizable para modelos (con Draco + Meshopt, igual que useGLTF)
    const modelLoader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
    modelLoader.setDRACOLoader(dracoLoader);
    modelLoader.setMeshoptDecoder(
      typeof MeshoptDecoder === 'function' ? MeshoptDecoder() : MeshoptDecoder,
    );

    // Cargar modelos GLB y cachearlos en el cache de R3F (useLoader / useGLTF)
    ASSETS.filter((a) => a.type === 'model').forEach(({ path }) => {
      modelLoader.load(
        path,
        (gltf) => {
          // Almacenar en el cache de suspend-react para que useGLTF lo encuentre
          cachePreload(() => Promise.resolve(gltf), [GLTFLoader, path]);
          onLoad();
        },
        undefined,
        (err) => {
          console.error(`Error cargando modelo ${path}:`, err);
          onLoad(); // Igual contamos para no bloquear
        },
      );
    });

    // Cargar audio
    const audioLoader = new THREE.AudioLoader();
    const audioAsset = ASSETS.find((a) => a.type === 'audio');
    if (audioAsset) {
      audioLoader.load(audioAsset.path, onLoad, undefined, (err) => {
        console.error('Error cargando audio:', err);
        onLoad();
      });
    }
  }, []);

  return (
    <div className={styles.overlay}>
      <img src={logoImg} alt="TecVirtual" className={styles.logo} />
      <p className={styles.slogan}>Vive Tecsup a tu manera</p>

      {!ready ? (
        <div className={styles.loaderContainer}>
          {/* Barra de progreso */}
          <div className={styles.progressBarContainer}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className={styles.progressText}>
            {progress}%
          </p>
          <p className={styles.loadingText}>
            Cargando recursos...
          </p>
        </div>
      ) : (
        <ClayButton
          onClick={onStart}
          variant="cyan-light"
          className={styles.startBtn}
        >
          INICIAR
        </ClayButton>
      )}
    </div>
  );
}
