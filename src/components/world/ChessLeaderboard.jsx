import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../../store/useStore';

const CHESS_POS = new THREE.Vector3(-70.00, 20.00, -4.00);
const DETECTION_RADIUS = 2.5;

export default function ChessLeaderboard() {
  const playerPosition = useStore((s) => s.playerPosition);
  const setChessProximity = useStore((s) => s.setChessProximity);
  const wasCloseRef = useRef(false);

  useFrame(() => {
    const dx = playerPosition.x - CHESS_POS.x;
    const dy = playerPosition.y - CHESS_POS.y;
    const dz = playerPosition.z - CHESS_POS.z;
    const isClose = (dx * dx + dy * dy + dz * dz) < DETECTION_RADIUS * DETECTION_RADIUS;
    if (isClose !== wasCloseRef.current) {
      wasCloseRef.current = isClose;
      setChessProximity(isClose);
    }
  });

  return null;
}
