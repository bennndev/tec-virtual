import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import useStore from '../../store/useStore';

export default function InfoCard() {
  const hoveredObject = useStore((s) => s.hoveredObject);
  const cardRef = useRef(null);
  const tlRef = useRef(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    if (tlRef.current) {
      tlRef.current.kill();
    }

    if (hoveredObject) {
      // Animacion de entrada — aparece desde arriba con fade
      tlRef.current = gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.35,
        ease: 'power2.out',
      });
    } else {
      // Animacion de salida — se desvanece y sube ligeramente
      tlRef.current = gsap.to(el, {
        opacity: 0,
        y: -12,
        duration: 0.25,
        ease: 'power2.in',
      });
    }

    return () => {
      if (tlRef.current) tlRef.current.kill();
    };
  }, [hoveredObject]);

  return (
    <div
      ref={cardRef}
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 100,
        pointerEvents: 'none',
        opacity: 0,
        transform: 'translateY(-12px)',
        background: 'rgba(16, 16, 32, 0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        padding: '16px 20px',
        borderRadius: '10px',
        maxWidth: '280px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        fontFamily: 'ui-monospace, Consolas, monospace',
        color: '#fff',
        lineHeight: 1.5,
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: '15px',
          fontWeight: 600,
          letterSpacing: '0.3px',
          color: hoveredObject ? '#e94560' : 'transparent',
          transition: 'color 0.2s',
        }}
      >
        {hoveredObject?.name ?? ''}
      </h3>
      <p
        style={{
          margin: '8px 0 0',
          fontSize: '13px',
          opacity: 0.85,
          color: '#ddd',
        }}
      >
        {hoveredObject?.description ?? ''}
      </p>
    </div>
  );
}
