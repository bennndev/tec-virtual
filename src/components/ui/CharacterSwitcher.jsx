import { useEffect, useCallback } from 'react';
import useStore from '../../store/useStore';
import ClayButton from './ClayButton';
import styles from './CharacterSwitcher.module.css';

export default function CharacterSwitcher() {
  const activeCharacter = useStore((s) => s.activeCharacter);
  const setSelectorOpen = useStore((s) => s.setSelectorOpen);
  const setPreviewCharacter = useStore((s) => s.setPreviewCharacter);

  // Tecla O: toggle del selector (único handler, evita conflicto con CharacterSelector)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code !== 'KeyO') return;

      const state = useStore.getState();
      if (state.isSelectorOpen) {
        state.setSelectorOpen(false);
      } else {
        state.setPreviewCharacter(state.activeCharacter);
        state.setSelectorOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setSelectorOpen, setPreviewCharacter]);

  const openSelector = useCallback(() => {
    setPreviewCharacter(activeCharacter);
    setSelectorOpen(true);
  }, [activeCharacter, setPreviewCharacter, setSelectorOpen]);

  return (
    <ClayButton
      onClick={openSelector}
      variant="cyan-solid"
      className={styles.switcherBtn}
    >
      Personaje (O)
    </ClayButton>
  );
}
