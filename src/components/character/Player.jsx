import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import Ecctrl, { EcctrlAnimation } from 'ecctrl';
import { KeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import useStore from '../../store/useStore';
import CHARACTERS from '../../data/characterConfig';
import CharacterModel from './CharacterModel';

const keyboardMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'rightward', keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'run', keys: ['Shift'] },
];

function Character() {
  const posRef = useRef();
  const setPlayerPosition = useStore((s) => s.setPlayerPosition);
  const activeCharacter = useStore((s) => s.activeCharacter);
  const cameraMode = useStore((s) => s.cameraMode);
  const isIntro = useStore((s) => s.isIntro);
  const controlsDisabled = useStore((s) => s.controlsDisabled);

  const vec = useRef(new THREE.Vector3());

  // En overview o intro, ecctrl suelta la cámara
  const disableFollowCam = cameraMode === 'overview' || isIntro;
  const config = CHARACTERS[activeCharacter];

  useFrame(() => {
    if (posRef.current) {
      posRef.current.getWorldPosition(vec.current);
      setPlayerPosition({ x: vec.current.x, y: vec.current.y, z: vec.current.z });
    }
  });

  return (
    <Ecctrl
      animated
      disableFollowCam={disableFollowCam}
      disableControl={controlsDisabled}
      capsuleHalfHeight={0.35}
      capsuleRadius={0.3}
      floatHeight={0.08}
      maxVelLimit={3}
      sprintMult={1.8}
      jumpVel={4}
      camInitDis={-5}
      camMaxDis={-7}
      camMinDis={-0.7}
      camMoveSpeed={1}
      camZoomSpeed={1}
      camFollowMult={80}
      camLerpMult={100}
    >
      <group ref={posRef}>
        <EcctrlAnimation
          key={activeCharacter}
          characterURL={config.modelUrl}
          animationSet={config.animationSet}
        >
          <group position={[0, config.offsetY, 0]}>
            <CharacterModel modelUrl={config.modelUrl} />
          </group>
        </EcctrlAnimation>
      </group>
    </Ecctrl>
  );
}

export default function Player() {
  return (
    <KeyboardControls map={keyboardMap}>
      <Character />
    </KeyboardControls>
  );
}
