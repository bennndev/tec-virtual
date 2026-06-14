import { useEffect, useRef, useMemo, useState } from 'react';
import gsap from 'gsap';
import useStore from '../../store/useStore';
import ClayButton from './ClayButton';
import styles from './FullMapModal.module.css';
import { pathfinder } from '../../services/pathfinding';

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
  // Hardcoded areas provistas por el usuario
  { id: 'CarrerasAdmision', label: 'Carreras y Admisión', Icon: Laboratorio1Icon, x: 96.92, y: 2.37, z: -114.39 },
  { id: 'Empresas', label: 'Empresas Participantes', Icon: EstacionamientoIcon, x: 103.98, y: 2.26, z: -107.10 },
  { id: 'stand01', label: 'Stand Principal', Icon: Laboratorio2Icon, x: 101.84, y: 2.57, z: -116.95 },
  // Resto de la leyenda
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
  
  const playerPosition = useStore((s) => s.playerPosition);
  const playerRotation = useStore((s) => s.playerRotation);
  const mapBounds = useStore((s) => s.mapBounds);
  const mapMarkers = useStore((s) => s.mapMarkers);
  const setHoveredObject = useStore((s) => s.setHoveredObject);
  
  // Navigation State
  const navigationTarget = useStore((s) => s.navigationTarget);
  const setNavigationTarget = useStore((s) => s.setNavigationTarget);
  const clearNavigation = useStore((s) => s.clearNavigation);
  const navigationPath = useStore((s) => s.navigationPath);

  // Zoom & Pan State para el mapa expandido (estilo GTA V)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const overlayRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isMapModalOpen) {
      // Resetear zoom al abrir
      setZoom(1);
      setPan({ x: 0, y: 0 });

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

  const startNavigation = (target) => {
    if (target.x !== undefined && target.z !== undefined) {
      // Si ya estábamos navegando a este mismo lugar, lo desactivamos (Toggle)
      if (navigationTarget && navigationTarget.id === target.id) {
        clearNavigation();
        return;
      }

      const path = pathfinder.calculatePath(playerPosition, target);
      setNavigationTarget({ id: target.id, name: target.label || target.name, x: target.x, y: target.y || 0, z: target.z }, path);
    } else {
      console.warn('Esta área no tiene coordenadas asignadas todavía.');
    }
  };

  // Manejadores de eventos de zoom y arrastre (Pan)
  const handleWheel = (e) => {
    const zoomFactor = 0.25;
    let newZoom = zoom + (e.deltaY < 0 ? zoomFactor : -zoomFactor);
    newZoom = Math.max(1, Math.min(4, newZoom)); // Clampeado de 1x a 4x de zoom
    
    if (newZoom === 1) {
      setPan({ x: 0, y: 0 });
    }
    setZoom(newZoom);
  };

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || zoom <= 1) return;
    
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    
    // El SVG mide 100 en su escala nativa. Ajustamos el factor de arrastre segun el zoom
    const svgSize = 100 / zoom;
    const dragScale = svgSize / 400; // Asumiendo un viewport de ~400px de alto/ancho
    
    setPan(prev => {
      let newX = prev.x - dx * dragScale;
      let newY = prev.y - dy * dragScale;
      
      // Clampear pan para no salirse de los límites del mapa
      const limit = (100 - svgSize) / 2;
      newX = Math.max(-limit, Math.min(limit, newX));
      newY = Math.max(-limit, Math.min(limit, newY));
      
      return { x: newX, y: newY };
    });
    
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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

  // ViewBox dinámico aplicando el zoom y el pan actual
  const viewBox = useMemo(() => {
    const size = 100 / zoom;
    const centerX = 50 + pan.x;
    const centerY = 50 + pan.y;
    
    let minX = centerX - size / 2;
    let minY = centerY - size / 2;
    
    // Clampear límites del viewBox de 0 a 100
    minX = Math.max(0, Math.min(100 - size, minX));
    minY = Math.max(0, Math.min(100 - size, minY));
    
    return `${minX} ${minY} ${size} ${size}`;
  }, [zoom, pan]);

  if (!isMapModalOpen) return null;

  const playerPos2D = mapCoord(playerPosition.x, playerPosition.z);
  const rotationDeg = -(playerRotation * 180) / Math.PI;

  // Renderizar la polyline SVG para la ruta si hay una activa
  const renderPathLine = () => {
    if (!navigationPath || navigationPath.length < 2) return null;
    // Agregar la posición actual del jugador al inicio de la línea para que sea dinámica
    const points = [playerPos2D];
    
    // Convertir waypoints 3D a coordenadas 2D del SVG
    for (let i = 1; i < navigationPath.length; i++) {
      points.push(mapCoord(navigationPath[i].x, navigationPath[i].z));
    }

    const pointsString = points.map(p => `${p.x},${p.y}`).join(' ');

    return (
      <polyline
        points={pointsString}
        fill="none"
        stroke="#0ea5e9"
        strokeWidth="1.5"
        strokeDasharray="2, 2"
        className={styles.pathLine}
      />
    );
  };

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
          {LEGEND_ITEMS.map((item) => (
            <ClayButton 
              key={item.id} 
              variant="translucent" 
              className={styles.legendItemButton}
              onClick={() => startNavigation(item)}
            >
              <div className={styles.legendIcon}>
                <item.Icon />
              </div>
              <span className={styles.legendLabel}>{item.label}</span>
            </ClayButton>
          ))}
        </div>

        {/* Panel Derecho: Mapa Expandido */}
        <div 
          className={styles.mapPanel}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'crosshair' }}
        >
          <svg viewBox={viewBox} className={styles.minimapSvg}>
            <pattern id="gridLarge" width="5" height="5" patternUnits="userSpaceOnUse">
              <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(14, 165, 233, 0.2)" strokeWidth="0.2" />
            </pattern>
            <rect width="100" height="100" fill="url(#gridLarge)" />

            {/* Dibujar ruta actual */}
            {renderPathLine()}

            {/* Marcadores de POI */}
            {mapMarkers.map((marker) => {
              const pos = mapCoord(marker.x, marker.z);
              return (
                <g 
                  key={marker.id} 
                  transform={`translate(${pos.x}, ${pos.y}) scale(${1 / zoom})`}
                  onClick={() => startNavigation(marker)}
                >
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
            <g transform={`translate(${playerPos2D.x}, ${playerPos2D.y}) rotate(${rotationDeg}) scale(${1 / zoom})`}>
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
