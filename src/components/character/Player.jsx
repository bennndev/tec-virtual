import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import Ecctrl, { EcctrlAnimation } from 'ecctrl';
import { KeyboardControls, useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import useStore from '../../store/useStore';
import CHARACTERS from '../../data/characterConfig';
import npcsData from '../../data/npcs.json';
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

  // Navegación
  const navigationTarget = useStore((s) => s.navigationTarget);
  const isNavigating = useStore((s) => s.isNavigating);
  const clearNavigation = useStore((s) => s.clearNavigation);

  const vec = useRef(new THREE.Vector3());

  // Estado en vivo de las teclas
  const jumpPressed = useKeyboardControls((state) => state.jump);
  const runPressed = useKeyboardControls((state) => state.run);

  // En overview o intro, ecctrl suelta la cámara
  const disableFollowCam = cameraMode === 'overview' || isIntro;
  const config = CHARACTERS[activeCharacter];

  const setPlayerRotation = useStore((s) => s.setPlayerRotation);
  const quat = useRef(new THREE.Quaternion());
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));

  useFrame(({ camera }) => {
    // Sincronizar posición al store (siempre, para HUD y CameraRig)
    if (posRef.current) {
      posRef.current.getWorldPosition(vec.current);
      setPlayerPosition({ x: vec.current.x, y: vec.current.y, z: vec.current.z });
      
      // Obtener la rotación física real del modelo (orientación de WASD)
      posRef.current.getWorldQuaternion(quat.current);
      euler.current.setFromQuaternion(quat.current);
      
      // Ajuste de offset: el modelo en ecctrl suele tener la cara apuntando a +Z local,
      // y Math.PI lo alinea correctamente con la flecha del minimapa.
      setPlayerRotation(euler.current.y + Math.PI);

      // Detección de llegada al destino
      if (isNavigating && navigationTarget) {
        const dx = navigationTarget.x - vec.current.x;
        const dz = navigationTarget.z - vec.current.z;
        const distSq = dx * dx + dz * dz;
        // Si está a menos de 3.5 metros (12.25 = 3.5^2), consideramos que llegó
        if (distSq < 12.25) {
          console.log('¡Destino alcanzado!');
          
          const targetName = navigationTarget.name;
          useStore.getState().setArrivalTargetName(targetName);
          
          clearNavigation();

          // Quitar la tarjeta después de 4 segundos
          setTimeout(() => {
            useStore.getState().setArrivalTargetName(null);
          }, 4000);
        }
      }
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

  // Teclas F y E
  useEffect(() => {
    const handler = (e) => {
      const state = useStore.getState();

      if (e.code === 'KeyF') {
        e.preventDefault();
        const next = !state.flyMode;
        setFlyMode(next);
        console.log(`[Fly] Modo ${next ? 'vuelo' : 'normal'} — F para alternar`);
        return;
      }

      if (e.code === 'KeyE') {
        if (state.isDialogueActive) {
          state.nextDialogue();
        } else if (state.interactableNPC) {
          if (state.interactableNPC.id === 'paquito-bot') {
            state.startDialogue([
              "¡Hola! Soy PaquitoBot 🤖",
              "Te acompañaré durante esta experiencia virtual por Tecsup.",
              "Hoy conocerás una de nuestras carreras tecnológicas de una manera diferente.",
              "Pero antes necesito ayudarte a crear tu identidad virtual.",
              "Selecciona el personaje que te representará durante esta visita."
            ]);
          } else {
            state.startDialogue([
              "¡Hola! Soy " + state.interactableNPC.name + ".",
              state.interactableNPC.description
            ]);
          }
        }
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
