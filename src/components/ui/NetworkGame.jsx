import React, { useState, useEffect, useRef, useCallback } from 'react';
import useStore from '../../store/useStore';
import ClayButton from './ClayButton';
import ClayIcon from './ClayIcon';
import styles from './NetworkGame.module.css';

// Diccionario de puertos con sus posiciones fijas relativas en el lienzo de 1000x600
const PORTS = {
  'router-port': { id: 'router-port', name: 'Puerto WAN', deviceId: 'router', x: 280, y: 150 },
  'server-port': { id: 'server-port', name: 'Puerto LAN', deviceId: 'server', x: 720, y: 150 },
  'switch-port-left': { id: 'switch-port-left', name: 'Puerto F0/1', deviceId: 'switch', x: 430, y: 300 },
  'switch-port-right': { id: 'switch-port-right', name: 'Puerto F0/2', deviceId: 'switch', x: 570, y: 300 },
  'switch-port-bottom': { id: 'switch-port-bottom', name: 'Puerto F0/3', deviceId: 'switch', x: 500, y: 360 },
  'lab-port': { id: 'lab-port', name: 'Puerto Uplink', deviceId: 'lab', x: 500, y: 420 },
};

// Diccionario de dispositivos
const DEVICES = {
  router: { id: 'router', name: 'Router Principal', icon: 'router', desc: 'Conecta la red local de Tecsup con la red pública de Internet.' },
  server: { id: 'server', name: 'Servidor', icon: 'dns', desc: 'Almacena la intranet, las bases de datos y los recursos web del campus.' },
  switch: { id: 'switch', name: 'Switch Central', icon: 'hub', desc: 'Distribuye e interconecta los equipos dentro de la red local.' },
  lab: { id: 'lab', name: 'Laboratorio de PCs', icon: 'computer', desc: 'Computadoras de alumnos que requieren comunicación directa.' },
};

// Reglas de conexiones correctas (pares bidireccionales permitidos)
const CORRECT_CONNECTIONS = [
  { p1: 'router-port', p2: 'switch-port-left', type: 'router-switch', label: 'Router al Switch' },
  { p1: 'server-port', p2: 'switch-port-right', type: 'server-switch', label: 'Servidor al Switch' },
  { p1: 'lab-port', p2: 'switch-port-bottom', type: 'lab-switch', label: 'Laboratorio al Switch' }
];

