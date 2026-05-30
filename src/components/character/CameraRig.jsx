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
  const playerPosition = useStore((s) => s.playerPosition);

  const isTransitioning = useRef(false);
  const gsapRef = useRef(null);

  // En overview, la cámara sigue al jugador con ángulo fijo
  useFrame(() => {
    if (cameraMode !== 'overview' || isTransitioning.current) return;

    const targetPos = new THREE.Vector3(
      playerPosition.x + OVERVIEW_OFFSET.x,
      playerPosition.y + OVERVIEW_OFFSET.y,
      playerPosition.z + OVERVIEW_OFFSET.z,
    );

    camera.position.lerp(targetPos, 0.08);
    camera.lookAt(playerPosition.x, 1, playerPosition.z);
  });

  // Animación con GSAP para transiciones entre modos
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

  // Tecla M: toggle thirdPerson ↔ overview
  const toggleCamera = useCallback(() => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;

    if (cameraMode === 'thirdPerson') {
      // → Overview: ecctrl suelta, GSAP anima a vista aérea
      setCameraMode('overview');

      const target = new THREE.Vector3(
        playerPosition.x + OVERVIEW_OFFSET.x,
        playerPosition.y + OVERVIEW_OFFSET.y,
        playerPosition.z + OVERVIEW_OFFSET.z,
      );

      animateCamera(target, () => {
        camera.lookAt(playerPosition.x, 1, playerPosition.z);
      });
    } else {
      // → ThirdPerson: GSAP vuelve detrás del jugador, ecctrl retoma
      const behind = new THREE.Vector3(
        playerPosition.x,
        playerPosition.y + 1.5,
        playerPosition.z + 4,
      );

      animateCamera(behind, () => {
        camera.lookAt(playerPosition.x, 1, playerPosition.z);
      }, () => {
        setCameraMode('thirdPerson');
      });
    }
  }, [cameraMode, camera, playerPosition, setCameraMode, animateCamera]);

  // Escucha de teclado
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
