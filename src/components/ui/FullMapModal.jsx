import { useEffect, useRef, useMemo, useState } from 'react';
import gsap from 'gsap';
import useStore from '../../store/useStore';
import ClayButton from './ClayButton';
import styles from './FullMapModal.module.css';
import { pathfinder } from '../../services/pathfinding';

import objectsData from '../../data/objects.json';
import { getMarkerIcon } from '../../utils/markerIcons';

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
  const isNavigating = useStore((s) => s.isNavigating);
  const clearNavigation = useStore((s) => s.clearNavigation);
  const navigationPath = useStore((s) => s.navigationPath);
  const setNavigationTarget = useStore((s) => s.setNavigationTarget);

  // Lista dinámica ordenada alfabéticamente para la leyenda
  const sortedMarkers = useMemo(() => {
    return [...mapMarkers].sort((a, b) => a.name.localeCompare(b.name));
  }, [mapMarkers]);

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

  const handleZoneClick = (marker) => {
    if (!marker.teleportPos) {
      console.warn('Esta área no tiene coordenadas asignadas para la ruta.');
      return;
    }

    // Toggle: si ya es el destino activo, lo desmarca
    if (isNavigating && navigationTarget?.id === marker.id) {
      clearNavigation();
      return;
    }

    // Si no, marca la ruta hacia este destino
    const targetPos = { x: marker.x, y: marker.y || 0, z: marker.z };
    const path = pathfinder.calculatePath(playerPosition, targetPos);
    setNavigationTarget({ id: marker.id, name: marker.name, ...targetPos }, path);
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

  // Touch support para arrastre en móviles
  const handleTouchStart = (e) => {
    if (zoom > 1 && e.touches.length === 1) {
      setIsDragging(true);
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || zoom <= 1 || e.touches.length !== 1) return;

    const dx = e.touches[0].clientX - dragStart.current.x;
    const dy = e.touches[0].clientY - dragStart.current.y;

    const svgSize = 100 / zoom;
    const dragScale = svgSize / 400;

    setPan(prev => {
      let newX = prev.x - dx * dragScale;
      let newY = prev.y - dy * dragScale;
      const limit = (100 - svgSize) / 2;
      newX = Math.max(-limit, Math.min(limit, newX));
      newY = Math.max(-limit, Math.min(limit, newY));
      return { x: newX, y: newY };
    });

    dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = () => {
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
        <ClayButton className={styles.closeButton} onClick={handleClose}>
          ✕
        </ClayButton>

        {/* Panel Izquierdo: Leyenda */}
        <div className={styles.legendPanel}>
          <h2 className={styles.legendTitle}>Leyenda del Mapa</h2>
          {sortedMarkers.map((marker) => {
            const IconComponent = getMarkerIcon(marker.id);
            return (
              <ClayButton 
                key={marker.id} 
                variant="translucent" 
                className={styles.legendItemButton}
                onClick={() => handleZoneClick(marker)}
              >
                <div className={styles.legendIcon}>
                  <IconComponent />
                </div>
                <span className={styles.legendLabel}>{marker.name}</span>
              </ClayButton>
            );
          })}
        </div>

        {/* Panel Derecho: Mapa Expandido */}
        <div 
          className={styles.mapPanel}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
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
              const MarkerIcon = getMarkerIcon(marker.id);
              const desc = objectsData[marker.id]?.description || 'Zona representativa del campus';
              return (
                <g 
                  key={marker.id} 
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => handleZoneClick(marker)}
                >
                  <g
                    className={styles.poiMarker}
                    onMouseEnter={() => setHoveredObject({ id: marker.id, name: marker.name, description: desc })}
                    onMouseLeave={() => setHoveredObject(null)}
                  >
                    <MarkerIcon x="-7" y="-7" width="14" height="14" />
                  </g>
                </g>
              );
            })}

            {/* Indicador del Jugador */}
            <g transform={`translate(${playerPos2D.x}, ${playerPos2D.y}) rotate(${rotationDeg})`}>
              <polygon
                points="0,-3.5 2.5,2.5 0,0.8 -2.5,2.5"
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
