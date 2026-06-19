import { useEffect } from 'react';
import useStore from '../../store/useStore';

export default function CharacterSwitcher() {
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

  // Sin botón visual — solo el atajo de teclado O
  return null;
}
