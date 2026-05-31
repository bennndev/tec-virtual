import { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader, DRACOLoader, MeshoptDecoder } from 'three-stdlib';
import { preload as cachePreload } from 'suspend-react';

const DRACO_DECODER_PATH = 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/';

const ASSETS = [
  { type: 'model', path: '/models/test-character.glb' },
  { type: 'model', path: '/models/test-character2.glb' },
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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0a0a1a 100%)',
        fontFamily: 'ui-monospace, Consolas, monospace',
        color: '#fff',
      }}
    >
      {/* Línea decorativa superior */}
      <div
        style={{
          width: '60px',
          height: '2px',
          background: '#e94560',
          marginBottom: '32px',
        }}
      />

      <h1
        style={{
          margin: 0,
          fontSize: 'clamp(28px, 5vw, 52px)',
          fontWeight: 700,
          letterSpacing: '2px',
          textAlign: 'center',
        }}
      >
        ¡Bienvenido a{' '}
        <span style={{ color: '#e94560' }}>Tec-Virtual</span>
        !
      </h1>

      <p
        style={{
          marginTop: '16px',
          fontSize: 'clamp(14px, 2vw, 18px)',
          opacity: 0.6,
          letterSpacing: '0.5px',
        }}
      >
        Explora el mundo virtual de la Tecnología
      </p>

      {/* Línea decorativa inferior */}
      <div
        style={{
          width: '60px',
          height: '2px',
          background: '#e94560',
          marginTop: '32px',
          marginBottom: '48px',
        }}
      />

      {!ready ? (
        <div style={{ textAlign: 'center' }}>
          {/* Barra de progreso */}
          <div
            style={{
              width: 'clamp(240px, 40vw, 400px)',
              height: '4px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: '#e94560',
                borderRadius: '2px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <p
            style={{
              marginTop: '16px',
              fontSize: 'clamp(20px, 3vw, 32px)',
              fontWeight: 600,
              color: '#e94560',
              letterSpacing: '1px',
            }}
          >
            {progress}%
          </p>
          <p
            style={{
              marginTop: '4px',
              fontSize: '13px',
              opacity: 0.4,
              letterSpacing: '0.5px',
            }}
          >
            Cargando recursos...
          </p>
        </div>
      ) : (
        <button
          onClick={onStart}
          style={{
            padding: '14px 48px',
            fontSize: '16px',
            fontWeight: 600,
            fontFamily: 'inherit',
            letterSpacing: '1px',
            color: '#fff',
            background: '#e94560',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s, background 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 0 24px rgba(233, 69, 96, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          INICIAR
        </button>
      )}
    </div>
  );
}
