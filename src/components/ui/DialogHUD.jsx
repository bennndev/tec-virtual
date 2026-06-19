import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import useStore from '../../store/useStore';
import ClayButton from './ClayButton';
import styles from './DialogHUD.module.css';

export default function DialogHUD({ variant = 'overlay' }) {
  const isDialogueActive = useStore((s) => s.isDialogueActive);
  const dialogueQueue = useStore((s) => s.dialogueQueue);
  const currentDialogueIndex = useStore((s) => s.currentDialogueIndex);
  const activeDialogueNPC = useStore((s) => s.activeDialogueNPC);
  const nextDialogue = useStore((s) => s.nextDialogue);
  const previousDialogue = useStore((s) => s.previousDialogue);
  const skipDialogue = useStore((s) => s.skipDialogue);
  const endDialogue = useStore((s) => s.endDialogue);
  const gameState = useStore((s) => s.gameState);

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

  const overlayClass = variant === 'inline' ? styles.overlayInline : styles.overlay;

  return (
    <div className={overlayClass} ref={containerRef}>
      {gameState !== 'tutorial' && (
        <ClayButton 
          className={styles.closeButton} 
          onClick={endDialogue}
          aria-label="Cerrar diálogo"
        >
          ✕
        </ClayButton>
      )}

      <div className={styles.body}>
        <h3 className={styles.speakerName}>
          {activeDialogueNPC ? activeDialogueNPC.name : 'Sistema'}
        </h3>
        <p className={styles.dialogueText}>
          {dialogueQueue[currentDialogueIndex]}
        </p>
      </div>

      <div className={styles.actions}>
        {currentDialogueIndex < dialogueQueue.length - 1 ? (
          <ClayButton
            variant="cyan-light"
            onClick={skipDialogue}
            className={styles.skipBtn}
          >
            Saltar
          </ClayButton>
        ) : (
          <div />
        )}

        <div className={styles.rightActions}>
          {currentDialogueIndex > 0 && (
            <ClayButton
              variant="cyan-light"
              onClick={previousDialogue}
              className={styles.actionBtn}
            >
              Retroceder
            </ClayButton>
          )}
          
          <ClayButton
            variant="cyan-solid"
            onClick={nextDialogue}
            className={styles.actionBtn}
          >
            {currentDialogueIndex === dialogueQueue.length - 1
              ? (gameState === 'tutorial' ? 'Elegir Personaje' : 'Finalizar')
              : 'Avanzar'}
          </ClayButton>
        </div>
      </div>
    </div>
  );
}
