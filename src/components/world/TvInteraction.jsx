import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../../store/useStore';

// Posiciones de los TVs en el mundo 3D
const TV_REDES_POS = new THREE.Vector3(43.39, 25.33, -37.25);
const TV_MARKETING_POS = new THREE.Vector3(38.31, 25.07, -46.13);
const DETECTION_RADIUS = 4.0;

export default function TvInteraction() {
  const playerPosition = useStore((s) => s.playerPosition);
  const setTvRedesProximity = useStore((s) => s.setTvRedesProximity);
  const setTvMarketingProximity = useStore((s) => s.setTvMarketingProximity);

  const wasRedesRef = useRef(false);
  const wasMarketingRef = useRef(false);

  useFrame(() => {
    // TV Redes
    const dRx = playerPosition.x - TV_REDES_POS.x;
    const dRy = playerPosition.y - TV_REDES_POS.y;
    const dRz = playerPosition.z - TV_REDES_POS.z;
    const isRedesClose = (dRx*dRx + dRy*dRy + dRz*dRz) < DETECTION_RADIUS * DETECTION_RADIUS;
    if (isRedesClose !== wasRedesRef.current) {
      wasRedesRef.current = isRedesClose;
      setTvRedesProximity(isRedesClose);
    }

    // TV Marketing
    const dMx = playerPosition.x - TV_MARKETING_POS.x;
    const dMy = playerPosition.y - TV_MARKETING_POS.y;
    const dMz = playerPosition.z - TV_MARKETING_POS.z;
    const isMarketingClose = (dMx*dMx + dMy*dMy + dMz*dMz) < DETECTION_RADIUS * DETECTION_RADIUS;
    if (isMarketingClose !== wasMarketingRef.current) {
      wasMarketingRef.current = isMarketingClose;
      setTvMarketingProximity(isMarketingClose);
    }
  });

  return null;
}
