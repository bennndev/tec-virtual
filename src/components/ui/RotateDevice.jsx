import { useEffect, useState } from 'react';
import styles from './RotateDevice.module.css';

/**
 * RotateDevice — Overlay que pide girar el dispositivo a horizontal.
 *
 * Se muestra solo en pantallas angostas en modo portrait.
 * Usa matchMedia para reaccionar a cambios de orientación sin resize events.
 */
export default function RotateDevice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 820px) and (orientation: portrait)');

    const check = () => setShow(mq.matches);
    check();

    mq.addEventListener('change', check);
    return () => mq.removeEventListener('change', check);
  }, []);

  if (!show) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <span className={styles.icon}>🔄</span>
        <h2 className={styles.title}>Girá tu dispositivo</h2>
        <p className={styles.text}>
          Esta experiencia está diseñada para verse en horizontal.
        </p>
        <div className={styles.phone}>
          <div className={styles.phoneInner} />
        </div>
      </div>
    </div>
  );
}
