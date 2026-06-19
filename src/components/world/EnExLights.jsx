import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../../store/useStore';
import { ENEX_ZONES } from '../../data/enexZones';

const ENEX_COLOR = '#d8bafc';
const ENEX_COLOR_THREE = new THREE.Color(ENEX_COLOR);

// Global teleport cooldown in milliseconds
const GLOBAL_COOLDOWN_MS = 5000;

// Single cone geometry shared across all markers (created once, never recreated)
// Inverted cone: wider at top, tip pointing down — classic GTA SA marker shape
const coneGeo = new THREE.ConeGeometry(0.55, 1.2, 4);

// ----- Single arrow marker -----
function EnExArrow({ position }) {
  const groupRef = useRef();

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    // Smooth bounce: oscillates 0.3 units vertically over ~1s cycle
    groupRef.current.position.y = position[1] + 1.8 + Math.sin(t * 2.8) * 0.3;
    // Slow spin on Y axis
    groupRef.current.rotation.y = t * 0.9;
  });

  return (
    // Initial Y is set by useFrame immediately; position.y is the base
    <group ref={groupRef} position={[position[0], position[1] + 1.8, position[2]]}>
      {/* Inverted cone — tip faces down like the GTA SA marker */}
      <mesh geometry={coneGeo} rotation={[Math.PI, 0, 0]}>
        <meshBasicMaterial
          color={ENEX_COLOR_THREE}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ----- EnEx detection loop + all markers -----
export default function EnExLights() {
  const lastTeleportAt = useRef(0);

  useFrame(() => {
    const { playerPosition, tpZones, pendingEnex, setPendingEnex } = useStore.getState();

    // Skip if modal is already open or cooldown is active
    if (pendingEnex) return;
    if (Date.now() - lastTeleportAt.current < GLOBAL_COOLDOWN_MS) return;

    const px = playerPosition.x;
    const pz = playerPosition.z;

    for (const zone of ENEX_ZONES) {
      if (!zone.destination) continue;

      const pos = tpZones[zone.id];
      if (!pos) continue;

      const dx = px - pos[0];
      const dz = pz - pos[2];
      const distSq = dx * dx + dz * dz;

      if (distSq < zone.radius * zone.radius) {
        let target;
        if (typeof zone.destination === 'string') {
          const destPos = tpZones[zone.destination];
          if (!destPos) {
            console.warn(`[EnEx] Destination zone "${zone.destination}" not found in GLB. Skipping.`);
            continue;
          }
          target = [destPos[0], destPos[1] + 0.1, destPos[2]];
        } else {
          target = zone.destination;
        }

        console.log(`[EnEx] "${zone.id}" → showing confirmation for "${zone.label}"`);
        // Show modal instead of teleporting directly
        setPendingEnex({ label: zone.label, target });
        lastTeleportAt.current = Date.now();
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
