import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './components/world/Scene';
import HUD from './components/ui/HUD';
import InfoCard from './components/ui/InfoCard';
import CharacterSelector from './components/ui/CharacterSelector';
import StartScreen from './components/ui/StartScreen';

function App() {
  const [started, setStarted] = useState(false);

  if (!started) {
    return <StartScreen onStart={() => setStarted(true)} />;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Canvas
        shadows
        camera={{ fov: 60, near: 0.1, far: 1000, position: [0, 2, -5] }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
        style={{ background: '#7ec8e3' }}
      >
        <Scene />
      </Canvas>
      
      {/* HUD de Coordenadas y FPS */}
      <HUD />
      <InfoCard />
      <CharacterSelector />
    </div>
  );
}

export default App;
