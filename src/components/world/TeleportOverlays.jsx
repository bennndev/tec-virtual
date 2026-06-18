import { useState } from 'react';
import { Html } from '@react-three/drei';
import useStore from '../../store/useStore';
import TELEPORT_ZONES from '../../data/teleportZones';
import styles from './TeleportOverlays.module.css';

export default function TeleportOverlays() {
  const cameraMode = useStore((s) => s.cameraMode);
  const setCameraMode = useStore((s) => s.setCameraMode);
  const setTeleportTarget = useStore((s) => s.setTeleportTarget);

  const [hoveredZone, setHoveredZone] = useState(null);

  if (cameraMode !== 'overview') return null;

  const handleTeleport = (zone) => {
    // Establecer el destino de teletransporte. El RigidBody en Player.jsx
    // detectará esto, se moverá y cambiará el modo de cámara automáticamente.
    setTeleportTarget(zone.position);
  };

  return (
    <group>
      {TELEPORT_ZONES.map((zone) => {
        const isHovered = hoveredZone === zone.id;

        return (
          <group key={zone.id}>
            {/* 1. Indicador flotante 3D (Pop-up HTML overlay) */}
            <Html
              position={[
                zone.position[0] + zone.labelOffset[0],
                zone.position[1] + zone.labelOffset[1],
                zone.position[2] + zone.labelOffset[2]
              ]}
              center
            >
              <div
                className={`${styles.badge} ${isHovered ? styles.badgeHovered : ''}`}
                onMouseEnter={() => setHoveredZone(zone.id)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleTeleport(zone)}
              >
                <span className={styles.badgeName}>{zone.name}</span>
                <div className={styles.alertBadge}>!</div>
              </div>
            </Html>

            {/* 2. Anillo de resaltado en el suelo (Cánovas de Teletransporte) */}
            <mesh
              position={[zone.position[0], zone.position[1] - 1.5, zone.position[2]]}
              rotation={[-Math.PI / 2, 0, 0]}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredZone(zone.id);
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={(e) => {
                setHoveredZone(null);
                document.body.style.cursor = 'auto';
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleTeleport(zone);
                document.body.style.cursor = 'auto';
              }}
            >
              <ringGeometry args={[zone.radius - 0.4, zone.radius, 64]} />
              <meshBasicMaterial
                color={isHovered ? '#00f3ff' : '#0ea5e9'}
                transparent
                opacity={isHovered ? 0.8 : 0.3}
                depthWrite={false}
              />
            </mesh>

            {/* Relleno translúcido del disco de teletransporte */}
            <mesh
              position={[zone.position[0], zone.position[1] - 1.51, zone.position[2]]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <circleGeometry args={[zone.radius - 0.4, 64]} />
              <meshBasicMaterial
                color={isHovered ? '#00f3ff' : '#0ea5e9'}
                transparent
                opacity={isHovered ? 0.25 : 0.05}
                depthWrite={false}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
