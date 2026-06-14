import { useEffect, useRef, useMemo } from 'react';
import gsap from 'gsap';
import useStore from '../../store/useStore';
import ClayButton from './ClayButton';
import styles from './FullMapModal.module.css';

// Importar SVG como componentes de React
import AlmacenIcon from '../../assets/icons/almacen.svg?react';
import AuditorioAIcon from '../../assets/icons/auditorio-a.svg?react';
import AuditorioBIcon from '../../assets/icons/auditorio-b.svg?react';
import BibliotecaIcon from '../../assets/icons/biblioteca.svg?react';
import BicicletasIcon from '../../assets/icons/bicicletas.svg?react';
import CafeteriaIcon from '../../assets/icons/cafeteria.svg?react';
import EnfermeriaIcon from '../../assets/icons/enfermeria.svg?react';
import EstacionamientoIcon from '../../assets/icons/estacionamiento.svg?react';
import Laboratorio1Icon from '../../assets/icons/laboratorio-1.svg?react';
import Laboratorio2Icon from '../../assets/icons/laboratorio-2.svg?react';
import LockersIcon from '../../assets/icons/lockers.svg?react';

// Lista estática de íconos que el usuario subió
const LEGEND_ITEMS = [
  { id: 'almacen', label: 'Almacén', Icon: AlmacenIcon },
  { id: 'auditorio-a', label: 'Auditorio A', Icon: AuditorioAIcon },
  { id: 'auditorio-b', label: 'Auditorio B', Icon: AuditorioBIcon },
  { id: 'biblioteca', label: 'Biblioteca', Icon: BibliotecaIcon },
  { id: 'bicicletas', label: 'Bicicletas', Icon: BicicletasIcon },
  { id: 'cafeteria', label: 'Cafetería', Icon: CafeteriaIcon },
  { id: 'enfermeria', label: 'Enfermería', Icon: EnfermeriaIcon },
  { id: 'estacionamiento', label: 'Estacionamiento', Icon: EstacionamientoIcon },
  { id: 'laboratorio-1', label: 'Laboratorio 1', Icon: Laboratorio1Icon },
  { id: 'laboratorio-2', label: 'Laboratorio 2', Icon: Laboratorio2Icon },
  { id: 'lockers', label: 'Lockers', Icon: LockersIcon },
];

export default function FullMapModal() {
  const isMapModalOpen = useStore((s) => s.isMapModalOpen);
  const setMapModalOpen = useStore((s) => s.setMapModalOpen);
  
  // Reutilizamos el estado del mapa
  const playerPosition = useStore((s) => s.playerPosition);
  const playerRotation = useStore((s) => s.playerRotation);
  const mapBounds = useStore((s) => s.mapBounds);
  const mapMarkers = useStore((s) => s.mapMarkers);
  const setHoveredObject = useStore((s) => s.setHoveredObject);

  const overlayRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isMapModalOpen) {
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
      gsap.fromTo(
        modalRef.current,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' }
      );
    }
  }, [isMapModalOpen]);

  const handleClose = () => {
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.2 });
    gsap.to(modalRef.current, { 
      scale: 0.8, 
      opacity: 0, 
      duration: 0.2, 
      onComplete: () => setMapModalOpen(false) 
    });
  };

  const PADDING = 10;
  
  const mapCoord = useMemo(() => {
    const width = mapBounds.maxX - mapBounds.minX || 1;
    const depth = mapBounds.maxZ - mapBounds.minZ || 1;

    return (x, z) => {
      const normX = (x - mapBounds.minX) / width;
      const normZ = (z - mapBounds.minZ) / depth;
      const svgX = PADDING + normX * (100 - PADDING * 2);
      const svgZ = PADDING + normZ * (100 - PADDING * 2);
      return { x: svgX, y: svgZ };
    };
  }, [mapBounds]);

  if (!isMapModalOpen) return null;

  const playerPos2D = mapCoord(playerPosition.x, playerPosition.z);
  const rotationDeg = -(playerRotation * 180) / Math.PI;

  return (
    <div className={styles.overlay} ref={overlayRef}>
      <div className={styles.modal} ref={modalRef}>
        
        {/* Botón de cerrar */}
        <button className={styles.closeButton} onClick={handleClose}>
          ✕
        </button>

        {/* Panel Izquierdo: Leyenda */}
        <div className={styles.legendPanel}>
          <h2 className={styles.legendTitle}>Leyenda del Mapa</h2>
          {LEGEND_ITEMS.map(({ id, label, Icon }) => (
            <ClayButton key={id} variant="translucent" className={styles.legendItemButton}>
              <div className={styles.legendIcon}>
                <Icon />
              </div>
              <span className={styles.legendLabel}>{label}</span>
            </ClayButton>
          ))}
        </div>

        {/* Panel Derecho: Mapa Expandido */}
        <div className={styles.mapPanel}>
          <svg viewBox="0 0 100 100" className={styles.minimapSvg}>
            <pattern id="gridLarge" width="5" height="5" patternUnits="userSpaceOnUse">
              <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(14, 165, 233, 0.2)" strokeWidth="0.2" />
            </pattern>
            <rect width="100" height="100" fill="url(#gridLarge)" />

            {/* Marcadores de POI */}
            {mapMarkers.map((marker) => {
              const pos = mapCoord(marker.x, marker.z);
              return (
                <g key={marker.id} transform={`translate(${pos.x}, ${pos.y})`}>
                  <g
                    className={styles.poiMarker}
                    onMouseEnter={() => setHoveredObject({ id: marker.id, name: marker.name, description: 'Ubicado en el campus' })}
                    onMouseLeave={() => setHoveredObject(null)}
                  >
                    <Laboratorio2Icon x="-3" y="-3" width="6" height="6" />
                  </g>
                </g>
              );
            })}

            {/* Indicador del Jugador */}
            <g transform={`translate(${playerPos2D.x}, ${playerPos2D.y}) rotate(${rotationDeg})`}>
              <polygon
                points="0,-4 3,3 0,1 -3,3"
                fill="#0ea5e9"
                className={styles.playerMarker}
              />
            </g>
          </svg>
        </div>

      </div>
    </div>
  );
}
