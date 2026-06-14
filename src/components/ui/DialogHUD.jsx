import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import useStore from '../../store/useStore';
import styles from './DialogHUD.module.css';

export default function DialogHUD() {
  const isDialogueActive = useStore((s) => s.isDialogueActive);
  const dialogueQueue = useStore((s) => s.dialogueQueue);
  const currentDialogueIndex = useStore((s) => s.currentDialogueIndex);
  const interactableNPC = useStore((s) => s.interactableNPC);
  const nextDialogue = useStore((s) => s.nextDialogue);

  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    if (isDialogueActive) {
      gsap.fromTo(containerRef.current, 
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: "back.out(1.2)" }
      );
    }
  }, [isDialogueActive, currentDialogueIndex]);

  if (!isDialogueActive || dialogueQueue.length === 0) return null;

  return (
    <div className={styles.overlay} ref={containerRef} onClick={nextDialogue}>
      <h3 className={styles.speakerName}>
        {interactableNPC ? interactableNPC.name : 'Sistema'}
      </h3>
      <p className={styles.dialogueText}>
        {dialogueQueue[currentDialogueIndex]}
      </p>
      <div className={styles.continueHint}>
        Presiona [E] o Click para continuar ▼
      </div>
    </div>
  );
}
