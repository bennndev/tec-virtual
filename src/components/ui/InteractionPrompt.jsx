import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import useStore from '../../store/useStore';
import styles from './InteractionPrompt.module.css';

export default function InteractionPrompt() {
  const interactableNPC = useStore((s) => s.interactableNPC);
  const isDialogueActive = useStore((s) => s.isDialogueActive);
  const vitrineProximity = useStore((s) => s.vitrineProximity);
  const networkGameActive = useStore((s) => s.networkGameActive);
  const networkGameWon = useStore((s) => s.networkGameWon);
  const hackerGameProximity = useStore((s) => s.hackerGameProximity);
  const hackerGameActive = useStore((s) => s.hackerGameActive);
  const hackerGameWon = useStore((s) => s.hackerGameWon);
  const marketingGameProximity = useStore((s) => s.marketingGameProximity);
  const marketingGameActive = useStore((s) => s.marketingGameActive);
  const marketingGameWon = useStore((s) => s.marketingGameWon);
  const tvRedesProximity = useStore((s) => s.tvRedesProximity);
  const tvMarketingProximity = useStore((s) => s.tvMarketingProximity);
  const tvVideoUrl = useStore((s) => s.tvVideoUrl);
  const containerRef = useRef(null);

  const showVitrinePrompt = vitrineProximity && !networkGameWon && !networkGameActive;
  const showHackerPrompt = hackerGameProximity && !hackerGameWon && !hackerGameActive;
  const showMarketingPrompt = marketingGameProximity && !marketingGameWon && !marketingGameActive;
  const showTvRedesPrompt = tvRedesProximity && !tvVideoUrl;
  const showTvMarketingPrompt = tvMarketingProximity && !tvVideoUrl;

  const shouldShow = interactableNPC || showVitrinePrompt || showHackerPrompt || showMarketingPrompt || showTvRedesPrompt || showTvMarketingPrompt;

  useEffect(() => {
    if (containerRef.current && shouldShow && !isDialogueActive) {
      gsap.fromTo(containerRef.current,
        { scale: 0.8, opacity: 0, y: 10 },
        { scale: 1, opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.5)" }
      );
    }
  }, [shouldShow, isDialogueActive]);

  if (isDialogueActive) return null;

  // Tap en el prompt = simular tecla E (funciona en mobile)
  const handleTap = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' }));
  };

  if (showVitrinePrompt) {
    return (
      <div className={styles.prompt} ref={containerRef} onClick={handleTap} onTouchEnd={(e) => { e.preventDefault(); handleTap(); }}>
        <span className={styles.key}>E</span>
        <span>Reparar Internet</span>
      </div>
    );
  }

  if (showHackerPrompt) {
    return (
      <div className={styles.prompt} ref={containerRef} onClick={handleTap} onTouchEnd={(e) => { e.preventDefault(); handleTap(); }}>
        <span className={styles.key}>E</span>
        <span>Defender Ataque Hacker</span>
      </div>
    );
  }

  if (showMarketingPrompt) {
    return (
      <div className={styles.prompt} ref={containerRef} onClick={handleTap} onTouchEnd={(e) => { e.preventDefault(); handleTap(); }}>
        <span className={styles.key}>E</span>
        <span>Gestionar Crisis — Marketing</span>
      </div>
    );
  }

  if (showTvRedesPrompt) {
    return (
      <div className={styles.prompt} ref={containerRef} onClick={handleTap} onTouchEnd={(e) => { e.preventDefault(); handleTap(); }}>
        <span className={styles.key}>E</span>
        <span>Ver video — Redes</span>
      </div>
    );
  }

  if (showTvMarketingPrompt) {
    return (
      <div className={styles.prompt} ref={containerRef} onClick={handleTap} onTouchEnd={(e) => { e.preventDefault(); handleTap(); }}>
        <span className={styles.key}>E</span>
        <span>Ver video — Marketing</span>
      </div>
    );
  }

  if (!interactableNPC) return null;

  return (
    <div className={styles.prompt} ref={containerRef} onClick={handleTap} onTouchEnd={(e) => { e.preventDefault(); handleTap(); }}>
      <span className={styles.key}>E</span>
      <span>Hablar con {interactableNPC.name}</span>
    </div>
  );
}
