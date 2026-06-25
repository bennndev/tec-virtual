import { useRef, useState, useEffect } from 'react';
import { useGLTF, useEnvironment } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import useStore from '../../store/useStore';

const COIN_POSITIONS = [
  [33.39, 20.00, -41.32],
  [39.51, 20.03, -41.75],
  [42.30, 20.04, -43.72],
];

const COLLECT_DIST = 1.2;

function Coin({ position, collected, envMap }) {
  const { scene } = useGLTF('/models/coin-tec.glb');
  const ref = useRef();
  const clonedRef = useRef(null);

  useEffect(() => {
    if (!envMap) return;
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.envMap = envMap;
        child.material.envMapIntensity = 1.0;
        child.material.needsUpdate = true;
      }
    });
  }, [scene, envMap]);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 1.5;
    }
  });

  if (collected) return null;

  return (
    <primitive
      ref={ref}
      object={scene.clone()}
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
