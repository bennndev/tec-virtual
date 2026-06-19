import { useMemo } from 'react';
import useStore from '../../store/useStore';
import { getMarkerIcon } from '../../utils/markerIcons';
import styles from './Minimap.module.css';

export default function Minimap() {
  const playerPosition = useStore((s) => s.playerPosition);
  const playerRotation = useStore((s) => s.playerRotation);
  const mapBounds = useStore((s) => s.mapBounds);
  const mapMarkers = useStore((s) => s.mapMarkers);
  const setHoveredObject = useStore((s) => s.setHoveredObject);
  const setMapModalOpen = useStore((s) => s.setMapModalOpen);
  const isMapModalOpen = useStore((s) => s.isMapModalOpen);
  
  // Navigation State
  const navigationPath = useStore((s) => s.navigationPath);
  const navigationTarget = useStore((s) => s.navigationTarget);
  const isNavigating = useStore((s) => s.isNavigating);
  const clearNavigation = useStore((s) => s.clearNavigation);

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
  const rotationDeg = -(playerRotation * 180) / Math.PI;

  // 1. Zoom dinámico: Se aleja si el destino está lejos, se acerca al aproximarse
  const zoom = useMemo(() => {
    if (!isNavigating || !navigationTarget) return 1.6; // Zoom cómodo estándar

    const dx = navigationTarget.x - playerPosition.x;
    const dz = navigationTarget.z - playerPosition.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    // Si la distancia es > 60m, zoom alejado (1.2) para ver la ruta
    // Si la distancia es < 10m, zoom de precisión (2.6) para ver la llegada
    if (distance > 60) return 1.2;
    if (distance < 10) return 2.6;

    // Interpolación lineal entre 1.2 y 2.6
    const t = (60 - distance) / (60 - 10);
    return 1.2 + t * (2.6 - 1.2);
  }, [isNavigating, navigationTarget, playerPosition.x, playerPosition.z]);

  // 2. ViewBox dinámico centrado en el jugador
  const viewBox = useMemo(() => {
    const size = 100 / zoom;
    let minX = playerPos2D.x - size / 2;
    let minY = playerPos2D.y - size / 2;

    // Clampear límites para que el minimapa no muestre vacío fuera del SVG (0-100)
    minX = Math.max(0, Math.min(100 - size, minX));
    minY = Math.max(0, Math.min(100 - size, minY));

    return `${minX} ${minY} ${size} ${size}`;
  }, [playerPos2D.x, playerPos2D.y, zoom]);

  // Renderizar la polyline SVG para la ruta si hay una activa
  const renderPathLine = () => {
    if (!navigationPath || navigationPath.length < 2) return null;
    const points = [playerPos2D];
    
    for (let i = 1; i < navigationPath.length; i++) {
      points.push(mapCoord(navigationPath[i].x, navigationPath[i].z));
    }

    const pointsString = points.map(p => `${p.x},${p.y}`).join(' ');

    return (
      <polyline
        points={pointsString}
        fill="none"
        stroke="#0ea5e9"
        strokeWidth="1.2"
        strokeDasharray="1.5, 1.5"
        className={styles.pathLine}
      />
    );
  };

  return (
    <div 
      className={styles.minimapContainer} 
      onClick={() => setMapModalOpen(true)}
      style={{ 
        cursor: 'pointer', 
        opacity: isMapModalOpen ? 0 : 1, 
        pointerEvents: isMapModalOpen ? 'none' : 'auto' 
      }}
    >
      <svg viewBox={viewBox} className={styles.minimapSvg}>
        {/* Fondo abstracto (grilla sutil) */}
        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(14, 165, 233, 0.15)" strokeWidth="0.5" />
        </pattern>
        <rect width="100" height="100" fill="url(#grid)" />

        {/* Ruta de Navegación */}
        {renderPathLine()}

        {/* Puntos de interés (POI) */}
        {mapMarkers.map((marker) => {
          const pos = mapCoord(marker.x, marker.z);
          const MarkerIcon = getMarkerIcon(marker.id);
          return (
            <g key={marker.id} transform={`translate(${pos.x}, ${pos.y})`}>
              <g
                className={styles.poiMarker}
                onMouseEnter={() => setHoveredObject({ id: marker.id, name: marker.name, description: 'Ubicado en el campus' })}
                onMouseLeave={() => setHoveredObject(null)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (isNavigating && navigationTarget?.id === marker.id) {
                    clearNavigation();
                  }
                }}
              >
                <MarkerIcon x="-5" y="-5" width="10" height="10" />
              </g>
            </g>
          );
        })}

        {/* Indicador del jugador (triángulo que apunta hacia su rotación) */}
        <g transform={`translate(${playerPos2D.x}, ${playerPos2D.y}) rotate(${rotationDeg})`}>
          <polygon
            points="0,-5 3.5,3.5 0,1.5 -3.5,3.5"
            fill="#0ea5e9"
            className={styles.playerMarker}
          />
        </g>
      </svg>
    </div>
  );
}
