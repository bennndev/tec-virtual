import { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { GLTFLoader, DRACOLoader } from 'three-stdlib';
import * as THREE from 'three';
import useStore from '../../store/useStore';
import CHARACTERS from '../../data/characterConfig';
import CHAR_DATA from '../../store/characters.json';
import ClayButton from './ClayButton';
import styles from './CharacterSelector.module.css';

/** Modelo 3D individual adaptado al carrusel horizontal */
function CarouselModel({ modelUrl, active, targetX }) {
  const [scene, setScene] = useState(null);
  const groupRef = useRef();
  const materialsRef = useRef([]);

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
        // Reiniciar transformaciones base
        gltf.scene.position.set(0, 0, 0);
        gltf.scene.rotation.set(0, 0, 0);
        gltf.scene.scale.set(1, 1, 1);
        gltf.scene.updateMatrix();

        // Clonar materiales de forma individual para modificar la opacidad sin interferencias
        const mats = [];
        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            child.material = child.material.clone();
            child.material.transparent = true;
            child.material.opacity = active ? 1.0 : 0.25;
            mats.push(child.material);
          }
        });
        materialsRef.current = mats;

        setScene(gltf.scene);
      },
      undefined,
      () => { /* ignorar errores silenciosamente */ },
    );

    return () => {
      cancelled = true;
    };
  }, [modelUrl]);

  // Centrar el modelo sobre el eje Y basándose en meshes visibles
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
    if (!groupRef.current) return;

    // 1. Giro constante en eje Y
    groupRef.current.rotation.y += delta * 0.4;

    // 2. Interpolación suave de posición X (desplazamiento horizontal del carrusel)
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.1);

    // 3. Interpolación suave de escala (grande si está seleccionado, pequeño si no)
    const targetScale = active ? 1.3 : 0.75;
    const currentScale = groupRef.current.scale.x;
    const newScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.1);
    groupRef.current.scale.setScalar(newScale);

    // 4. Interpolación suave de la opacidad (claro si está activo, difuminado/translúcido si no)
    const targetOpacity = active ? 1.0 : 0.25;
    materialsRef.current.forEach((mat) => {
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.1);
    });
  });

  if (!scene) return null;

  return (
    <group ref={groupRef} position={[targetX, 0, 0]}>
      {/* Centrado del pivot */}
      <group position={[0, -centerY, 0]}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

/** Canvas del carrusel de personajes */
function PreviewCanvas({ characterIds, previewCharacter, isMobile }) {
  const activeIndex = characterIds.indexOf(previewCharacter);

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 40 }}
      gl={{ alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[0, 8, 5]} intensity={1.5} />
      <pointLight position={[0, 2, 2]} intensity={0.5} distance={10} />
      
      {characterIds.map((charId, idx) => {
        const charConfig = CHARACTERS[charId];
        // En móviles, achicar el gap de los lados para que quepan en pantalla
        const stepX = isMobile ? 1.6 : 2.3;
        const targetX = (idx - activeIndex) * stepX;

        return (
          <CarouselModel
            key={charId}
            modelUrl={charConfig.modelUrl}
            active={idx === activeIndex}
            targetX={targetX}
          />
        );
      })}
    </Canvas>
  );
}

export default function CharacterSelector() {
  const isSelectorOpen = useStore((s) => s.isSelectorOpen);
  const setSelectorOpen = useStore((s) => s.setSelectorOpen);
  const previewCharacter = useStore((s) => s.previewCharacter);
  const setPreviewCharacter = useStore((s) => s.setPreviewCharacter);
  const setActiveCharacter = useStore((s) => s.setActiveCharacter);

  const [isMobile, setIsMobile] = useState(false);
  const characterIds = Object.keys(CHARACTERS);

  // Monitorizar tamaño de ventana para ajustar espaciado responsive
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Navegación por teclado
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

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Título superior */}
        <h2 className={styles.title}>
          Seleccioná tu Personaje
        </h2>

        {/* Carrusel 3D horizontal */}
        <div className={styles.previewContainer}>
          <PreviewCanvas
            characterIds={characterIds}
            previewCharacter={previewCharacter}
            isMobile={isMobile}
          />
        </div>

        {/* Nombre del personaje seleccionado (sin descripción) */}
        <div className={styles.nameContainer}>
          <span className={styles.characterName}>
            {charInfo.name}
          </span>
        </div>

        {/* Separador */}
        <div className={styles.separator} />

        {/* Fila de controles e interacción */}
        <div className={styles.controlsContainer}>
          <div className={styles.navRow}>
            {/* Navegación izquierda */}
            <ClayButton
              onClick={goPrev}
              variant="cyan-light"
              className={styles.navBtn}
              aria-label="Anterior"
            >
              ◀
            </ClayButton>

            {/* Confirmar Selección */}
            <ClayButton
              onClick={selectAndClose}
              variant="cyan-solid"
              className={styles.actionBtn}
            >
              Seleccionar
            </ClayButton>

            {/* Cancelar y salir */}
            <ClayButton
              onClick={close}
              variant="cyan-light"
              className={styles.actionBtn}
            >
              Cancelar
            </ClayButton>

            {/* Navegación derecha */}
            <ClayButton
              onClick={goNext}
              variant="cyan-light"
              className={styles.navBtn}
              aria-label="Siguiente"
            >
              ▶
            </ClayButton>
          </div>
        </div>
      </div>
    </div>
  );
}
