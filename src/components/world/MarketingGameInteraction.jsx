import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../../store/useStore';

// Posición de la PC de marketing en el mundo 3D
const PC_POS = new THREE.Vector3(38.00, 20.03, -50.00);
const DETECTION_RADIUS = 2.5;

export default function MarketingGameInteraction() {
  const setMarketingGameProximity = useStore((s) => s.setMarketingGameProximity);
  const wasCloseRef = useRef(false);

  useFrame(() => {
    const { playerPosition } = useStore.getState();
    const dx = playerPosition.x - PC_POS.x;
    const dy = playerPosition.y - PC_POS.y;
    const dz = playerPosition.z - PC_POS.z;
    const isClose = (dx * dx + dy * dy + dz * dz) < DETECTION_RADIUS * DETECTION_RADIUS;
    if (isClose !== wasCloseRef.current) {
      wasCloseRef.current = isClose;
      setMarketingGameProximity(isClose);
    }
  });

  return null;
}
