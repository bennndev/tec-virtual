import React, { useState, useEffect, useRef, useCallback } from 'react';
import useStore from '../../store/useStore';
import ClayButton from './ClayButton';
import ClayIcon from './ClayIcon';
import styles from './HackerGame.module.css';

// Emojis de virus/bichos para variedad visual
const BUG_EMOJIS = ['🦠', '🪲', '🐛', '🕷️', '🦟', '💻'];

// Mensajes educativos de ciberseguridad entre oleadas
const CYBER_TIPS = [
  'Un firewall monitorea y filtra el tráfico de red para bloquear accesos no autorizados.',
  'Los antivirus detectan patrones maliciosos en los archivos antes de que puedan ejecutarse.',
  'La autenticación multifactor (MFA) agrega una capa extra de seguridad más allá de la contraseña.',
  'El cifrado de datos convierte la información en código ilegible para quien no tenga la llave.',
  'Las actualizaciones de seguridad corrigen vulnerabilidades que los atacantes podrían explotar.',
  'Un ataque de phishing busca engañarte para que entregues información confidencial.',
  'La segmentación de red aísla sistemas críticos para limitar el alcance de un ataque.',
  'Los SIEM centralizan y analizan logs de seguridad para detectar amenazas en tiempo real.',
  'El pentest (prueba de penetración) evalúa la seguridad de un sistema simulando un ataque real.',
  'La copia de seguridad periódica es la última línea de defensa contra ransomware.',
];

// Tiempo en milisegundos
const GAME_DURATION = 20000; // 20 segundos
const SPAWN_INTERVAL = 600; // ms entre spawns
const BUG_SPEED = 0.4; // px por frame
const FIREWALL_MAX = 100;

function getRandomTip() {
  return CYBER_TIPS[Math.floor(Math.random() * CYBER_TIPS.length)];
}

