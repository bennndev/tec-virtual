import { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './components/world/Scene';
import HUD from './components/ui/HUD';
import InfoCard from './components/ui/InfoCard';
import CharacterSelector from './components/ui/CharacterSelector';
import StartScreen from './components/ui/StartScreen';
import TouchControls from './components/ui/TouchControls';
import useStore from './store/useStore';

function App() {
  const [started, setStarted] = useState(false);

  const handleStart = useCallback(() => {
    setStarted(true);
    // Disparar la animación de intro de cámara
    useStore.getState().setIntro();
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Canvas siempre montado → WebGL/Rapier/shaders se inicializan en background */}
      <Canvas
        shadows
        camera={{ fov: 60, near: 0.1, far: 1000, position: [0, 2, -5] }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
        style={{ background: '#7ec8e3' }}
      >
        <Scene />
      </Canvas>

      {/* Controles táctiles — joystick + botones, fuera del Canvas */}
      <TouchControls />

      {/* Overlays — solo visibles después de iniciar */}
      {started && (
        <>
          <HUD />
          <InfoCard />
          <CharacterSelector />
        </>
      )}

      {/* Pantalla de inicio — cubre todo hasta que el usuario inicie */}
      {!started && <StartScreen onStart={handleStart} />}
    </div>
  );
}

export default App;
