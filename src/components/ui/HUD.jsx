import { useEffect, useRef, useState, useCallback } from 'react';
import useStore from '../../store/useStore';
import CharacterSwitcher from './CharacterSwitcher';

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
      {/* Columna superior izquierda: FPS + coordenadas */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div
          style={{
            background: 'rgba(0,0,0,0.6)',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
          }}
        >
          <FPS />
        </div>
        <div
          style={{
            background: flyMode ? 'rgba(0, 150, 255, 0.2)' : 'rgba(0,0,0,0.6)',
            padding: '8px 14px',
            borderRadius: '6px',
            lineHeight: 1.6,
            border: flyMode ? '1px solid rgba(0, 150, 255, 0.5)' : 'none',
          }}
        >
          <div>X: {playerPosition.x.toFixed(2)}</div>
          <div>Y: {playerPosition.y.toFixed(2)}</div>
          <div>Z: {playerPosition.z.toFixed(2)}</div>
          {flyMode && (
            <div style={{ color: '#4fc3f7', marginTop: 4, fontSize: 11 }}>
              ✈ VOLANDO — Space ↑ | Shift ↓ | F salir
            </div>
          )}
        </div>
      </div>

      {/* Selector de personaje */}
      <CharacterSwitcher />

      {/* Control de música */}
      <button
        onClick={toggleMusic}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          pointerEvents: 'auto',
          background: 'rgba(255, 255, 255, 0.1)',
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          padding: '10px 16px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontFamily: 'ui-monospace, Consolas, monospace',
          fontSize: '18px',
          lineHeight: 1,
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
        title={musicMuted ? 'Activar música' : 'Silenciar música'}
      >
        {musicMuted ? '🔇' : '🔊'}
      </button>

      {/* Cambio de modo de camara — extremo derecho inferior */}
      <button
        onClick={handleToggle}
        style={{
          position: 'absolute',
          bottom: 170,
          right: 20,
          pointerEvents: 'auto',
          background: 'rgba(233, 69, 96, 0.85)',
          color: '#fff',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontFamily: 'ui-monospace, Consolas, monospace',
          fontSize: '14px',
          fontWeight: 500,
          letterSpacing: '0.3px',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(233, 69, 96, 1)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(233, 69, 96, 0.85)')}
      >
        {cameraMode === 'overview' ? 'Tercera persona (M)' : 'Vista general (M)'}
      </button>
    </div>
  );
}
