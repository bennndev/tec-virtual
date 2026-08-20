import { useEffect } from 'react';
import useStore from '../../store/useStore';
import ClayButton from './ClayButton';
import ClayIcon from './ClayIcon';
import styles from './CoinPopup.module.css';

export default function CoinPopup() {
  const coinPopup = useStore((s) => s.coinPopup);
  const closeCoinPopup = useStore((s) => s.closeCoinPopup);

  useEffect(() => {
    if (!coinPopup) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') closeCoinPopup();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [coinPopup, closeCoinPopup]);

  if (!coinPopup) return null;

  return (
    <div className={styles.backdrop} onClick={closeCoinPopup}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <ClayButton
          className={styles.closeBtn}
          onClick={closeCoinPopup}
          aria-label="Cerrar"
        >
          ✕
        </ClayButton>

        <ClayIcon name="monetization_on" className={styles.icon} />

        <p className={styles.kicker}>¿Sabías que…?</p>
        <h2 className={styles.title}>{coinPopup.title}</h2>
        <p className={styles.body}>{coinPopup.body}</p>

        <div className={styles.actions}>
          <ClayButton variant="cyan-solid" onClick={closeCoinPopup}>
            Continuar
          </ClayButton>
        </div>
      </div>
    </div>
  );
}
