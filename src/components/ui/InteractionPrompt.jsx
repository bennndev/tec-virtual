import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import useStore from '../../store/useStore';
import styles from './InteractionPrompt.module.css';

export default function InteractionPrompt() {
  const interactableNPC = useStore((s) => s.interactableNPC);
  const isDialogueActive = useStore((s) => s.isDialogueActive);
  const containerRef = useRef(null);

  useEffect(() => {
    if (interactableNPC && !isDialogueActive && containerRef.current) {
      gsap.fromTo(containerRef.current,
        { scale: 0.8, opacity: 0, y: 10 },
        { scale: 1, opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.5)" }
      );
    }
  }, [interactableNPC, isDialogueActive]);

  if (!interactableNPC || isDialogueActive) return null;

  return (
    <div className={styles.prompt} ref={containerRef}>
      <span className={styles.key}>E</span>
      <span>Hablar con {interactableNPC.name}</span>
    </div>
  );
}
