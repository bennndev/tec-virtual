import { useState } from 'react';
import useStore from '../../store/useStore';
import ClayButton from './ClayButton';
import styles from './NameEntryModal.module.css';

export default function NameEntryModal() {
  const nameEntryOpen = useStore((s) => s.nameEntryOpen);
  const finalTime = useStore((s) => s.finalTime);
  const coinsCollected = useStore((s) => s.coinsCollected);
  const totalCoins = useStore((s) => s.totalCoins);
  const challengesCompleted = useStore((s) => s.challengesCompleted);
  const setPlayerName = useStore((s) => s.setPlayerName);
  const saveScore = useStore((s) => s.saveScore);
  const setLeaderboardOpen = useStore((s) => s.setLeaderboardOpen);
  const [name, setName] = useState('');

  if (!nameEntryOpen) return null;

  const handleSave = () => {
    setPlayerName(name.trim() || 'Anonimo');
    saveScore();
  };

  const handleViewLeaderboard = () => {
    setPlayerName(name.trim() || 'Anonimo');
    saveScore();
    setLeaderboardOpen(true);
  };

  const minutes = Math.floor(finalTime / 60);
  const seconds = finalTime % 60;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Recorrido Completado</h2>

        <div className={styles.stats}>
          <div className={styles.statRow}>
            <span>Tiempo total</span>
            <span className={styles.statValue}>{minutes}:{seconds.toString().padStart(2, '0')}</span>
          </div>
          <div className={styles.statRow}>
            <span>Monedas</span>
            <span className={styles.statValue}>{coinsCollected} / {totalCoins}</span>
          </div>
          <div className={styles.statRow}>
            <span>Desafios</span>
            <span className={styles.statValue}>{challengesCompleted} / 3</span>
          </div>
        </div>

        <p className={styles.label}>Ingresa tu nombre para guardar tu puntaje:</p>
        <input
          className={styles.input}
          type="text"
          placeholder="Tu nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          autoFocus
        />

        <div className={styles.actions}>
          <ClayButton variant="cyan-solid" onClick={handleSave}>
            Guardar
          </ClayButton>
          <ClayButton variant="cyan-light" onClick={handleViewLeaderboard}>
            Ver Podio
          </ClayButton>
        </div>
      </div>
    </div>
  );
}
