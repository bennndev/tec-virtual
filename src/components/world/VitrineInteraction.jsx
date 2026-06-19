import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../../store/useStore';

// Posición de la vitrina de servidores en el mundo 3D (extraída del GLB)
const VITRINE_POS = new THREE.Vector3(35.73, 19.6, -30.86);
const DETECTION_RADIUS = 1.0; // unidades — cuán cerca hay que estar

export default function VitrineInteraction() {
  const playerPosition = useStore((s) => s.playerPosition);
  const setVitrineProximity = useStore((s) => s.setVitrineProximity);
  const wasCloseRef = useRef(false);

  useFrame(() => {
    const dx = playerPosition.x - VITRINE_POS.x;
    const dy = playerPosition.y - VITRINE_POS.y;
    const dz = playerPosition.z - VITRINE_POS.z;
    const distSq = dx * dx + dy * dy + dz * dz;
    const isClose = distSq < DETECTION_RADIUS * DETECTION_RADIUS;
    // Solo actualizar el store cuando cambia el estado para evitar re-renders innecesarios
    if (isClose !== wasCloseRef.current) {
      wasCloseRef.current = isClose;
      setVitrineProximity(isClose);
    }
  });

  return null; // no renderiza nada, solo lógica
}
