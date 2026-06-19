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
import EnExConfirmModal from './components/ui/EnExConfirmModal';
import NetworkGame from './components/ui/NetworkGame';
import useStore from './store/useStore';

function App() {
  const gameState = useStore((s) => s.gameState);
  const setGameState = useStore((s) => s.setGameState);
  const isSelectorOpen = useStore((s) => s.isSelectorOpen);

  const handleStart = useCallback(() => {
    // Al hacer click en INICIAR, transicionamos a la fase de tutorial con PaquitoBot
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
            dpr={[1, 2]}
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

      {/* Fase 3: Selección de personaje (Vista completa 2D con Canvas 3D aislado de preview) */}
      {/* También se permite abrirlo en in-game desde el HUD mediante isSelectorOpen */}
      {(gameState === 'character_select' || isSelectorOpen) && (
        <CharacterSelector />
      )}

      {/* Minijuego 2D overlay de reconexión de red */}
      <NetworkGame />
    </div>
  );
}

export default App;

