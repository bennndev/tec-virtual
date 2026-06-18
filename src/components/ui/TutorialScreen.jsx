import { useEffect } from 'react';
import useStore from '../../store/useStore';
import DialogHUD from './DialogHUD';
import styles from './TutorialScreen.module.css';

const TUTORIAL_DIALOGUES = [
  "¡Hola! Soy PaquitoBot, tu asistente virtual. ¡Te doy la bienvenida a TecVirtual!",
  "Para moverte por el campus, usa las teclas W, A, S, D o las flechas de dirección de tu teclado.",
  "Para esquivar obstáculos o subir escalones altos, puedes saltar presionando la barra ESPACIADORA.",
  "Si tienes prisa, mantén presionada la tecla SHIFT mientras te mueves para correr rápidamente.",
  "Al presionar la tecla M podrás abrir y cerrar el mapa interactivo del campus para guiarte.",
  "Por último, si quieres conversar con algún compañero o profesor, acércate y presiona la tecla E.",
  "¡Excelente! Eso es todo. Antes de ingresar al campus 3D, por favor selecciona tu personaje."
];

// Mapea el índice del diálogo al SVG correspondiente de PaquitoBot
const ROBOT_SVGS = [
  '/paquito/paquito-main.svg',     // Bienvenida
  '/paquito/paquito-config.svg',   // Movimiento
  '/paquito/paquito_devising.svg', // Salto
  '/paquito/paquito-timer.svg',    // Correr
  '/paquito/paquito-reading.svg',  // Mapa
  '/paquito/paquito-talking.svg',  // Conversar
  '/paquito/paquito-celebrate.svg' // Selección personaje
];

export default function TutorialScreen() {
  const currentDialogueIndex = useStore((s) => s.currentDialogueIndex);
  const startDialogue = useStore((s) => s.startDialogue);

  // Iniciar diálogos al montar el componente
  useEffect(() => {
    startDialogue(TUTORIAL_DIALOGUES, { name: 'PaquitoBot' });
  }, [startDialogue]);

  const activeSvg = ROBOT_SVGS[currentDialogueIndex] || ROBOT_SVGS[0];

  // Identificamos cuál control se está explicando para resaltarlo
  const getHighlightClass = (cardIndex) => {
    return currentDialogueIndex === cardIndex ? `${styles.controlCard} ${styles.controlCardActive}` : styles.controlCard;
  };

  return (
    <div className={styles.tutorialContainer}>
      {/* Atajos de teclado visuales en la parte superior */}
      <div className={styles.controlsPreview}>
        <div className={getHighlightClass(1)}>
          <span className={styles.keyLabel}>W, A, S, D</span>
          <span className={styles.keyText}>Moverse</span>
        </div>
        <div className={getHighlightClass(2)}>
          <span className={styles.keyLabel}>ESPACIO</span>
          <span className={styles.keyText}>Saltar</span>
        </div>
        <div className={getHighlightClass(3)}>
          <span className={styles.keyLabel}>SHIFT</span>
          <span className={styles.keyText}>Correr</span>
        </div>
        <div className={getHighlightClass(4)}>
          <span className={styles.keyLabel}>M</span>
          <span className={styles.keyText}>Mapa</span>
        </div>
        <div className={getHighlightClass(5)}>
          <span className={styles.keyLabel}>E</span>
          <span className={styles.keyText}>Interactuar</span>
        </div>
      </div>

      {/* Robot PaquitoBot flotando en el centro */}
      <div className={styles.robotWrapper}>
        <img
          src={activeSvg}
          alt="PaquitoBot"
          className={styles.robotImage}
        />
        <div className={styles.robotShadow} />
      </div>

      {/* HUD de diálogos overlayed abajo */}
      <DialogHUD />
    </div>
  );
}
