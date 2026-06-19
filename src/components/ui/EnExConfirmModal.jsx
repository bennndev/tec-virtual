import { useEffect } from 'react';
import useStore from '../../store/useStore';
import styles from './EnExConfirmModal.module.css';

export default function EnExConfirmModal() {
  const pendingEnex = useStore((s) => s.pendingEnex);

  // Close on Escape key
  useEffect(() => {
    if (!pendingEnex) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') useStore.setState({ pendingEnex: null });
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [pendingEnex]);

  if (!pendingEnex) return null;

  const handleCancel = () => useStore.setState({ pendingEnex: null });

  const handleConfirm = () => {
    // One atomic write: teleport + close modal + reset cooldown for a fresh 5s
    // window from THIS exact moment. Since Zustand setState is synchronous, the
    // very next useFrame in EnExLights will see enexBlockedUntil already updated
    // and skip detection — no timing gap, no immediate re-trigger on landing.
    useStore.setState({
      teleportTarget: pendingEnex.target,
      pendingEnex: null,
      enexBlockedUntil: Date.now() + 5000,
    });
  };

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        {/* Close button */}
        <button
          className={styles.closeBtn}
          onClick={handleCancel}
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
          <button className={styles.cancelBtn} onClick={handleCancel}>
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
