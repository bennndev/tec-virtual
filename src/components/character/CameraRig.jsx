import { useEffect, useRef, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import useStore from '../../store/useStore';

const OVERVIEW_OFFSET = new THREE.Vector3(0, 12, -8);

export default function CameraRig() {
  const { camera } = useThree();
  const cameraMode = useStore((s) => s.cameraMode);
  const setCameraMode = useStore((s) => s.setCameraMode);

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
      const behind = new THREE.Vector3(
        pos.x,
        pos.y + 1.5,
        pos.z + 4,
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
