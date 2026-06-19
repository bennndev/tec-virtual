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
  const containerRef = useRef(null);

  const showVitrinePrompt = vitrineProximity && !networkGameWon && !networkGameActive;

  useEffect(() => {
    if (containerRef.current && (interactableNPC || showVitrinePrompt) && !isDialogueActive) {
      gsap.fromTo(containerRef.current,
        { scale: 0.8, opacity: 0, y: 10 },
        { scale: 1, opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.5)" }
      );
    }
  }, [interactableNPC, showVitrinePrompt, isDialogueActive]);

  if (isDialogueActive) return null;

  if (showVitrinePrompt) {
    return (
      <div className={styles.prompt} ref={containerRef}>
        <span className={styles.key}>E</span>
        <span>Reparar Internet</span>
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
