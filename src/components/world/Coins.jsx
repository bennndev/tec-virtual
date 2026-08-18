import { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import useStore from '../../store/useStore';
import coinsData from '../../data/coins.json';

const COLLECT_DIST = 1.2;

function Coin({ coin, collected }) {
  const { scene } = useGLTF('/models/coin-tec.glb');
  const ref = useRef();

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
  const collectedCoinIds = useStore((s) => s.collectedCoinIds);
  const collectCoin = useStore((s) => s.collectCoin);

  useFrame(() => {
    const { coinPopup, playerPosition } = useStore.getState();
    if (coinPopup) return;
    coinsData.forEach((coin) => {
      if (collectedCoinIds.includes(coin.id)) return;
      const [x, y, z] = coin.position;
      const dx = playerPosition.x - x;
      const dy = playerPosition.y - y;
      const dz = playerPosition.z - z;
      if (dx * dx + dy * dy + dz * dz < COLLECT_DIST * COLLECT_DIST) {
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
        />
      ))}
    </>
  );
}

useGLTF.preload('/models/coin-tec.glb');
