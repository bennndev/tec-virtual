import { useRef, useState, useEffect } from 'react';
import { useGLTF, useEnvironment } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import useStore from '../../store/useStore';

const COIN_POSITIONS = [
  [-57.66, 20.04, -8.67],
  [-44.69, 19.93, -14.76],
  [-29.63, 19.93, -28.20],
  [-18.66, 19.93, -38.25],
  [-2.04, 19.93, -50.56],
  [7.77, 19.93, -55.85],
  [13.22, 19.93, -52.42],
  [33.39, 20.00, -41.32],
  [36.46, 20.03, -51.50],
  [35.83, 20.30, -30.21],
  [39.51, 20.03, -41.75],
  [42.30, 20.04, -43.72],
  [43.89, 20.30, -32.99],
];

const COLLECT_DIST = 1.2;

function Coin({ position, collected, envMap }) {
  const { scene } = useGLTF('/models/coin-tec.glb');
  const ref = useRef();
  const meshRef = useRef(null);

  // Clonar una sola vez y aplicar envMap
  if (!meshRef.current) {
    meshRef.current = scene.clone();
    if (envMap) {
      meshRef.current.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.envMap = envMap;
          child.material.envMapIntensity = 1.0;
          child.material.needsUpdate = true;
        }
      });
    }
  }

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 1.5;
    }
  });

  if (collected) return null;

  return (
    <primitive
      ref={ref}
      object={meshRef.current}
      position={position}
      scale={[1, 1, 1]}
    />
  );
}

export default function Coins() {
  const playerPosition = useStore((s) => s.playerPosition);
  const [collected, setCollected] = useState({});
  const envMap = useEnvironment({ preset: 'studio' });

  useFrame(() => {
    COIN_POSITIONS.forEach((pos, i) => {
      if (collected[i]) return;
      const dx = playerPosition.x - pos[0];
      const dy = playerPosition.y - pos[1];
      const dz = playerPosition.z - pos[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < COLLECT_DIST) {
        setCollected((prev) => ({ ...prev, [i]: true }));
        useStore.getState().addCoin();
      }
    });
  });

  return (
    <>
      {COIN_POSITIONS.map((pos, i) => (
        <Coin
          key={i}
          position={pos}
          collected={collected[i]}
          envMap={envMap}
        />
      ))}
    </>
  );
}
