import { useCallback, useEffect } from 'react';
import useStore from '../../store/useStore';
import CHARACTERS from '../../data/characterConfig';

const characterIds = Object.keys(CHARACTERS);

export default function CharacterSwitcher() {
  const activeCharacter = useStore((s) => s.activeCharacter);
  const setActiveCharacter = useStore((s) => s.setActiveCharacter);

  const handleSwitch = useCallback(() => {
    const currentIndex = characterIds.indexOf(activeCharacter);
    const nextIndex = (currentIndex + 1) % characterIds.length;
    setActiveCharacter(characterIds[nextIndex]);
  }, [activeCharacter, setActiveCharacter]);

  // Tecla O para cambiar de personaje
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === 'KeyO') handleSwitch();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSwitch]);

  return (
    <button
      onClick={handleSwitch}
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
