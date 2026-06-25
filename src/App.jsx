import { useCallback } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import Scene from './components/world/Scene';
import HUD from './components/ui/HUD';
import InfoCard from './components/ui/InfoCard';
import CharacterSelector from './components/ui/CharacterSelector';
import StartScreen from './components/ui/StartScreen';
import TutorialScreen from './components/ui/TutorialScreen';
import TouchControls from './components/ui/TouchControls';
import RotateDevice from './components/ui/RotateDevice';
import EnExConfirmModal from './components/ui/EnExConfirmModal';
import NetworkGame from './components/ui/NetworkGame';
import HackerGame from './components/ui/HackerGame';
import MarketingGame from './components/ui/MarketingGame';
import NameEntryModal from './components/ui/NameEntryModal';
import LeaderboardModal from './components/ui/LeaderboardModal';
import VideoModal from './components/ui/VideoModal';
import useStore from './store/useStore';
import { ensureResumed } from './services/audioContext';

function App() {
  const gameState = useStore((s) => s.gameState);
  const setGameState = useStore((s) => s.setGameState);
  const isSelectorOpen = useStore((s) => s.isSelectorOpen);

  const handleStart = useCallback(() => {
    ensureResumed();
    setGameState('tutorial');
  }, [setGameState]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Fase 4: Experiencia 3D (Se monta únicamente al entrar al juego) */}
      {gameState === 'game' && (
        <>
          <Canvas
            shadows={{ type: THREE.PCFShadowMap }}
            camera={{ fov: 60, near: 0.1, far: 1000, position: [0, 2, -5] }}
            dpr={[1, Math.min(1.5, window.devicePixelRatio)]}
            gl={{ antialias: true }}
            style={{ background: '#7ec8e3' }}
          >
            <Scene />
          </Canvas>

          {/* Controles y overlays in-game */}
          <TouchControls />
          <HUD />
          <InfoCard />
          <EnExConfirmModal />
        </>
      )}

      {/* Fase 1: Pantalla de inicio y carga */}
      {gameState === 'loading' && <StartScreen onStart={handleStart} />}

      {/* Fase 2: Tutorial de PaquitoBot (2D completo) */}
      {gameState === 'tutorial' && <TutorialScreen />}

      {/* Fase 3: Selección de personaje */}
      {/* Se monta desde el tutorial para precargar el Canvas 3D y los modelos en background.
           El modal solo se muestra cuando isSelectorOpen es true. */}
      {gameState !== 'loading' && <CharacterSelector />}

      {/* Minijuego 2D overlay de reconexión de red */}
      <NetworkGame />

      {/* Minijuego 2D overlay de ciberseguridad */}
      <HackerGame />

      {/* Minijuego 2D overlay de marketing */}
      <MarketingGame />

      {/* Modales de score y podio */}
      <NameEntryModal />
      <LeaderboardModal />

      {/* Modal de video YouTube */}
      <VideoModal />

      {/* Overlay de orientación para móviles */}
      <RotateDevice />
    </div>
  );
}

export default App;

