import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../../store/useStore';
import { isMovementLocked } from '../../store/overlayLock';
import { ENEX_ZONES } from '../../data/enexZones';
import { STANDING_ZONE_IDS } from '../../data/zonePositions';

const ENEX_COLOR = '#d8bafc';
const ENEX_COLOR_THREE = new THREE.Color(ENEX_COLOR);

const DETECTION_RADIUS = 0.9;

const coneGeo = new THREE.ConeGeometry(0.55, 1.2, 4);

// ----- Single arrow marker -----
function EnExArrow({ position }) {
  const groupRef = useRef();

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y = position[1] + 1.8 + Math.sin(t * 2.8) * 0.3;
    groupRef.current.rotation.y = t * 0.9;
  });

  return (
    <group ref={groupRef} position={[position[0], position[1] + 1.8, position[2]]}>
      <mesh geometry={coneGeo} rotation={[Math.PI, 0, 0]}>
        <meshBasicMaterial color={ENEX_COLOR_THREE} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ----- EnEx detection loop + all markers -----
export default function EnExLights() {
  useFrame(() => {
    const state = useStore.getState();
    const { enexBlockedUntil, pendingEnex, playerPosition, tpZones } = state;

    // Single fast-path check — covers both cooldown and open modal
    if (Date.now() < enexBlockedUntil) return;
    if (pendingEnex) return;
    // No abrir EnEx encima de otro overlay (moneda, video, minijuegos, diálogo)
    if (isMovementLocked(state)) return;

    const px = playerPosition.x;
    const pz = playerPosition.z;

    for (const zone of ENEX_ZONES) {
      if (!zone.destination) continue;

      const pos = tpZones[zone.id];
      if (!pos) continue;

      const dx = px - pos[0];
      const dz = pz - pos[2];

      if (dx * dx + dz * dz < DETECTION_RADIUS * DETECTION_RADIUS) {
        let target;
        if (typeof zone.destination === 'string') {
          const destPos = tpZones[zone.destination];
          if (!destPos) {
            console.warn(`[EnEx] Destination "${zone.destination}" not in GLB. Skipping.`);
            continue;
          }
          const yLift = STANDING_ZONE_IDS.has(zone.destination) ? 0 : 1.5;
          target = [destPos[0], destPos[1] + yLift, destPos[2]];
        } else {
          target = zone.destination;
        }

        // One atomic write: open modal + start cooldown simultaneously.
        // When the next useFrame runs, BOTH pendingEnex and enexBlockedUntil
        // are already set — there is no frame where detection can slip through.
        useStore.setState({
          pendingEnex: { label: zone.label, target },
          enexBlockedUntil: Date.now() + 5000,
          controlsDisabled: true,
        });
        console.log(`[EnEx] "${zone.id}" → confirmation queued`);
        break;
      }
    }
  });

  const tpZones = useStore((s) => s.tpZones);

  return (
    <group>
      {ENEX_ZONES.map((zone) => {
        const pos = tpZones[zone.id];
        if (!pos) return null;
        return <EnExArrow key={zone.id} position={pos} />;
      })}
    </group>
  );
}

