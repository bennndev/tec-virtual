import { useEffect } from 'react';
import useStore from '../../store/useStore';
import { isMovementLocked } from '../../store/overlayLock';
import styles from './EnExConfirmModal.module.css';
import ClayButton from './ClayButton';

export default function EnExConfirmModal() {
  const pendingEnex = useStore((s) => s.pendingEnex);

  const closeEnex = (extra = {}) => {
    const state = useStore.getState();
    const next = { pendingEnex: null, ...extra };
    useStore.setState({
      ...next,
      controlsDisabled: isMovementLocked({ ...state, ...next }),
    });
  };

  useEffect(() => {
    if (!pendingEnex) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        closeEnex({ enexBlockedUntil: Date.now() + 5000 });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [pendingEnex]);

  if (!pendingEnex) return null;

  const handleCancel = () => closeEnex({ enexBlockedUntil: Date.now() + 5000 });

  const handleConfirm = () => {
    // One atomic write: teleport + close modal + reset cooldown for a fresh 5s
    // window from THIS exact moment. Since Zustand setState is synchronous, the
    // very next useFrame in EnExLights will see enexBlockedUntil already updated
    // and skip detection — no timing gap, no immediate re-trigger on landing.
    useStore.setState({
      teleportTarget: pendingEnex.target,
      pendingEnex: null,
      enexBlockedUntil: Date.now() + 5000,
      controlsDisabled: isMovementLocked({
        ...useStore.getState(),
        pendingEnex: null,
      }),
    });
  };

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        {/* Close button */}
        <ClayButton
          className={styles.closeBtn}
          onClick={handleCancel}
          aria-label="Cancelar"
        >
          ✕
        </ClayButton>

        {/* Icon */}
        <div className={styles.icon}>⬦</div>

        {/* Text */}
        <p className={styles.question}>¿Quieres ir a</p>
        <p className={styles.destination}>{pendingEnex.label}</p>
        <p className={styles.hint}>Has entrado a una zona de teletransporte</p>

        {/* Actions */}
        <div className={styles.actions}>
          <ClayButton variant="cyan-light" onClick={handleCancel}>
            Cancelar
          </ClayButton>
          <ClayButton variant="cyan-solid" onClick={handleConfirm}>
            Entrar
          </ClayButton>
        </div>
      </div>
    </div>
  );
}
