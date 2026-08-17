import { useRef, useEffect } from 'react';
import { useGLTF, useEnvironment } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import useStore from '../../store/useStore';
import coinsData from '../../data/coins.json';

const COLLECT_DIST = 1.2;

function Coin({ coin, collected, envMap }) {
  const { scene } = useGLTF('/models/coin-tec.glb');
  const ref = useRef();

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
      position={coin.position}
      scale={[1, 1, 1]}
    />
  );
}

export default function Coins() {
  const playerPosition = useStore((s) => s.playerPosition);
  const collectedCoinIds = useStore((s) => s.collectedCoinIds);
  const coinPopup = useStore((s) => s.coinPopup);
  const collectCoin = useStore((s) => s.collectCoin);
  const envMap = useEnvironment({ preset: 'studio' });

  useFrame(() => {
    if (coinPopup) return;
    coinsData.forEach((coin) => {
      if (collectedCoinIds.includes(coin.id)) return;
      const [x, y, z] = coin.position;
      const dx = playerPosition.x - x;
      const dy = playerPosition.y - y;
      const dz = playerPosition.z - z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < COLLECT_DIST) {
        collectCoin(coin);
      }
    });
  });

  return (
    <>
      {coinsData.map((coin) => (
        <Coin
          key={coin.id}
          coin={coin}
          collected={collectedCoinIds.includes(coin.id)}
          envMap={envMap}
        />
      ))}
    </>
  );
}

useGLTF.preload('/models/coin-tec.glb');
