import { useRef, useEffect, useMemo } from 'react';
import { useGLTF, useEnvironment } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import useStore from '../../store/useStore';
import coinsData from '../../data/coins.json';

const COLLECT_DIST = 2.0;
const COIN_SCALE = [2.2, 2.2, 2.2];
const DEFAULT_Y_OFFSET = 0.18;

function resolveCoinPosition(coin, tpZones) {
  if (coin.zoneId) {
    const zone = tpZones?.[coin.zoneId];
    if (!zone) return null;
    const yOffset = coin.yOffset ?? DEFAULT_Y_OFFSET;
    return [zone[0], zone[1] + yOffset, zone[2]];
  }
  return coin.position ?? null;
}

function Coin({ coin, position, collected, envMap }) {
  const { scene } = useGLTF('/models/coin-tec.glb');
  const model = useMemo(() => scene.clone(true), [scene]);
  const ref = useRef();

  useEffect(() => {
    if (!envMap) return;
    model.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.envMap = envMap;
        child.material.envMapIntensity = 1.0;
        child.material.needsUpdate = true;
      }
    });
  }, [model, envMap]);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 1.5;
    }
  });

  if (collected || !position) return null;

  return (
    <group ref={ref} position={position} scale={COIN_SCALE}>
      <primitive object={model} />
    </group>
  );
}

export default function Coins() {
  const collectedCoinIds = useStore((s) => s.collectedCoinIds);
  const collectCoin = useStore((s) => s.collectCoin);
  const tpZones = useStore((s) => s.tpZones);
  const envMap = useEnvironment({ preset: 'studio' });

  useFrame(() => {
    const { coinPopup, playerPosition } = useStore.getState();
    if (coinPopup) return;
    coinsData.forEach((coin) => {
      if (collectedCoinIds.includes(coin.id)) return;
      const pos = resolveCoinPosition(coin, tpZones);
      if (!pos) return;
      const [x, y, z] = pos;
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
          position={resolveCoinPosition(coin, tpZones)}
          collected={collectedCoinIds.includes(coin.id)}
          envMap={envMap}
        />
      ))}
    </>
  );
}

useGLTF.preload('/models/coin-tec.glb');