export default function HackerGame() {
  const hackerGameActive = useStore((s) => s.hackerGameActive);
  const toggleHackerGame = useStore((s) => s.toggleHackerGame);
  const setHackerGameWon = useStore((s) => s.setHackerGameWon);

  // Bugs activos: { id, x, y, emoji, speed }
  const [bugs, setBugs] = useState([]);
  const [firewallHealth, setFirewallHealth] = useState(FIREWALL_MAX);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameOver, setGameOver] = useState(false); // true si perdiste
  const [isWon, setIsWon] = useState(false);
  const [score, setScore] = useState(0);
  const [currentTip, setCurrentTip] = useState('');
  const [showTip, setShowTip] = useState(false);

  const gameAreaRef = useRef(null);
  const bugsRef = useRef(bugs);
  const animFrameRef = useRef(null);
  const lastSpawnRef = useRef(0);
  const tipTimerRef = useRef(null);
  const gameOverRef = useRef(false);
  const isWonRef = useRef(false);

  // Mantener referencias actualizadas
  bugsRef.current = bugs;

  // Game loop
  const gameLoop = useCallback((timestamp) => {
    // Spawn de nuevos bichos
    if (timestamp - lastSpawnRef.current > SPAWN_INTERVAL) {
      lastSpawnRef.current = timestamp;
      const newBug = {
        id: Math.random().toString(36).slice(2),
        x: Math.random() * 85 + 5,
        y: 2,
        emoji: BUG_EMOJIS[Math.floor(Math.random() * BUG_EMOJIS.length)],
        speed: BUG_SPEED + Math.random() * 0.3,
      };
      setBugs((prev) => [...prev, newBug]);
    }

    // Mover bichos hacia abajo
    setBugs((prev) => {
      const escaped = [];
      const remaining = [];
      for (const bug of prev) {
        const newY = bug.y + bug.speed;
        if (newY > 92) {
          escaped.push(bug);
        } else {
          remaining.push({ ...bug, y: newY });
        }
      }
      if (escaped.length > 0) {
        setFirewallHealth((h) => {
          const newHealth = h - escaped.length * 8;
          if (newHealth <= 0) {
            gameOverRef.current = true;
            setGameOver(true);
            return 0;
          }
          return newHealth;
        });
      }
      return remaining;
    });

    // Continuar loop solo si no terminó
    if (!gameOverRef.current && !isWonRef.current) {
      animFrameRef.current = requestAnimationFrame(gameLoop);
    }
  }, []);

  // Iniciar el loop cuando se activa el juego
  useEffect(() => {
    if (!hackerGameActive) return;

    // Resetear estado
    gameOverRef.current = false;
    isWonRef.current = false;
    setBugs([]);
    setFirewallHealth(FIREWALL_MAX);
    setTimeLeft(GAME_DURATION);
    setGameOver(false);
    setIsWon(false);
    setScore(0);
    setCurrentTip('');
    setShowTip(false);

    lastSpawnRef.current = performance.now();

    // Mostrar tip educativo periódicamente
    tipTimerRef.current = setInterval(() => {
      setCurrentTip(getRandomTip());
      setShowTip(true);
      setTimeout(() => setShowTip(false), 5000);
    }, 8000);

    const startTime = performance.now();

    // Timer regresivo
    const timerInterval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const remaining = Math.max(0, GAME_DURATION - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        isWonRef.current = true;
        setIsWon(true);
      }
    }, 100);

    // Iniciar game loop
    lastSpawnRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      clearInterval(timerInterval);
      clearInterval(tipTimerRef.current);
    };
  }, [hackerGameActive, gameLoop]);

  // Click para eliminar un bicho
  const handleBugClick = (e, bugId) => {
    e.stopPropagation();
    setBugs((prev) => prev.filter((b) => b.id !== bugId));
    setScore((s) => s + 10);
  };

  // Cerrar y guardar victoria
  const challengeCountedRef = useRef(false);

  const handleComplete = () => {
    setHackerGameWon(true);
    toggleHackerGame();
    if (!challengeCountedRef.current) {
      challengeCountedRef.current = true;
      useStore.getState().completeChallenge();
    }
  };

  // Reiniciar
  const handleRestart = () => {
    setBugs([]);
    setFirewallHealth(FIREWALL_MAX);
    setTimeLeft(GAME_DURATION);
    setGameOver(false);
    setIsWon(false);
    setScore(0);
  };

  if (!hackerGameActive) return null;

  const progressPercent = Math.round((firewallHealth / FIREWALL_MAX) * 100);
  const secondsLeft = Math.ceil(timeLeft / 1000);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Cabecera */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <ClayIcon name="security" />
            <span>Defender Ataque Hacker — Ciberseguridad</span>
          </div>
          <ClayButton className={styles.closeBtn} onClick={toggleHackerGame} title="Cerrar (Esc)">
            ✕
          </ClayButton>
        </div>

        {/* Cuerpo */}
        <div className={styles.contentBody}>
          {/* Barra lateral */}
          <div className={styles.sidebar}>
            <div>
              <h3 className={styles.retroTitle}>Estado del Sistema</h3>
              <div className={styles.statusCard}>
                <div className={styles.statusIndicator}>
                  <div className={`${styles.statusLed} ${firewallHealth > 50 ? styles.statusLedOk : firewallHealth > 25 ? styles.statusLedWarn : styles.statusLedDanger}`} />
                  <span className={firewallHealth > 50 ? '' : styles.textDanger}>
                    {isWon ? 'RED ASEGURADA' : gameOver ? 'SISTEMA COMPROMETIDO' : 'BAJO ATAQUE'}
                  </span>
                </div>
              </div>
            </div>

            {/* Firewall Health */}
            <div className={styles.progressContainer}>
              <div className={styles.progressHeader}>
                <span>Firewall</span>
                <span className={firewallHealth <= 25 ? styles.textDanger : ''}>{firewallHealth}%</span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={`${styles.progressFill} ${firewallHealth <= 25 ? styles.progressDanger : firewallHealth <= 50 ? styles.progressWarn : ''}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Estadísticas */}
            <div className={styles.statsBlock}>
              <div className={styles.statItem}>
                <span>Tiempo</span>
                <span className={styles.statValue}>{secondsLeft}s</span>
              </div>
              <div className={styles.statItem}>
                <span>Amenazas Neutralizadas</span>
                <span className={styles.statValue} style={{ color: '#22c55e' }}>{score / 10}</span>
              </div>
              <div className={styles.statItem}>
                <span>Filtraciones</span>
                <span className={`${styles.statValue} ${(FIREWALL_MAX - firewallHealth) / 8 > 0 ? styles.textDanger : ''}`}>
                  {Math.floor((FIREWALL_MAX - firewallHealth) / 8)}
                </span>
              </div>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <ClayButton variant="cyan-light" onClick={handleRestart} style={{ width: '100%' }}>
                Reiniciar Defensa
              </ClayButton>
            </div>
          </div>

          {/* Área de juego */}
            <div className={styles.gameArea} onMouseDown={(e) => e.stopPropagation()}>
            <div className={styles.gridBackground} />

            {/* Game area */}
            <div className={styles.workspace} ref={gameAreaRef}>
              {/* Bichos */}
              {bugs.map((bug) => (
                <div
                  key={bug.id}
                  className={styles.bug}
                  style={{ left: `${bug.x}%`, top: `${bug.y}%` }}
                  onClick={(e) => handleBugClick(e, bug.id)}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleBugClick(e, bug.id);
                  }}
                  title="¡Haz clic para neutralizar!"
                >
                  <span className={styles.bugEmoji}>{bug.emoji}</span>
                </div>
              ))}

              {/* Línea de defensa (servidor) */}
              <div className={styles.defenseLine}>
                <div className={styles.serverIcon}>🛡️</div>
                <span className={styles.defenseLabel}>SERVIDOR — DEFIENDE EL CAMPUS</span>
              </div>
            </div>

            {/* Tip educativo flotante */}
            {showTip && currentTip && (
              <div className={styles.tipFloat}>
                <span className={styles.tipIcon}>💡</span>
                <span>{currentTip}</span>
              </div>
            )}

            {/* Pantalla de Derrota */}
            {gameOver && (
              <div className={styles.victoryOverlay}>
                <div className={styles.gameOverIcon}>💀</div>
                <h2 className={styles.victoryTitle} style={{ color: '#ef4444' }}>¡SISTEMA COMPROMETIDO!</h2>
                <p className={styles.victoryText}>
                  Demasiadas amenazas lograron atravesar el firewall. En el mundo real, un ataque así
                  podría significar la pérdida de datos, la interrupción de servicios o el robo de información.
                </p>
                <p className={styles.victoryText} style={{ fontWeight: 700, color: '#0ea5e9' }}>
                  La ciberseguridad nos enseña a prevenir, detectar y responder a este tipo de incidentes.
                </p>
                <ClayButton variant="cyan-light" className={styles.actionBtn} onClick={handleRestart}>
                  Intentar de Nuevo
                </ClayButton>
                <ClayButton variant="cyan-solid" className={styles.actionBtn} onClick={toggleHackerGame} style={{ marginTop: '8px' }}>
                  Salir
                </ClayButton>
              </div>
            )}

            {/* Pantalla de Victoria */}
            {isWon && (
              <div className={styles.victoryOverlay}>
                <div className={styles.trophyContainer}>🏆</div>
                <h2 className={styles.victoryTitle}>¡RED ASEGURADA!</h2>
                <p className={styles.victoryText}>
                  ¡Excelente trabajo! Defendiste el campus de todas las amenazas cibernéticas.
                  Has demostrado reflejos y conocimiento en seguridad informática.
                </p>
                <p className={styles.victoryText} style={{ fontWeight: 700, color: '#0ea5e9' }}>
                  Así como neutralizaste estos ataques, en la carrera de Ciberseguridad aprenderás
                  a proteger redes, servidores y datos de amenazas reales.
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
