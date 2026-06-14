import { useMemo } from 'react';
import useStore from '../../store/useStore';
import styles from './Minimap.module.css';

export default function Minimap() {
  const playerPosition = useStore((s) => s.playerPosition);
  const playerRotation = useStore((s) => s.playerRotation);
  const mapBounds = useStore((s) => s.mapBounds);
  const mapMarkers = useStore((s) => s.mapMarkers);
  const setHoveredObject = useStore((s) => s.setHoveredObject);

  // Agregar padding interno para que no corte en los bordes
  const PADDING = 10;
  
  // Utilidad para mapear coordenadas 3D a coordenadas SVG (0-100)
  const mapCoord = useMemo(() => {
    const width = mapBounds.maxX - mapBounds.minX || 1;
    const depth = mapBounds.maxZ - mapBounds.minZ || 1;

    return (x, z) => {
      // Normalizar entre 0 y 1
      const normX = (x - mapBounds.minX) / width;
      const normZ = (z - mapBounds.minZ) / depth;

      // Escalar al rango 0-100 aplicando padding
      const svgX = PADDING + normX * (100 - PADDING * 2);
      const svgZ = PADDING + normZ * (100 - PADDING * 2);
      
      return { x: svgX, y: svgZ };
    };
  }, [mapBounds]);

  const playerPos2D = mapCoord(playerPosition.x, playerPosition.z);

  // El rotationY de Three.js es en radianes. Convertir a grados.
  // Ajuste: Dependiendo de cómo mira la cámara, podrías necesitar sumar un offset (ej. -90)
  const rotationDeg = -(playerRotation * 180) / Math.PI;

  return (
    <div className={styles.minimapContainer}>
      <svg viewBox="0 0 100 100" className={styles.minimapSvg}>
        {/* Fondo abstracto (grilla sutil) */}
        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(14, 165, 233, 0.15)" strokeWidth="0.5" />
        </pattern>
        <rect width="100" height="100" fill="url(#grid)" />

        {/* Puntos de interés (POI) */}
        {mapMarkers.map((marker) => {
          const pos = mapCoord(marker.x, marker.z);
          return (
            <image
              key={marker.id}
              x={pos.x - 4}
              y={pos.y - 4}
              width="8"
              height="8"
              href="/icons/laboratorio-2.svg"
              className={styles.poiMarker}
              onMouseEnter={() => setHoveredObject({ id: marker.id, name: marker.name, description: 'Ubicado en el campus' })}
              onMouseLeave={() => setHoveredObject(null)}
            />
          );
        })}

        {/* Indicador del jugador (triángulo que apunta hacia su rotación) */}
        <g transform={`translate(${playerPos2D.x}, ${playerPos2D.y}) rotate(${rotationDeg})`}>
          <polygon
            points="0,-6 4,4 0,2 -4,4"
            fill="#0ea5e9"
            className={styles.playerMarker}
          />
        </g>
      </svg>
    </div>
  );
}
