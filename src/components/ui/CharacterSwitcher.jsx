import { useEffect, useCallback } from 'react';
import useStore from '../../store/useStore';
import CHARACTERS from '../../data/characterConfig';

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
    <button
      onClick={openSelector}
      style={{
        position: 'absolute',
        bottom: 140,
        right: 20,
        pointerEvents: 'auto',
        background: 'rgba(69, 150, 233, 0.85)',
        color: '#fff',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontFamily: 'ui-monospace, Consolas, monospace',
        fontSize: '14px',
        fontWeight: 500,
        letterSpacing: '0.3px',
        transition: 'background 0.2s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(69, 150, 233, 1)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(69, 150, 233, 0.85)')}
    >
      {CHARACTERS[activeCharacter].name} (O)
    </button>
  );
}
