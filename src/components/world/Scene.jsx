import { Suspense } from 'react';
import { Physics } from '@react-three/rapier';
import SceneEnvironment from './SceneEnvironment';
import Player from '../character/Player';
import NPCs from '../character/NPCs';
import CameraRig from '../character/CameraRig';
import Coins from './Coins';
import VitrineInteraction from './VitrineInteraction';
import HackerGameInteraction from './HackerGameInteraction';
import MarketingGameInteraction from './MarketingGameInteraction';
import ChessLeaderboard from './ChessLeaderboard';
import TvInteraction from './TvInteraction';
import PointerLock from '../controls/PointerLock';
import BackgroundMusic from '../audio/BackgroundMusic';
import TeleportOverlays from './TeleportOverlays';
import EnExLights from './EnExLights';

export default function Scene() {
  return (
    <>
      {/* Iluminación de día */}
      <hemisphereLight
        args={['#87ceeb', '#98d8a0', 1.2]}
      />
      <directionalLight
        position={[15, 20, 10]}
        intensity={2.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <ambientLight intensity={0.5} />

      <Suspense fallback={null}>
        <Physics gravity={[0, -9.81, 0]} timeStep="vary">
          <SceneEnvironment />
          <Player />
          <NPCs />
        </Physics>
        <Coins />
      </Suspense>

      <CameraRig />
      <TeleportOverlays />
      <EnExLights />
      <VitrineInteraction />
      <HackerGameInteraction />
      <MarketingGameInteraction />
      <ChessLeaderboard />
      <TvInteraction />
      <PointerLock />
      <BackgroundMusic />
    </>
  );
}
