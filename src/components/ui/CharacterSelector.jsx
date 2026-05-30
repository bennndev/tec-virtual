import { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { GLTFLoader, DRACOLoader } from 'three-stdlib';
import * as THREE from 'three';
import useStore from '../../store/useStore';
import CHARACTERS from '../../data/characterConfig';
import CHAR_DATA from '../../store/characters.json';

/** Modelo 3D giratorio dentro del preview */
function PreviewModel({ modelUrl }) {
  const [scene, setScene] = useState(null);
  const groupRef = useRef();

  // Cargar el GLB independientemente, sin usar el caché de useGLTF
  // (que ecctrl modifica in-game con animaciones y transformaciones)
  useEffect(() => {
    let cancelled = false;

    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      modelUrl,
      (gltf) => {
        if (cancelled) return;
        // Forzar el modelo a origen: crudo, sin modificaciones
        gltf.scene.position.set(0, 0, 0);
        gltf.scene.rotation.set(0, 0, 0);
        gltf.scene.scale.set(1, 1, 1);
        gltf.scene.updateMatrix();
        setScene(gltf.scene);
      },
      undefined,
      () => { /* ignore load errors silently */ },
    );

    return () => { cancelled = true; };
  }, [modelUrl]);

  // Calcular el centro del modelo mirando SOLO mallas visibles
  const centerY = useMemo(() => {
    if (!scene) return 0;
    const box = new THREE.Box3();
    scene.traverse((child) => {
      if (child.isMesh && child.visible) {
        box.expandByObject(child);
      }
    });
    if (box.isEmpty()) return 0;
    return box.getCenter(new THREE.Vector3()).y;
  }, [scene]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5;
    }
  });

  // No mostrar nada hasta que el modelo esté cargado
  if (!scene) return null;

  return (
    <group ref={groupRef}>
      <group position={[0, -centerY, 0]}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

/** Mini Canvas de previsualización del personaje */
function PreviewCanvas({ modelUrl }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 40 }}
      gl={{ alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <directionalLight position={[-5, -3, -5]} intensity={0.4} />
      <PreviewModel key={modelUrl} modelUrl={modelUrl} />
    </Canvas>
  );
}

export default function CharacterSelector() {
  const isSelectorOpen = useStore((s) => s.isSelectorOpen);
  const setSelectorOpen = useStore((s) => s.setSelectorOpen);
  const previewCharacter = useStore((s) => s.previewCharacter);
  const setPreviewCharacter = useStore((s) => s.setPreviewCharacter);
  const setActiveCharacter = useStore((s) => s.setActiveCharacter);

  const characterIds = Object.keys(CHARACTERS);

  const goPrev = useCallback(() => {
    const currentIdx = characterIds.indexOf(previewCharacter);
    const prevIdx = (currentIdx - 1 + characterIds.length) % characterIds.length;
    setPreviewCharacter(characterIds[prevIdx]);
  }, [previewCharacter, characterIds, setPreviewCharacter]);

  const goNext = useCallback(() => {
    const currentIdx = characterIds.indexOf(previewCharacter);
    const nextIdx = (currentIdx + 1) % characterIds.length;
    setPreviewCharacter(characterIds[nextIdx]);
  }, [previewCharacter, characterIds, setPreviewCharacter]);

  const selectAndClose = useCallback(() => {
    setActiveCharacter(previewCharacter);
    setSelectorOpen(false);
  }, [previewCharacter, setActiveCharacter, setSelectorOpen]);

  const close = useCallback(() => {
    setSelectorOpen(false);
  }, [setSelectorOpen]);

  // Teclado: solo activo cuando el selector está abierto
  useEffect(() => {
    if (!isSelectorOpen) return;

    const onKeyDown = (e) => {
      switch (e.code) {
        case 'ArrowLeft':
          e.preventDefault();
          goPrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goNext();
          break;
        case 'Enter':
          e.preventDefault();
          selectAndClose();
          break;
        case 'Escape':
          e.preventDefault();
          close();
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSelectorOpen, goPrev, goNext, selectAndClose, close]);

  if (!isSelectorOpen) return null;

  const currentIdx = characterIds.indexOf(previewCharacter);
  const charInfo = CHAR_DATA[currentIdx] || CHAR_DATA[0];
  const charConfig = CHARACTERS[previewCharacter];

  const txtBtn = {
    background: 'rgba(233, 69, 96, 0.85)',
    color: '#fff',
    border: 'none',
    padding: '10px 24px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: 'ui-monospace, Consolas, monospace',
    fontSize: '14px',
    fontWeight: 500,
    letterSpacing: '0.3px',
    transition: 'background 0.2s',
    pointerEvents: 'auto',
  };

  const secBtn = {
    ...txtBtn,
    background: 'rgba(255,255,255,0.1)',
  };

  const navBtn = {
    background: 'none',
    color: '#fff',
    border: 'none',
    fontSize: 22,
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 4,
    transition: 'background 0.2s',
    pointerEvents: 'auto',
    lineHeight: 1,
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        zIndex: 20,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'auto',
        fontFamily: 'ui-monospace, Consolas, monospace',
      }}
    >
      <div
        style={{
          background: '#1a1a2e',
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'row',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}
      >
        {/* Izquierda: Preview 3D — ocupa todo el alto */}
        <div style={{ width: 340, height: 520 }}>
          <PreviewCanvas modelUrl={charConfig.modelUrl} />
        </div>

        {/* Derecha: Nombre, descripción, navegación, acciones */}
        <div
          style={{
            width: 300,
            padding: '40px 36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 16,
          }}
        >
          {/* Nombre */}
          <h2 style={{ color: '#fff', fontSize: 22, margin: 0 }}>
            {charInfo.name}
          </h2>

          {/* Descripción */}
          <p style={{ color: '#999', fontSize: 13, margin: 0, lineHeight: 1.7 }}>
            {charInfo.description}
          </p>

          {/* Separador */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />

          {/* Navegación: ◄  X / Y  ► */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              style={navBtn}
              onClick={goPrev}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              aria-label="Anterior"
            >
              ◀
            </button>
            <span style={{ color: '#666', fontSize: 13, minWidth: 50, textAlign: 'center' }}>
              {currentIdx + 1} / {characterIds.length}
            </span>
            <button
              style={navBtn}
              onClick={goNext}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              aria-label="Siguiente"
            >
              ▶
            </button>
          </div>

          {/* Separador */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />

          {/* Acciones */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              style={txtBtn}
              onClick={selectAndClose}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(233, 69, 96, 1)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(233, 69, 96, 0.85)')}
            >
              Seleccionar
            </button>
            <button
              style={secBtn}
              onClick={close}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
