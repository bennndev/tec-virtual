import { useEffect, useRef, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import useStore from '../../store/useStore';
import { CHARACTER_INIT_DIR } from '../../data/characterConfig';

const OVERVIEW_OFFSET = new THREE.Vector3(0, 12, -8);


export default function CameraRig() {
  const { camera } = useThree();
  const cameraMode = useStore((s) => s.cameraMode);
  const setCameraMode = useStore((s) => s.setCameraMode);

  const isIntro = useStore((s) => s.isIntro);
  const isTransitioning = useRef(false);
  const gsapRef = useRef(null);

  // Ref en vez de Zustand subscription: evita 60 re-renders/s
  const playerPosRef = useRef({ x: 0, y: 0, z: 0 });

  // Vectores reutilizables para no alocar en cada frame
  const tmpVec = useRef(new THREE.Vector3());
  const tmpTarget = useRef(new THREE.Vector3());
  const tmpQuat = useRef(new THREE.Quaternion());
  const tmpMatrix = useRef(new THREE.Matrix4());

  // Overview: seguimiento continuo del jugador
  useFrame((_state, delta) => {
    // Leer última posición SIN subscription (no causa re-render)
    const pos = useStore.getState().playerPosition;
    playerPosRef.current = pos;

    if (cameraMode !== 'overview' || isTransitioning.current) return;

    const targetPos = tmpTarget.current.set(
      pos.x + OVERVIEW_OFFSET.x,
      pos.y + OVERVIEW_OFFSET.y,
      pos.z + OVERVIEW_OFFSET.z,
    );

    // Frame-rate independent lerp (ecctrl usa esta misma fórmula)
    const smoothFactor = 1 - Math.exp(-10 * delta);
    camera.position.lerp(targetPos, smoothFactor);

    // Quaternion slerp para lookAt estable (evita micro-oscilaciones)
    const lookTarget = tmpVec.current.set(pos.x, 1, pos.z);
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
      duration: 0.8,
      ease: 'power2.inOut',
      onUpdate: lookAtFn,
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
    camera.position.set(0, 12, -8);
    camera.lookAt(0, 0, 0);

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

  // Toggle M: usa ref en vez de playerPosition del store
  const toggleCamera = useCallback(() => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;

    const pos = playerPosRef.current;

    if (cameraMode === 'thirdPerson') {
      // → Overview
      setCameraMode('overview');

      const target = new THREE.Vector3(
        pos.x + OVERVIEW_OFFSET.x,
        pos.y + OVERVIEW_OFFSET.y,
        pos.z + OVERVIEW_OFFSET.z,
      );

      animateCamera(target, () => {
        camera.lookAt(pos.x, 1, pos.z);
      });
    } else {
      // → ThirdPerson
      const rot = useStore.getState().playerRotation;
      const behind = new THREE.Vector3(
        pos.x - Math.sin(rot) * 5,
        pos.y + 1.5,
        pos.z - Math.cos(rot) * 5,
      );

      animateCamera(behind, () => {
        camera.lookAt(pos.x, 1, pos.z);
      }, () => {
        setCameraMode('thirdPerson');
      });
    }
  }, [cameraMode, camera, setCameraMode, animateCamera]);

  // Escucha de teclado — toggleCamera ya no se recrea cada frame
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'KeyM') toggleCamera();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCamera]);

  // Limpieza de GSAP al desmontar
  useEffect(() => {
    return () => {
      if (gsapRef.current) gsapRef.current.kill();
    };
  }, []);

  return null;
}
