import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import Ecctrl, { EcctrlAnimation } from 'ecctrl';
import { KeyboardControls, useKeyboardControls } from '@react-three/drei';
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

const FLY_SPEED = 3;
const FLY_HORIZONTAL_SPEED = 3;

function Character() {
  const ecctrlRef = useRef();
  const posRef = useRef();
  const setPlayerPosition = useStore((s) => s.setPlayerPosition);
  const activeCharacter = useStore((s) => s.activeCharacter);
  const cameraMode = useStore((s) => s.cameraMode);
  const isIntro = useStore((s) => s.isIntro);
  const controlsDisabled = useStore((s) => s.controlsDisabled);
  const flyMode = useStore((s) => s.flyMode);

  const vec = useRef(new THREE.Vector3());

  // Estado en vivo de las teclas
  const jumpPressed = useKeyboardControls((state) => state.jump);
  const runPressed = useKeyboardControls((state) => state.run);

  // En overview o intro, ecctrl suelta la cámara
  const disableFollowCam = cameraMode === 'overview' || isIntro;
  const config = CHARACTERS[activeCharacter];

  useFrame(() => {
    // Sincronizar posición al store (siempre, para HUD y CameraRig)
    if (posRef.current) {
      posRef.current.getWorldPosition(vec.current);
      setPlayerPosition({ x: vec.current.x, y: vec.current.y, z: vec.current.z });
    }

    // --- MECÁNICA DE VUELO ---
    // Sobreescribimos la velocidad vertical directamente en el RigidBody de Rapier.
    if (flyMode && ecctrlRef.current?.group) {
      const rb = ecctrlRef.current.group;
      const vel = rb.linvel();

      if (jumpPressed) {
        vel.y = FLY_SPEED;         // Space → subir
      } else if (runPressed) {
        vel.y = -FLY_SPEED;        // Shift → bajar
      } else {
        vel.y = 0;                 // hover: no caer
      }

      rb.setLinvel(vel, true);
    }
  });

  return (
    <Ecctrl
      ref={ecctrlRef}
      animated
      position={[62.12, 10.10, -98.97]}
      disableFollowCam={disableFollowCam}
      disableControl={controlsDisabled}
      capsuleHalfHeight={0.35}
      capsuleRadius={0.3}
      floatHeight={0.08}
      maxVelLimit={flyMode ? FLY_HORIZONTAL_SPEED : 3}
      sprintMult={flyMode ? 1 : 1.8}
      jumpVel={flyMode ? 0 : 4}
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
  const setFlyMode = useStore((s) => s.setFlyMode);

  // Tecla F: toggle fly mode
  useEffect(() => {
    const handler = (e) => {
      if (e.code === 'KeyF') {
        e.preventDefault();
        const next = !useStore.getState().flyMode;
        setFlyMode(next);
        console.log(`[Fly] Modo ${next ? 'vuelo' : 'normal'} — F para alternar`);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setFlyMode]);

  return (
    <KeyboardControls map={keyboardMap}>
      <Character />
    </KeyboardControls>
  );
}
