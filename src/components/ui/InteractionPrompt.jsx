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
  const containerRef = useRef(null);

  const showVitrinePrompt = vitrineProximity && !networkGameWon && !networkGameActive;
  const showHackerPrompt = hackerGameProximity && !hackerGameWon && !hackerGameActive;

  const shouldShow = interactableNPC || showVitrinePrompt || showHackerPrompt;

  useEffect(() => {
    if (containerRef.current && shouldShow && !isDialogueActive) {
      gsap.fromTo(containerRef.current,
        { scale: 0.8, opacity: 0, y: 10 },
        { scale: 1, opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.5)" }
      );
    }
  }, [shouldShow, isDialogueActive]);

  if (isDialogueActive) return null;

  if (showVitrinePrompt) {
    return (
      <div className={styles.prompt} ref={containerRef}>
        <span className={styles.key}>E</span>
        <span>Reparar Internet</span>
      </div>
    );
  }

  if (showHackerPrompt) {
    return (
      <div className={styles.prompt} ref={containerRef}>
        <span className={styles.key}>E</span>
        <span>Defender Ataque Hacker</span>
      </div>
    );
  }

  if (!interactableNPC) return null;

  return (
    <div className={styles.prompt} ref={containerRef}>
      <span className={styles.key}>E</span>
      <span>Hablar con {interactableNPC.name}</span>
    </div>
  );
}
