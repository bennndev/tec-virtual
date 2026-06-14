import { useEffect, useRef, useState, useCallback } from 'react';
import useStore from '../../store/useStore';
import CharacterSwitcher from './CharacterSwitcher';
import ClayButton from './ClayButton';
import ClayIcon from './ClayIcon';
import Minimap from './Minimap';
import FullMapModal from './FullMapModal';
import styles from './HUD.module.css';

function FPS() {
  const [fps, setFps] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    let rafId;
    const tick = () => {
      frameCount.current++;
      const now = performance.now();
      const elapsed = now - lastTime.current;
      if (elapsed >= 1000) {
        setFps(Math.round((frameCount.current * 1000) / elapsed));
        frameCount.current = 0;
        lastTime.current = now;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return <span>{fps} FPS</span>;
}

export default function HUD() {
  const playerPosition = useStore((s) => s.playerPosition);
  const cameraMode = useStore((s) => s.cameraMode);
  const musicMuted = useStore((s) => s.musicMuted);
  const toggleMusic = useStore((s) => s.toggleMusic);
  const flyMode = useStore((s) => s.flyMode);

  const [showStats, setShowStats] = useState(false);

  // Toggle de estadísticas (F3 es el estándar de depuración)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'F3') {
        e.preventDefault(); // Evita abrir la barra de búsqueda nativa del navegador
        setShowStats((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggle = useCallback(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM' }));
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
        fontFamily: 'ui-monospace, Consolas, monospace',
        color: '#fff',
        fontSize: '14px',
      }}
    >
      {/* Columna superior izquierda: FPS + coordenadas (solo si showStats está activo) */}
      {showStats && (
        <div className={styles.statsContainer}>
          <div className={styles.fpsWidget}>
            <FPS />
          </div>
          <div className={`${styles.coordsWidget} ${flyMode ? styles.coordsWidgetActive : ''}`.trim()}>
            <div className={styles.coordLine}>
              <span className={styles.coordLabel}>X:</span>
              <span className={styles.coordValue}>{playerPosition.x.toFixed(2)}</span>
            </div>
            <div className={styles.coordLine}>
              <span className={styles.coordLabel}>Y:</span>
              <span className={styles.coordValue}>{playerPosition.y.toFixed(2)}</span>
            </div>
            <div className={styles.coordLine}>
              <span className={styles.coordLabel}>Z:</span>
              <span className={styles.coordValue}>{playerPosition.z.toFixed(2)}</span>
            </div>
            {flyMode && (
              <div className={styles.flyModeHelp}>
                ✈ VOLANDO — Space ↑ | Shift ↓ | F salir
              </div>
            )}
          </div>
        </div>
      )}

      {/* Minimapa Dinámico */}
      <Minimap />
      <FullMapModal />

      {/* Selector de personaje */}
      <CharacterSwitcher />

      {/* Control de música */}
      <ClayButton
        onClick={toggleMusic}
        variant="cyan-light"
        className={styles.musicBtn}
        title={musicMuted ? 'Activar música' : 'Silenciar música'}
      >
        <ClayIcon name={musicMuted ? 'volume_off' : 'volume_up'} />
      </ClayButton>

      {/* Cambio de modo de camara — extremo derecho inferior */}
      <ClayButton
        onClick={handleToggle}
        variant="cyan-light"
        className={styles.cameraBtn}
      >
        {cameraMode === 'overview' ? 'Tercera persona (M)' : 'Vista general (M)'}
      </ClayButton>
    </div>
  );
}
