import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import Ecctrl, { EcctrlAnimation } from 'ecctrl';
import { KeyboardControls, useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import useStore from '../../store/useStore';
import CHARACTERS, { CHARACTER_INIT_DIR, CAM_INIT_DIR, CHARACTER_INIT_POS } from '../../data/characterConfig';
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
  const [spawnPos, setSpawnPos] = useState(CHARACTER_INIT_POS);
  const posRef = useRef();
  const setPlayerPosition = useStore((s) => s.setPlayerPosition);
  const activeCharacter = useStore((s) => s.activeCharacter);
  const cameraMode = useStore((s) => s.cameraMode);
  const isIntro = useStore((s) => s.isIntro);
  const isTransitioningCamera = useStore((s) => s.isTransitioningCamera);
  const controlsDisabled = useStore((s) => s.controlsDisabled);
  const flyMode = useStore((s) => s.flyMode);

  // Navegación
  const navigationTarget = useStore((s) => s.navigationTarget);
  const isNavigating = useStore((s) => s.isNavigating);
  const clearNavigation = useStore((s) => s.clearNavigation);

  const spawnFrames = useRef(0);
  const postTeleportFrames = useRef(-1);
  const vec = useRef(new THREE.Vector3());

  // Estado en vivo de las teclas
  const jumpPressed = useKeyboardControls((state) => state.jump);
  const runPressed = useKeyboardControls((state) => state.run);

  // En overview o intro o transición de cámara, ecctrl suelta la cámara para evitar tirones
  const disableFollowCam = cameraMode === 'overview' || isIntro || isTransitioningCamera;
  const config = CHARACTERS[activeCharacter];

  const setPlayerRotation = useStore((s) => s.setPlayerRotation);
  const quat = useRef(new THREE.Quaternion());
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));

  useFrame(() => {
    // Estabilizar el RigidBody al inicio para dar tiempo a cargar el trimesh físico del campus
    if (spawnFrames.current < 60) {
      if (ecctrlRef.current?.group) {
        const rb = ecctrlRef.current.group;
        rb.setTranslation({ x: CHARACTER_INIT_POS[0], y: CHARACTER_INIT_POS[1], z: CHARACTER_INIT_POS[2] }, true);
        rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
        spawnFrames.current++;
      }
      return;
    }

    // Interceptar Teletransporte
    const teleportTarget = useStore.getState().teleportTarget;
    let skippedWorldPos = false;
    if (teleportTarget) {
      console.log(`[Player] Interceptación de teletransporte activa. Target en store: [${teleportTarget.map(n => n.toFixed(2)).join(', ')}]`);
      if (ecctrlRef.current?.group) {
        const rb = ecctrlRef.current.group;
        console.log('[Player] RigidBody listo. Despertando y aplicando setTranslation...');
        rb.wakeUp();
        rb.setTranslation({ x: teleportTarget[0], y: teleportTarget[1], z: teleportTarget[2] }, true);
        const trans = rb.translation();
        console.log(`[Player Teleport Debug] Posición de Rapier inmediatamente después de setTranslation: [${trans.x.toFixed(2)}, ${trans.y.toFixed(2)}, ${trans.z.toFixed(2)}]`);
        rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rb.setAngvel({ x: 0, y: 0, z: 0 }, true);
        if (posRef.current) {
          vec.current.set(teleportTarget[0], teleportTarget[1], teleportTarget[2]);
        }
        setPlayerPosition({ x: teleportTarget[0], y: teleportTarget[1], z: teleportTarget[2] });
        setSpawnPos(teleportTarget); // Actualizar prop position del RigidBody para evitar reset en re-render
        useStore.setState({ teleportTarget: null });
        useStore.getState().setCameraMode('thirdPerson');
        skippedWorldPos = true;
        postTeleportFrames.current = 0; // Iniciar trazado y bloqueo de sincronización
      } else {
        console.warn('[Player] RigidBody NO disponible para teletransporte. Reintentando en el próximo frame...');
      }
    }

    // Trazado de frames post-teletransporte para diagnóstico
    if (postTeleportFrames.current >= 0 && postTeleportFrames.current < 15) {
      if (posRef.current) {
        posRef.current.getWorldPosition(vec.current);
        console.log(`[Player Teleport Trace] Frame ${postTeleportFrames.current}: posRef = [${vec.current.x.toFixed(2)}, ${vec.current.y.toFixed(2)}, ${vec.current.z.toFixed(2)}]`);
      }
      postTeleportFrames.current++;
    }

    // Congelar físicas si los controles están deshabilitados (diálogos o modales activos)
    // Esto previene que el jugador atraviese el escenario por picos de lag ("jank") de React
    if (controlsDisabled) {
      if (ecctrlRef.current?.group) {
        const rb = ecctrlRef.current.group;
        rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rb.setAngvel({ x: 0, y: 0, z: 0 }, true);
      }
    }

    // Sincronizar posición al store (siempre, para HUD y CameraRig)
    if (posRef.current) {
      if (!skippedWorldPos) {
        posRef.current.getWorldPosition(vec.current);
      }

      const isPostTeleporting = postTeleportFrames.current >= 0 && postTeleportFrames.current < 10;

      // --- RESPAWNER DE SEGURIDAD (Red contra caídas al vacío) ---
      if (!isPostTeleporting && vec.current.y < -15) {
        console.warn('¡Jugador fuera de límites! Reposicionando en zona segura...');
        if (ecctrlRef.current?.group) {
          const rb = ecctrlRef.current.group;
          rb.setTranslation({ x: CHARACTER_INIT_POS[0], y: CHARACTER_INIT_POS[1], z: CHARACTER_INIT_POS[2] }, true);
          rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
          rb.setAngvel({ x: 0, y: 0, z: 0 }, true);
          // Actualizamos vec para que la sincronización inmediata del store no registre la Y rota
          vec.current.set(CHARACTER_INIT_POS[0], CHARACTER_INIT_POS[1], CHARACTER_INIT_POS[2]);
        }
      }
      
      if (!skippedWorldPos && !isPostTeleporting) {
        setPlayerPosition({ x: vec.current.x, y: vec.current.y, z: vec.current.z });
      }
      
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
      characterInitDir={CHARACTER_INIT_DIR}
      camInitDir={CAM_INIT_DIR}
      position={spawnPos}
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

  // Teclas F, E y X
  useEffect(() => {
    const handler = (e) => {
      const state = useStore.getState();

      // Si el minijuego está activo, interceptamos el teclado
      if (state.networkGameActive) {
        if (e.code === 'Escape') {
          e.preventDefault();
          state.toggleNetworkGame();
        }
        return;
      }

      if (e.code === 'KeyF') {
        e.preventDefault();
        const next = !state.flyMode;
        setFlyMode(next);
        console.log(`[Fly] Modo ${next ? 'vuelo' : 'normal'} — F para alternar`);
        return;
      }

      if (state.isDialogueActive) {
        if (e.code === 'ArrowRight') {
          e.preventDefault();
          state.nextDialogue();
          return;
        }
        if (e.code === 'ArrowLeft') {
          e.preventDefault();
          state.previousDialogue();
          return;
        }
        if (e.code === 'KeyE') {
          e.preventDefault();
          state.nextDialogue();
          return;
        }
      } else {
        // E cerca de la vitrina de servidores → abre el minijuego
        if (e.code === 'KeyE' && state.vitrineProximity && !state.networkGameWon) {
          e.preventDefault();
          state.toggleNetworkGame();
          return;
        }
        // E cerca de la PC de ciberseguridad → abre Defender Ataque Hacker
        if (e.code === 'KeyE' && state.hackerGameProximity && !state.hackerGameWon) {
          e.preventDefault();
          state.toggleHackerGame();
          return;
        }
        // E cerca del TV de Redes → abre video
        if (e.code === 'KeyE' && state.tvRedesProximity && !state.tvVideoUrl) {
          e.preventDefault();
          state.setTvVideoUrl('https://www.youtube.com/watch?v=REDES_VIDEO_ID');
          return;
        }
        // E cerca del TV de Marketing → abre video
        if (e.code === 'KeyE' && state.tvMarketingProximity && !state.tvVideoUrl) {
          e.preventDefault();
          state.setTvVideoUrl('https://www.youtube.com/watch?v=MARKETING_VIDEO_ID');
          return;
        }
        // E sobre un NPC → inicia diálogo
        if (e.code === 'KeyE' && state.interactableNPC) {
          e.preventDefault();
          state.triggerNPCDialogue();
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
