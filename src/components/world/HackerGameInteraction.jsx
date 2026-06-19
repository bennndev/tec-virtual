import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../../store/useStore';

// Posición de la PC de ciberseguridad en el mundo 3D
const PC_POS = new THREE.Vector3(43.83, 22.35, -32.09);
const DETECTION_RADIUS = 4.0;

export default function HackerGameInteraction() {
  const playerPosition = useStore((s) => s.playerPosition);
  const setHackerGameProximity = useStore((s) => s.setHackerGameProximity);
  const wasCloseRef = useRef(false);

  useFrame(() => {
    const dx = playerPosition.x - PC_POS.x;
    const dy = playerPosition.y - PC_POS.y;
    const dz = playerPosition.z - PC_POS.z;
    const isClose = (dx*dx + dy*dy + dz*dz) < DETECTION_RADIUS * DETECTION_RADIUS;
    if (isClose !== wasCloseRef.current) {
      wasCloseRef.current = isClose;
      setHackerGameProximity(isClose);
    }
  });

  return null;
}