export default function NetworkGame() {
  const networkGameActive = useStore((s) => s.networkGameActive);
  const toggleNetworkGame = useStore((s) => s.toggleNetworkGame);
  const setNetworkGameWon = useStore((s) => s.setNetworkGameWon);

  // Estados locales del juego
  const [connections, setConnections] = useState([]); // [{ from, to, status: 'correct' | 'incorrect' }]
  const [dragStart, setDragStart] = useState(null); // { id, x, y }
  const [dragEnd, setDragEnd] = useState(null); // { x, y }
  const [errorsCount, setErrorsCount] = useState(0);
  const [hoveredDescription, setHoveredDescription] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  


  // Estado del puerto activo (para soporte táctil / clic dual)
  const [activePortId, setActivePortId] = useState(null);

  // Referencias para drag
  const workspaceRef = useRef(null);

  // Generar curva Bezier para la representación visual orgánica del cable
  const getCablePath = useCallback((x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // Efecto colgante del cable (cuelga más si están más lejos)
    const sag = Math.min(100, dist * 0.22);
    const cx1 = x1 + dx * 0.25;
    const cy1 = y1 + dy * 0.25 + sag;
    const cx2 = x1 + dx * 0.75;
    const cy2 = y1 + dy * 0.75 + sag;
    return `M ${x1} ${y1} C ${cx1} ${cy1} ${cx2} ${cy2} ${x2} ${y2}`;
  }, []);

  // Manejar el evento de movimiento para el cable dinámico
  const handleMouseMove = (e) => {
    if (!dragStart || !workspaceRef.current) return;
    
    // Obtener coordenadas relativas al lienzo virtual de 1000x600
    const rect = workspaceRef.current.getBoundingClientRect();
    const scaleX = 1000 / rect.width;
    const scaleY = 600 / rect.height;
    
    const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0].clientY);

    if (clientX !== undefined && clientY !== undefined) {
      setDragEnd({
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      });
    }
  };

  // Limpiar el estado de arrastre si se cancela o sale de la pantalla
  const handleDragCancel = useCallback(() => {
    setDragStart(null);
    setDragEnd(null);
    setActivePortId(null);
  }, []);

  // Intentar crear una conexión entre dos puertos
  const attemptConnection = useCallback((portIdA, portIdB) => {
    if (portIdA === portIdB) return;

    // Verificar si alguno ya está conectado en esta ranura
    const alreadyConnected = connections.some(
      (c) => c.status === 'correct' && (c.from === portIdA || c.to === portIdA || c.from === portIdB || c.to === portIdB)
    );
    if (alreadyConnected) return;

    // Buscar si es una conexión correcta permitida
    const rule = CORRECT_CONNECTIONS.find(
      (r) =>
        (r.p1 === portIdA && r.p2 === portIdB) ||
        (r.p1 === portIdB && r.p2 === portIdA)
    );

    if (rule) {
      // Conexión CORRECTA
      const newConnection = { from: portIdA, to: portIdB, status: 'correct' };
      const updated = [...connections, newConnection];
      setConnections(updated);


    } else {
      // Conexión INCORRECTA
      const errConnection = { from: portIdA, to: portIdB, status: 'incorrect' };
      setConnections((prev) => [...prev, errConnection]);
      setErrorsCount((err) => {
        const nextErr = err + 1;

        return nextErr;
      });

      // Quitar la línea roja de error después de 1.5 segundos
      setTimeout(() => {
        setConnections((prev) => prev.filter((c) => c !== errConnection));
      }, 1500);
    }
  }, [connections]);

  // Evento mouseUp en un puerto al terminar un drag
  const handlePortMouseUp = (portId) => {
    if (dragStart && dragStart.id !== portId) {
      attemptConnection(dragStart.id, portId);
    }
    handleDragCancel();
  };

  // Evento click en un puerto (soporte mobile/táctil)
  const handlePortClick = (portId) => {
    const port = PORTS[portId];
    if (!port) return;

    if (!activePortId) {
      // Primer click
      // Verificar si el puerto ya está conectado de forma correcta
      const isConnected = connections.some(
        (c) => c.status === 'correct' && (c.from === portId || c.to === portId)
      );
      if (isConnected) return;

      setActivePortId(portId);
      setDragStart({ id: portId, x: port.x, y: port.y });
      setDragEnd({ x: port.x, y: port.y });
    } else {
      // Segundo click
      if (activePortId !== portId) {
        attemptConnection(activePortId, portId);
      }
      handleDragCancel();
    }
  };

  // Iniciar arrastre con ratón
  const handlePortMouseDown = (e, portId) => {
    e.stopPropagation();
    const port = PORTS[portId];
    if (!port) return;

    // Verificar si ya está conectado de forma correcta
    const isConnected = connections.some(
      (c) => c.status === 'correct' && (c.from === portId || c.to === portId)
    );
    if (isConnected) return;

    setActivePortId(portId);
    setDragStart({ id: portId, x: port.x, y: port.y });
    setDragEnd({ x: port.x, y: port.y });
  };

  // Reiniciar el minijuego
  const handleRestart = () => {
    setConnections([]);
    setErrorsCount(0);
    handleDragCancel();

  };

  // Cerrar y guardar estado exitoso si corresponde
  const handleComplete = () => {
    setNetworkGameWon(true);
    toggleNetworkGame(); // Cierra
  };

  // Calcular el progreso porcentual (3 conexiones correctas = 100%)
  const correctCount = connections.filter((c) => c.status === 'correct').length;
  const progressPercent = Math.round((correctCount / 3) * 100);
  const isWon = correctCount === 3;

  // Actualizar store global cuando se gana
  useEffect(() => {
    if (isWon) {
      setNetworkGameWon(true);
    }
  }, [isWon, setNetworkGameWon]);

  // Manejar el movimiento del ratón global sobre el workspace durante el drag
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      // Si soltó el mouse fuera de un puerto, se cancela el drag
      if (dragStart) {
        // Un leve retraso permite que el mouseUp del puerto se registre primero si corresponde
        setTimeout(() => {
          handleDragCancel();
        }, 50);
      }
    };

    if (dragStart) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
      window.addEventListener('touchend', handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [dragStart, handleDragCancel]);

  if (!networkGameActive) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Cabecera del minijuego */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <ClayIcon name="settings_ethernet" />
            <span>Consola de Diagnóstico: Restaurar Conectividad</span>
          </div>
          <button className={styles.closeBtn} onClick={toggleNetworkGame} title="Cerrar (Esc)">
            ✕
          </button>
        </div>

        {/* Cuerpo del minijuego */}
        <div className={styles.contentBody}>
          {/* Barra Lateral de Control */}
          <div className={styles.sidebar}>
            <div>
              <h3 className={styles.retroTitle}>Estado General</h3>
              <div className={styles.statusCard} style={{ marginTop: '8px' }}>
                <div className={styles.statusIndicator}>
                  <div className={`${styles.statusLed} ${isWon ? styles.statusLedCorrect : ''}`} />
                  <span style={{ color: isWon ? '#22c55e' : '#ef4444' }}>
                    {isWon ? 'SISTEMA ONLINE' : 'DISPOSITIVO SIN RED'}
                  </span>
                </div>
              </div>
            </div>

            {/* Progreso */}
            <div className={styles.progressContainer}>
              <div className={styles.progressHeader}>
                <span>Conectividad</span>
                <span>{progressPercent}%</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            {/* Estadísticas */}
            <div className={styles.statsBlock}>
              <div className={styles.statItem}>
                <span>Enlaces Correctos</span>
                <span className={styles.statValue} style={{ color: '#22c55e' }}>{correctCount} / 3</span>
              </div>
              <div className={styles.statItem}>
                <span>Errores de Topología</span>
                <span className={`${styles.statValue} ${errorsCount > 0 ? styles.statValueErr : ''}`}>{errorsCount}</span>
              </div>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <ClayButton variant="cyan-light" onClick={handleRestart} style={{ width: '100%' }}>
                Reiniciar Cables
              </ClayButton>
            </div>
          </div>

          {/* Área de Red Interactiva */}
          <div 
            className={styles.gameArea}
            ref={workspaceRef}
            onMouseMove={handleMouseMove}
            onTouchMove={handleMouseMove}
          >
            {/* Rejilla de Fondo */}
            <div className={styles.gridBackground} />

            {/* Workspace virtual mapeado a 1000x600 */}
            <div className={styles.workspace}>
              {/* Capa de Cables SVG */}
              <svg className={styles.svgOverlay} viewBox="0 0 1000 600">
                {/* 1. Dibujar conexiones completadas (Establecidas) */}
                {connections.map((conn, idx) => {
                  const portFrom = PORTS[conn.from];
                  const portTo = PORTS[conn.to];
                  if (!portFrom || !portTo) return null;

                  const color = conn.status === 'correct' ? '#22c55e' : '#ef4444';
                  const glow = conn.status === 'correct' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)';
                  const path = getCablePath(portFrom.x, portFrom.y, portTo.x, portTo.y);

                  return (
                    <g key={idx}>
                      <path
                        d={path}
                        fill="none"
                        stroke={glow}
                        strokeWidth="10"
                        strokeLinecap="round"
                      />
                      <path
                        d={path}
                        fill="none"
                        stroke={color}
                        strokeWidth="5"
                        strokeLinecap="round"
                        className={conn.status === 'incorrect' ? 'blink-red' : ''}
                      />
                    </g>
                  );
                })}

                {/* 2. Dibujar cable dinámico de arrastre actual */}
                {dragStart && dragEnd && (
                  <g>
                    <path
                      d={getCablePath(dragStart.x, dragStart.y, dragEnd.x, dragEnd.y)}
                      fill="none"
                      stroke="rgba(14, 165, 233, 0.3)"
                      strokeWidth="9"
                      strokeLinecap="round"
                    />
                    <path
                      d={getCablePath(dragStart.x, dragStart.y, dragEnd.x, dragEnd.y)}
                      fill="none"
                      stroke="#0ea5e9"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                  </g>
                )}
              </svg>

              {/* Renderizar Puertos/Sockets sobre los cables */}
              {Object.values(PORTS).map((port) => {
                const isConnected = connections.some(
                  (c) => c.status === 'correct' && (c.from === port.id || c.to === port.id)
                );
                const isActive = activePortId === port.id;

                let portClass = styles.port;
                if (isConnected) portClass += ` ${styles.portConnected}`;
                if (isActive) portClass += ` ${styles.portActive}`;

                return (
                  <div
                    key={port.id}
                    className={portClass}
                    style={{ left: `${port.x}px`, top: `${port.y}px` }}
                    onMouseDown={(e) => handlePortMouseDown(e, port.id)}
                    onMouseUp={() => handlePortMouseUp(port.id)}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      handlePortClick(port.id);
                    }}
                    title={`${port.name}`}
                  />
                );
              })}

              {/* Renderizar Dispositivos HTML */}
              {Object.values(DEVICES).map((device) => {
                // Determinar posición según el centro del dispositivo
                let left = '50%';
                let top = '50%';

                if (device.id === 'router') { left = '200px'; top = '150px'; }
                else if (device.id === 'server') { left = '800px'; top = '150px'; }
                else if (device.id === 'switch') { left = '500px'; top = '300px'; }
                else if (device.id === 'lab') { left = '500px'; top = '480px'; }

                // Determinar si los puertos asociados están conectados
                let isDevConnected = false;
                if (device.id === 'router') {
                  isDevConnected = connections.some((c) => c.status === 'correct' && (c.from === 'router-port' || c.to === 'router-port'));
                } else if (device.id === 'server') {
                  isDevConnected = connections.some((c) => c.status === 'correct' && (c.from === 'server-port' || c.to === 'server-port'));
                } else if (device.id === 'lab') {
                  isDevConnected = connections.some((c) => c.status === 'correct' && (c.from === 'lab-port' || c.to === 'lab-port'));
                } else if (device.id === 'switch') {
                  // Switch se considera conectado si tiene al menos un enlace
                  isDevConnected = connections.some((c) => c.status === 'correct' && (c.from.includes('switch') || c.to.includes('switch')));
                }

                const handleMouseEnter = () => {
                  setHoveredDescription(device.desc);
                  setTooltipPos({
                    x: parseInt(left, 10),
                    y: parseInt(top, 10) - 75
                  });
                };

                return (
                  <div
                    key={device.id}
                    className={styles.device}
                    style={{ left, top }}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={() => setHoveredDescription(null)}
                  >
                    <div className={styles.deviceHeader}>
                      <span className={styles.deviceName}>{device.name}</span>
                      <div className={`${styles.deviceLed} ${isDevConnected ? styles.deviceLedCorrect : ''}`} />
                    </div>
                    
                    <ClayIcon name={device.icon} className={styles.deviceIcon} />
                    
                    <span className={styles.deviceStatusTxt}>
                      {isDevConnected ? 'LINK UP' : 'LINK DOWN'}
                    </span>
                  </div>
                );
              })}

              {/* Tooltip flotante de ayuda */}
              {hoveredDescription && (
                <div
                  className={styles.tooltip}
                  style={{
                    left: `${tooltipPos.x}px`,
                    top: `${tooltipPos.y}px`,
                    transform: 'translate(-50%, -100%)',
                  }}
                >
                  {hoveredDescription}
                </div>
              )}
            </div>



            {/* Pantalla de Victoria (🏆 Trofeo) */}
            {isWon && (
              <div className={styles.victoryOverlay}>
                <div className={styles.trophyContainer}>🏆</div>
                <h2 className={styles.victoryTitle}>¡CONECTIVIDAD RESTAURADA AL 100%!</h2>
                <p className={styles.victoryText}>
                  ¡Excelente! Armaste la topología de red estrella correctamente. El Switch conmutó
                  las señales del router, el servidor y el laboratorio de Tecsup de forma exitosa.
                </p>
                <ClayButton variant="cyan-solid" className={styles.actionBtn} onClick={handleComplete}>
                  Obtener Trofeo y Salir
                </ClayButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
