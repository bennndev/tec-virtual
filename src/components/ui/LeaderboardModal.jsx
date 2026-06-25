import useStore from '../../store/useStore';
import ClayButton from './ClayButton';
import styles from './LeaderboardModal.module.css';

export default function LeaderboardModal() {
  const leaderboardOpen = useStore((s) => s.leaderboardOpen);
  const setLeaderboardOpen = useStore((s) => s.setLeaderboardOpen);
  const leaderboard = useStore((s) => s.leaderboard);

  if (!leaderboardOpen) return null;

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.overlay} onClick={() => setLeaderboardOpen(false)}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <ClayButton className={styles.closeBtn} onClick={() => setLeaderboardOpen(false)}>
          ✕
        </ClayButton>

        <h2 className={styles.title}>Podio</h2>

        {leaderboard.length === 0 ? (
          <p className={styles.empty}>Aun no hay registros. Completa el recorrido para aparecer aqui.</p>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span className={styles.colPos}>#</span>
              <span className={styles.colName}>Nombre</span>
              <span className={styles.colTime}>Tiempo</span>
              <span className={styles.colCoins}>Monedas</span>
            </div>
            {leaderboard.map((entry, i) => (
              <div key={i} className={`${styles.tableRow} ${i === 0 ? styles.gold : i === 1 ? styles.silver : i === 2 ? styles.bronze : ''}`}>
                <span className={styles.colPos}>{i + 1}</span>
                <span className={styles.colName}>{entry.name}</span>
                <span className={styles.colTime}>{formatTime(entry.time)}</span>
                <span className={styles.colCoins}>{entry.coins}/3</span>
              </div>
            ))}
          </div>
        )}

        <ClayButton variant="cyan-light" onClick={() => setLeaderboardOpen(false)} className={styles.closeAction}>
          Cerrar
        </ClayButton>
      </div>
    </div>
  );
}
