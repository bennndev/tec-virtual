import { useEffect } from 'react';
import useStore from '../../store/useStore';
import styles from './EnExConfirmModal.module.css';

export default function EnExConfirmModal() {
  const pendingEnex = useStore((s) => s.pendingEnex);
  const clearPendingEnex = useStore((s) => s.clearPendingEnex);
  const setTeleportTarget = useStore((s) => s.setTeleportTarget);

  // Close on Escape key
  useEffect(() => {
    if (!pendingEnex) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') clearPendingEnex();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [pendingEnex, clearPendingEnex]);

  if (!pendingEnex) return null;

  const handleConfirm = () => {
    setTeleportTarget(pendingEnex.target);
    clearPendingEnex();
  };

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        {/* Close button */}
        <button
          className={styles.closeBtn}
          onClick={clearPendingEnex}
          aria-label="Cancelar"
        >
          ✕
        </button>

        {/* Icon */}
        <div className={styles.icon}>⬦</div>

        {/* Text */}
        <p className={styles.question}>¿Querés ir a</p>
        <p className={styles.destination}>{pendingEnex.label}</p>
        <p className={styles.hint}>Pisaste una zona de teletransporte</p>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={clearPendingEnex}>
            Cancelar
          </button>
          <button className={styles.confirmBtn} onClick={handleConfirm}>
            Entrar
          </button>
        </div>
      </div>
    </div>
  );
}
