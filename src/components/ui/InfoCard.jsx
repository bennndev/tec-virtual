import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import useStore from '../../store/useStore';
import ClayIcon from './ClayIcon';
import styles from './InfoCard.module.css';

export default function InfoCard() {
  const hoveredObject = useStore((s) => s.hoveredObject);
  const arrivalTargetName = useStore((s) => s.arrivalTargetName);
  
  const cardRef = useRef(null);
  const tlRef = useRef(null);
  const xTo = useRef(null);
  const yTo = useRef(null);

  // Inicializar quickTo y escuchar el movimiento del mouse globalmente para evitar saltos de posición al aparecer
  useEffect(() => {
    if (!cardRef.current) return;

    xTo.current = gsap.quickTo(cardRef.current, "x", { duration: 0.2, ease: "power3.out" });
    yTo.current = gsap.quickTo(cardRef.current, "y", { duration: 0.2, ease: "power3.out" });

    const handleMouseMove = (e) => {
      // Offset de 20px para que no quede exactamente debajo del cursor
      xTo.current(e.clientX + 20);
      yTo.current(e.clientY + 20);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    if (tlRef.current) {
      tlRef.current.kill();
    }

    if (hoveredObject) {
      // Entrada — aparece desde la posición del cursor con escala y fade
      tlRef.current = gsap.to(el, {
        opacity: 1,
        scale: 1,
        duration: 0.35,
        ease: 'back.out(1.5)',
      });
    } else {
      // Salida — se desvanece y achica ligeramente
      tlRef.current = gsap.to(el, {
        opacity: 0,
        scale: 0.8,
        duration: 0.25,
        ease: 'power2.in',
      });
    }

    return () => {
      if (tlRef.current) tlRef.current.kill();
    };
  }, [hoveredObject]);

  // Si hay un mensaje de llegada activo, renderizamos una tarjeta fija
  if (arrivalTargetName) {
    return (
      <div className={`${styles.card} ${styles.arrival}`}>
        <div className={styles.body}>
          <div className={styles.content}>
            <h4 className={styles.title}>
              ¡Llegaste a tu destino!
            </h4>
            <p className={styles.desc}>
              Has llegado correctamente a: <strong>{arrivalTargetName}</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={cardRef} className={styles.card}>
      <div className={styles.body}>
        <ClayIcon name="info" className={styles.iconWrap} />

        <div className={styles.content}>
          <h4 className={styles.title}>
            {hoveredObject?.name ?? ''}
          </h4>
          <p className={styles.desc}>
            {hoveredObject?.description ?? ''}
          </p>
        </div>
      </div>
    </div>
  );
}
