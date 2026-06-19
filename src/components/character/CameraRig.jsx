import { useEffect, useRef, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import useStore from '../../store/useStore';
import { CHARACTER_INIT_DIR } from '../../data/characterConfig';

const OVERVIEW_OFFSET = new THREE.Vector3(0, 12, -8);


export default function CameraRig() {
  const { camera, clock } = useThree();
  const cameraMode = useStore((s) => s.cameraMode);
  const setCameraMode = useStore((s) => s.setCameraMode);
  const setControlsDisabled = useStore((s) => s.setControlsDisabled);
  const setTransitioningCamera = useStore((s) => s.setTransitioningCamera);

  const isIntro = useStore((s) => s.isIntro);
  const isTransitioning = useRef(false);
  const gsapRef = useRef(null);

  // Ref en vez de Zustand subscription: evita 60 re-renders/s
  const playerPosRef = useRef({ x: 0, y: 0, z: 0 });

  // Refs para controlar el arrastre de órbita en vista panorámica
  const orbitAngle = useRef(0);
  const orbitPitch = useRef(0.4); // Elevación inicial en radianes (~23 grados)
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const lastInteractionTime = useRef(0);

  // Vectores reutilizables para no alocar en cada frame
  const tmpVec = useRef(new THREE.Vector3());
  const tmpTarget = useRef(new THREE.Vector3());
  const tmpQuat = useRef(new THREE.Quaternion());
  const tmpMatrix = useRef(new THREE.Matrix4());

  // Overview / Modo Águila: órbita panorámica alrededor del escenario
  useFrame((state, delta) => {
    // Leer última posición SIN subscription (no causa re-render)
    const pos = useStore.getState().playerPosition;
    playerPosRef.current = pos;

    if (cameraMode !== 'overview' || isTransitioning.current) return;

    // Calcular centro y radio dinámicamente usando mapBounds
    const mapBounds = useStore.getState().mapBounds;
    const { minX, maxX, minZ, maxZ } = mapBounds;
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const width = maxX - minX;
    const depth = maxZ - minZ;
    
    const radius = Math.max(width, depth) * 0.55;
    const height = radius * 0.45;

    // Si no se está arrastrando y pasaron más de 3 segundos desde la última interacción, rotar automáticamente
    if (!isDragging.current && Date.now() - lastInteractionTime.current > 3000) {
      orbitAngle.current += 0.025 * delta;
    }

    const targetPos = tmpTarget.current.set(
      centerX + Math.cos(orbitAngle.current) * Math.cos(orbitPitch.current) * radius,
      height + Math.sin(orbitPitch.current) * radius,
      centerZ + Math.sin(orbitAngle.current) * Math.cos(orbitPitch.current) * radius
    );

    // Frame-rate independent lerp
    const smoothFactor = 1 - Math.exp(-5 * delta);
    camera.position.lerp(targetPos, smoothFactor);

    // Enfocar el centro del campus
    const lookTarget = tmpVec.current.set(centerX, 2, centerZ);
    tmpMatrix.current.lookAt(camera.position, lookTarget, camera.up);
    tmpQuat.current.setFromRotationMatrix(tmpMatrix.current);
    camera.quaternion.slerp(tmpQuat.current, smoothFactor);
  });

  // Animación GSAP para transiciones entre modos
  const animateCamera = useCallback((targetPos, lookAtFn, onComplete) => {
    if (gsapRef.current) gsapRef.current.kill();

    gsapRef.current = gsap.to(camera.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 1.2,
      ease: 'power2.inOut',
      onUpdate: function () {
        lookAtFn?.(this.progress());
      },
      onComplete: () => {
        isTransitioning.current = false;
        gsapRef.current = null;
        onComplete?.();
      },
    });
  }, [camera]);

  // Animación de introducción: cámara desde arriba → detrás del personaje
  useEffect(() => {
    if (!isIntro) return;

    let cancelled = false;

    // Posicionar cámara arriba del escenario ANTES del primer render
    const offset = useStore.getState().glbOffset;
    camera.position.set(offset.x, 12 + offset.y, -8 + offset.z);
    camera.lookAt(offset.x, offset.y, offset.z);

    // Pequeña espera para que el personaje aparezca y la escena se estabilice
    const timer = setTimeout(() => {
      if (cancelled) return;

      const pos = useStore.getState().playerPosition;
      const theta = CHARACTER_INIT_DIR;
      const target = new THREE.Vector3(
        pos.x + Math.sin(theta) * 5,
        pos.y + 1.5,
        pos.z + Math.cos(theta) * 5
      );

      if (gsapRef.current) gsapRef.current.kill();
      isTransitioning.current = true;

      gsapRef.current = gsap.to(camera.position, {
        x: target.x,
        y: target.y,
        z: target.z,
        duration: 2.5,
        ease: 'power2.inOut',
        onUpdate: () => {
          const p = useStore.getState().playerPosition;
          camera.lookAt(p.x, 1, p.z);
        },
        onComplete: () => {
          if (cancelled) return;
          isTransitioning.current = false;
          gsapRef.current = null;
          useStore.getState().setEndIntro();
        },
      });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (gsapRef.current) gsapRef.current.kill();
    };
  }, [camera, isIntro]);

  const prevMode = useRef(cameraMode);

  // Sincronizar transiciones cuando el cameraMode cambia en el store (ya sea por M, HUD o Teleport)
  useEffect(() => {
    console.log(`[CameraRig] useEffect disparado. cameraMode actual: '${cameraMode}', prevMode: '${prevMode.current}'`);
    if (cameraMode === prevMode.current) {
      console.log('[CameraRig] cameraMode no cambió. Ignorando.');
      return;
    }

    console.log(`[CameraRig] Iniciando transición de '${prevMode.current}' a '${cameraMode}'`);
    isTransitioning.current = true;
    setTransitioningCamera(true);
    const pos = playerPosRef.current;

    if (cameraMode === 'overview') {
      console.log('[CameraRig] Configurando modo Overview...');
      // → Overview
      setControlsDisabled(true);

      const mapBounds = useStore.getState().mapBounds;
      const { minX, maxX, minZ, maxZ } = mapBounds;
      const centerX = (minX + maxX) / 2;
      const centerZ = (minZ + maxZ) / 2;
      const width = maxX - minX;
      const depth = maxZ - minZ;
      const radius = Math.max(width, depth) * 0.55;
      const height = radius * 0.45;

      // Sincronizar los ángulos actuales basados en la posición de la cámara para que la transición empiece de forma suave
      const dx = camera.position.x - centerX;
      const dz = camera.position.z - centerZ;
      orbitAngle.current = Math.atan2(dz, dx);
      
      const dy = camera.position.y - height;
      const dist2d = Math.sqrt(dx * dx + dz * dz);
      orbitPitch.current = Math.max(0.1, Math.min(1.2, Math.atan2(dy, dist2d)));

      const target = new THREE.Vector3(
        centerX + Math.cos(orbitAngle.current) * Math.cos(orbitPitch.current) * radius,
        height + Math.sin(orbitPitch.current) * radius,
        centerZ + Math.sin(orbitAngle.current) * Math.cos(orbitPitch.current) * radius
      );

      const startLook = new THREE.Vector3(pos.x, 1, pos.z);
      const endLook = new THREE.Vector3(centerX, 2, centerZ);
      const currentLook = new THREE.Vector3();

      animateCamera(target, (progress) => {
        currentLook.lerpVectors(startLook, endLook, progress);
        camera.lookAt(currentLook);
      }, () => {
        console.log('[CameraRig] Transición a Overview terminada.');
        setTransitioningCamera(false);
      });
    } else {
      console.log('[CameraRig] Configurando modo ThirdPerson...');
      // → ThirdPerson
      const currentPos = useStore.getState().playerPosition;
      const rot = useStore.getState().playerRotation;
      console.log(`  Posición del jugador leída de store: [${currentPos.x.toFixed(2)}, ${currentPos.y.toFixed(2)}, ${currentPos.z.toFixed(2)}]`);
      console.log(`  Rotación del jugador: ${rot.toFixed(2)}`);
      const behind = new THREE.Vector3(
        currentPos.x - Math.sin(rot) * 5,
        currentPos.y + 1.5,
        currentPos.z - Math.cos(rot) * 5,
      );
      console.log(`  Cámara detrás del jugador en: [${behind.x.toFixed(2)}, ${behind.y.toFixed(2)}, ${behind.z.toFixed(2)}]`);

      const mapBounds = useStore.getState().mapBounds;
      const { minX, maxX, minZ, maxZ } = mapBounds;
      const centerX = (minX + maxX) / 2;
      const centerZ = (minZ + maxZ) / 2;

      const startLook = new THREE.Vector3(centerX, 2, centerZ);
      const endLook = new THREE.Vector3(currentPos.x, 1, currentPos.z);
      const currentLook = new THREE.Vector3();

      animateCamera(behind, (progress) => {
        currentLook.lerpVectors(startLook, endLook, progress);
        camera.lookAt(currentLook);
      }, () => {
        console.log('[CameraRig] Transición a ThirdPerson terminada.');
        setControlsDisabled(false);
        setTransitioningCamera(false);
      });
    }

    prevMode.current = cameraMode;
    console.log(`[CameraRig] prevMode actualizado a '${prevMode.current}'`);
  }, [cameraMode, camera, clock, setControlsDisabled, setTransitioningCamera, animateCamera]);

  // Toggle M: solo actualiza el store; la transición reactiva se encarga del resto
  const toggleCamera = useCallback(() => {
    if (isTransitioning.current) return;
    const nextMode = cameraMode === 'thirdPerson' ? 'overview' : 'thirdPerson';
    setCameraMode(nextMode);
  }, [cameraMode, setCameraMode]);

  // Escucha de teclado — toggleCamera ya no se recrea cada frame
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'KeyM') toggleCamera();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCamera]);

  // Registrar listeners para el arrastre 360 de la órbita panorámica (vista águila)
  useEffect(() => {
    if (cameraMode !== 'overview') return;

    const handlePointerDown = (e) => {
      // Solo botón izquierdo del mouse o toques táctiles
      if (e.button !== 0 && e.button !== undefined) return;
      isDragging.current = true;
      lastMousePos.current = { x: e.clientX || (e.touches && e.touches[0].clientX), y: e.clientY || (e.touches && e.touches[0].clientY) };
      lastInteractionTime.current = Date.now();
    };

    const handlePointerMove = (e) => {
      if (!isDragging.current) return;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      if (clientX === undefined || clientY === undefined) return;

      const deltaX = clientX - lastMousePos.current.x;
      const deltaY = clientY - lastMousePos.current.y;
      lastMousePos.current = { x: clientX, y: clientY };

      // Sensibilidad ajustada para una órbita suave
      orbitAngle.current -= deltaX * 0.005;
      // Limitar verticalmente entre 0.1 y 1.2 rad para que no cruce el suelo ni quede 100% cenital
      orbitPitch.current = Math.max(0.1, Math.min(1.2, orbitPitch.current + deltaY * 0.003));
      lastInteractionTime.current = Date.now();
    };

    const handlePointerUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    // Soporte táctil básico
    window.addEventListener('touchstart', handlePointerDown);
    window.addEventListener('touchmove', handlePointerMove);
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [cameraMode]);

  // Limpieza de GSAP al desmontar
  useEffect(() => {
    return () => {
      if (gsapRef.current) gsapRef.current.kill();
    };
  }, []);

  return null;
}
