import { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { GLTFLoader, DRACOLoader } from 'three-stdlib';
import * as THREE from 'three';
import useStore from '../../store/useStore';
import CHARACTERS from '../../data/characterConfig';
import CHAR_DATA from '../../store/characters.json';
import ClayButton from './ClayButton';
import ClayIcon from './ClayIcon';
import styles from './CharacterSelector.module.css';

/** Modelo 3D giratorio dentro del preview */
function PreviewModel({ modelUrl }) {
  const [scene, setScene] = useState(null);
  const groupRef = useRef();
  const loadedSceneRef = useRef(null);

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
        loadedSceneRef.current = gltf.scene;
        setScene(gltf.scene);
      },
      undefined,
      () => { /* ignore load errors silently */ },
    );

    return () => {
      cancelled = true;
      if (loadedSceneRef.current) {
        // Liberar recursos de WebGL para evitar memory leaks
        loadedSceneRef.current.traverse((child) => {
          if (child.isMesh) {
            if (child.geometry) {
              child.geometry.dispose();
            }
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((mat) => mat.dispose());
              } else {
                child.material.dispose();
              }
            }
          }
        });
      }
    };
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
      camera={{ position: [0, 0, 3.5], fov: 40 }}
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
  const gameState = useStore((s) => s.gameState);

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
    if (gameState === 'character_select') {
      useStore.getState().setGameState('game');
      useStore.getState().setIntro();
    }
  }, [previewCharacter, setActiveCharacter, setSelectorOpen, gameState]);

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
          if (gameState === 'game') {
            close();
          }
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSelectorOpen, goPrev, goNext, selectAndClose, close, gameState]);

  if (!isSelectorOpen) return null;

  const currentIdx = characterIds.indexOf(previewCharacter);
  const charInfo = CHAR_DATA[currentIdx] || CHAR_DATA[0];
  const charConfig = CHARACTERS[previewCharacter];

  const isFullscreenView = gameState === 'character_select';

  return (
    <div className={`${styles.overlay} ${isFullscreenView ? styles.fullscreenOverlay : ''}`.trim()}>
      <div className={`${styles.modal} ${isFullscreenView ? styles.fullscreenLayout : ''}`.trim()}>
        {/* Preview 3D — responsive */}
        <div className={styles.previewContainer}>
          <PreviewCanvas modelUrl={charConfig.modelUrl} />
        </div>

        {/* Info: Nombre, descripción, navegación, acciones */}
        <div className={styles.infoContainer}>
          {/* Bloque de texto con scroll interno si desborda */}
          <div className={styles.textBlock}>
            <h2 className={styles.title}>
              {charInfo.name}
            </h2>
            <p className={styles.desc}>
              {charInfo.description}
            </p>
          </div>

          {/* Navegación: ◄  X / Y  ► */}
          <div className={styles.navRow}>
            <ClayButton
              onClick={goPrev}
              variant="cyan-light"
              className={styles.navBtn}
              aria-label="Anterior"
            >
              <ClayIcon name="chevron_left" />
            </ClayButton>
            <span className={styles.navText}>
              {currentIdx + 1} / {characterIds.length}
            </span>
            <ClayButton
              onClick={goNext}
              variant="cyan-light"
              className={styles.navBtn}
              aria-label="Siguiente"
            >
              <ClayIcon name="chevron_right" />
            </ClayButton>
          </div>

          {/* Acciones */}
          <div className={styles.actionsRow}>
            <ClayButton
              onClick={selectAndClose}
              variant="cyan-solid"
              className={styles.actionBtn}
            >
              Seleccionar
            </ClayButton>
            {gameState === 'game' && (
              <ClayButton
                onClick={close}
                variant="cyan-light"
                className={styles.actionBtn}
              >
                Cancelar
              </ClayButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
