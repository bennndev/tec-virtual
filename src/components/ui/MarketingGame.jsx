import React, { useState, useEffect, useRef, useCallback } from 'react';
import useStore from '../../store/useStore';
import ClayButton from './ClayButton';
import ClayIcon from './ClayIcon';
import styles from './MarketingGame.module.css';

const GAME_DURATION = 30000;
const ASSETS_MAX = 100;
const GRAVITY = 1.8; // cuanto baja por segundo
const CLICK_BOOST = 12; // cuanto sube por click
const CRISIS_INTERVAL = 6000; // cada 6s una crisis que acelera la caida

// Mensajes de crisis que aparecen durante el juego
const CRISIS_EVENTS = [
  'Competencia lanza oferta agresiva',
  'Tendencia de mercado cambiante',
  'Proveedor aumenta precios',
  'Cliente importante cancela contrato',
  'Nueva regulacion del sector',
  'Caida en la bolsa de valores',
  'Campaña de la competencia se vuelve viral',
  'Costo de publicidad incrementa',
];

function getRandomCrisis() {
  return CRISIS_EVENTS[Math.floor(Math.random() * CRISIS_EVENTS.length)];
}

export default function MarketingGame() {
  const marketingGameActive = useStore((s) => s.marketingGameActive);
  const toggleMarketingGame = useStore((s) => s.toggleMarketingGame);
  const setMarketingGameWon = useStore((s) => s.setMarketingGameWon);

  const [assetHealth, setAssetHealth] = useState(50);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameOver, setGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [score, setScore] = useState(0);
  const [crisisText, setCrisisText] = useState('');
  const [showCrisis, setShowCrisis] = useState(false);
  const [combo, setCombo] = useState(0);

  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(0);
  const assetRef = useRef(assetHealth);
  const gameOverRef = useRef(false);
  const isWonRef = useRef(false);
  const crisisTimerRef = useRef(null);

  assetRef.current = assetHealth;

  const gameLoop = useCallback((timestamp) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const delta = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;

    setAssetHealth((prev) => {
      const newVal = prev - GRAVITY * delta;
      if (newVal <= 0) {
        gameOverRef.current = true;
        setGameOver(true);
        return 0;
      }
      return newVal;
    });

    setTimeLeft((prev) => {
      const remaining = prev - delta * 1000;
      if (remaining <= 0) {
        isWonRef.current = true;
        setIsWon(true);
        return 0;
      }
      return remaining;
    });

    if (!gameOverRef.current && !isWonRef.current) {
      animFrameRef.current = requestAnimationFrame(gameLoop);
    }
  }, []);

  useEffect(() => {
    if (!marketingGameActive) return;

    // Reset
    gameOverRef.current = false;
    isWonRef.current = false;
    lastTimeRef.current = 0;
    setAssetHealth(50);
    setTimeLeft(GAME_DURATION);
    setGameOver(false);
    setIsWon(false);
    setScore(0);
    setCombo(0);
    setCrisisText('');
    setShowCrisis(false);

    // Crisis periodicas
    crisisTimerRef.current = setInterval(() => {
      setCrisisText(getRandomCrisis());
      setShowCrisis(true);
      // La crisis acelera la gravedad temporalmente
      setTimeout(() => setShowCrisis(false), 3000);
    }, CRISIS_INTERVAL);

    // Iniciar loop
    lastTimeRef.current = 0;
    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      clearInterval(crisisTimerRef.current);
    };
  }, [marketingGameActive, gameLoop]);

  const handleClick = () => {
    if (gameOver || isWon) return;
    setAssetHealth((prev) => Math.min(ASSETS_MAX, prev + CLICK_BOOST));
    setScore((s) => s + 1);
    setCombo((c) => c + 1);
  };

  const handleComplete = () => {
    setMarketingGameWon(true);
    toggleMarketingGame();
  };

  const handleRestart = () => {
    gameOverRef.current = false;
    isWonRef.current = false;
    lastTimeRef.current = 0;
    setAssetHealth(50);
    setTimeLeft(GAME_DURATION);
    setGameOver(false);
    setIsWon(false);
    setScore(0);
    setCombo(0);
  };

  if (!marketingGameActive) return null;

  const progressPercent = Math.round((assetHealth / ASSETS_MAX) * 100);
  const secondsLeft = Math.ceil(timeLeft / 1000);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Cabecera */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <ClayIcon name="trending_up" />
            <span>Tug of Assets — Gestion de Crisis</span>
          </div>
          <ClayButton className={styles.closeBtn} onClick={toggleMarketingGame} title="Cerrar (Esc)">
            ✕
          </ClayButton>
        </div>

        {/* Cuerpo */}
        <div className={styles.contentBody}>
          {/* Barra lateral */}
          <div className={styles.sidebar}>
            <div>
              <h3 className={styles.retroTitle}>Estado de la Empresa</h3>
              <div className={styles.statusCard}>
                <div className={styles.statusIndicator}>
                  <div className={`${styles.statusLed} ${assetHealth > 50 ? styles.statusLedOk : assetHealth > 25 ? styles.statusLedWarn : styles.statusLedDanger}`} />
                  <span className={assetHealth > 50 ? '' : styles.textDanger}>
                    {isWon ? 'EMPRESA ESTABLE' : gameOver ? 'EMPRESA EN QUIEBRA' : 'MERCADO VOLATIL'}
                  </span>
                </div>
              </div>
            </div>

            {/* Barra de activos */}
            <div className={styles.progressContainer}>
              <div className={styles.progressHeader}>
                <span>Valor de Activos</span>
                <span className={assetHealth <= 25 ? styles.textDanger : ''}>{Math.round(assetHealth)}%</span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={`${styles.progressFill} ${assetHealth <= 25 ? styles.progressDanger : assetHealth <= 50 ? styles.progressWarn : ''}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Estadisticas */}
            <div className={styles.statsBlock}>
              <div className={styles.statItem}>
                <span>Tiempo</span>
                <span className={styles.statValue}>{secondsLeft}s</span>
              </div>
              <div className={styles.statItem}>
                <span>Decisiones</span>
                <span className={styles.statValue} style={{ color: '#22c55e' }}>{score}</span>
              </div>
              <div className={styles.statItem}>
                <span>Racha</span>
                <span className={`${styles.statValue} ${combo > 5 ? styles.textDanger : ''}`}>{combo}</span>
              </div>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <ClayButton variant="cyan-light" onClick={handleRestart} style={{ width: '100%' }}>
                Reiniciar
              </ClayButton>
            </div>
          </div>

          {/* Area de juego */}
          <div className={styles.gameArea}>
            <div className={styles.gridBackground} />

            <div className={styles.workspace}>
              {/* Empresas cara a cara + barra tug of war */}
              <div className={styles.battleArea}>
                {/* Imagen empresa izquierda */}
                <div className={styles.companySide}>
                  <img src="/empresa.png" alt="Tu empresa" className={styles.companyImg} />
                  <span className={styles.companyLabel}>Tu Empresa</span>
                </div>

                {/* VS */}
                <div className={styles.vsContainer}>
                  <span className={styles.vsText}>VS</span>
                  {/* Barra de tug of war vertical */}
                  <div className={styles.tugBarOuter}>
                    <div className={styles.tugBarTrack}>
                      <div
                        className={styles.tugBarFill}
                        style={{ height: `${progressPercent}%` }}
                      />
                    </div>
                    <div className={styles.tugMarker} style={{ bottom: `${progressPercent}%` }}>
                      <span className={styles.tugIcon}>&#9650;</span>
                    </div>
                  </div>
                </div>

                {/* Imagen empresa derecha */}
                <div className={styles.companySide}>
                  <img src="/mercado.png" alt="Mercado" className={styles.companyImg} />
                  <span className={styles.companyLabel}>Mercado</span>
                </div>
              </div>

              {/* Indicador de click */}
              <div className={styles.clickArea} onClick={handleClick}>
                <div className={styles.clickHint}>
                  <ClayIcon name="touch_app" className={styles.clickIcon} />
                  <span>Haz click para mantener tus activos a flote!</span>
                </div>

                {/* Efecto visual de combo */}
                {combo > 3 && (
                  <div className={styles.comboIndicator}>
                    Racha de {combo} decisiones
                  </div>
                )}
              </div>
            </div>

            {/* Crisis flotante */}
            {showCrisis && crisisText && (
              <div className={styles.tipFloat}>
                <span className={styles.tipIcon}>📉</span>
                <span>{crisisText}</span>
              </div>
            )}

            {/* Pantalla de Derrota */}
            {gameOver && (
              <div className={styles.victoryOverlay}>
                <div className={styles.gameOverIcon}>💸</div>
                <h2 className={styles.victoryTitle} style={{ color: '#ef4444' }}>EMPRESA EN QUIEBRA</h2>
                <p className={styles.victoryText}>
                  No lograste mantener los activos a flote. En el mundo real, las empresas enfrentan
                  crisis constantes y deben tomar decisiones rapidas para sobrevivir.
                </p>
                <ClayButton variant="cyan-light" className={styles.actionBtn} onClick={handleRestart}>
                  Intentar de Nuevo
                </ClayButton>
                <ClayButton variant="cyan-solid" className={styles.actionBtn} onClick={toggleMarketingGame} style={{ marginTop: '8px' }}>
                  Salir
                </ClayButton>
              </div>
            )}

            {/* Pantalla de Victoria */}
            {isWon && (
              <div className={styles.victoryOverlay}>
                <div className={styles.trophyContainer}>🏆</div>
                <h2 className={styles.victoryTitle}>EMPRESA ESTABLE</h2>
                <p className={styles.victoryText}>
                  Excelente trabajo. Mantuviste los activos de tu empresa a flote durante la crisis del mercado.
                  Has demostrado capacidad de reaccion y toma de decisiones bajo presion.
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
