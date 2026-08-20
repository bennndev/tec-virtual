import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import useStore from '../../store/useStore';
import billboardsData from '../../data/billboards.json';

function resolveBillboardPosition(ad, tpZones) {
  if (ad.zoneId) {
    const zone = tpZones?.[ad.zoneId];
    if (!zone) return null;
    const [ox, oy, oz] = ad.offset || [0, 0, 0];
    return [zone[0] + ox, zone[1] + oy, zone[2] + oz];
  }
  return ad.position ?? null;
}

function BillboardSign({ ad, position }) {
  const texture = useTexture(ad.src);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;

  if (!position) return null;

  return (
    <mesh position={position} rotation={[0, ad.rotationY ?? 0, 0]}>
      <planeGeometry args={[ad.width, ad.height]} />
      <meshBasicMaterial
        map={texture}
        transparent
        toneMapped={false}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

export default function Billboards() {
  const tpZones = useStore((s) => s.tpZones);

  return (
    <>
      {billboardsData.map((ad) => (
        <BillboardSign
          key={ad.id}
          ad={ad}
          position={resolveBillboardPosition(ad, tpZones)}
        />
      ))}
    </>
  );
}

billboardsData.forEach((ad) => {
  useTexture.preload(ad.src);
});
