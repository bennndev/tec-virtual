import { useState } from 'react';
import { Html } from '@react-three/drei';
import useStore from '../../store/useStore';
import styles from './TeleportOverlays.module.css';

export default function TeleportOverlays() {
  const cameraMode = useStore((s) => s.cameraMode);
  const setTeleportTarget = useStore((s) => s.setTeleportTarget);
  const mapMarkers = useStore((s) => s.mapMarkers);

  const [hoveredZone, setHoveredZone] = useState(null);

  if (cameraMode !== 'overview') return null;

  const handleTeleport = (marker, source) => {
    console.log(`[TeleportOverlay] Click detectado en '${marker.name}' (${source})`);
    console.log(`  Posición del marcador: [${marker.x.toFixed(2)}, ${marker.y.toFixed(2)}, ${marker.z.toFixed(2)}]`);
    const targetPos = marker.teleportPos;
    console.log(`  Target de teletransporte enviado: [${targetPos[0].toFixed(2)}, ${targetPos[1].toFixed(2)}, ${targetPos[2].toFixed(2)}]`);
    setTeleportTarget(targetPos);
  };

  return (
    <group>
      {mapMarkers.map((marker) => {
        const isHovered = hoveredZone === marker.id;
        const radius = 3.5; // Radio adecuado para resaltar los stands reales

        return (
          <group key={marker.id}>
            {/* 1. Indicador flotante 3D (Pop-up HTML overlay) */}
            <Html
              position={[marker.x, marker.y + 4.5, marker.z]} // Elevado 4.5 unidades sobre el stand para visibilidad
              center
            >
              <div
                className={`${styles.badge} ${isHovered ? styles.badgeHovered : ''}`}
                onMouseEnter={() => setHoveredZone(marker.id)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleTeleport(marker, 'HTML Badge')}
              >
                <span className={styles.badgeName}>{marker.name}</span>
                <div className={styles.alertBadge}>!</div>
              </div>
            </Html>

            {/* 2. Anillo de resaltado en el suelo (Área de Teletransporte) */}
            <mesh
              position={[marker.x, marker.y - 1.3, marker.z]} // Bajado 1.3 unidades para asentarlo sobre el suelo del stand
              rotation={[-Math.PI / 2, 0, 0]}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredZone(marker.id);
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={(e) => {
                setHoveredZone(null);
                document.body.style.cursor = 'auto';
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleTeleport(marker, '3D Ring Mesh');
                document.body.style.cursor = 'auto';
              }}
            >
              <ringGeometry args={[radius - 0.4, radius, 64]} />
              <meshBasicMaterial
                color={isHovered ? '#00f3ff' : '#0ea5e9'}
                transparent
                opacity={isHovered ? 0.8 : 0.3}
                depthWrite={false}
              />
            </mesh>

            {/* Relleno translúcido del disco de teletransporte */}
            <mesh
              position={[marker.x, marker.y - 1.31, marker.z]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <circleGeometry args={[radius - 0.4, 64]} />
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
