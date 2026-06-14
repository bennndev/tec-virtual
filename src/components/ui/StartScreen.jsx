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
      {/* Floating 3D Wireframes */}
      <div className={styles.wireframes}>
        {/* Cubo 1 */}
        <svg className={`${styles.shape} ${styles.shape1}`} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
          <polygon points="50,10 85,30 85,70 50,90 15,70 15,30" />
          <polyline points="50,50 50,10" />
          <polyline points="50,50 85,70" />
          <polyline points="50,50 15,70" />
        </svg>
        
        {/* Cubo 2 */}
        <svg className={`${styles.shape} ${styles.shape2}`} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
          <polygon points="50,10 85,30 85,70 50,90 15,70 15,30" />
          <polyline points="50,50 50,10" />
          <polyline points="50,50 85,70" />
          <polyline points="50,50 15,70" />
        </svg>

        {/* Pirámide */}
        <svg className={`${styles.shape} ${styles.shape3}`} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
          <polygon points="50,15 15,75 85,75" />
          <polyline points="50,15 50,55" />
          <polyline points="15,75 50,55 85,75" />
        </svg>

        {/* Octaedro / Rombo 3D */}
        <svg className={`${styles.shape} ${styles.shape4}`} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
          <polygon points="50,10 85,50 50,90 15,50" />
          <polyline points="15,50 50,35 85,50" />
          <polyline points="15,50 50,65 85,50" />
          <polyline points="50,10 50,35 50,90" />
          <polyline points="50,10 50,65 50,90" />
        </svg>

        {/* Pirámide 2 */}
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
