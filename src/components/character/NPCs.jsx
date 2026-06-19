import { useEffect, useRef } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import useStore from '../../store/useStore';
import npcsData from '../../data/npcs.json';

// Pre-cargar todos los modelos GLB de NPCs para evitar lag al renderizar
npcsData.forEach((npc) => {
  useGLTF.preload(npc.modelUrl);
});

function NPC({ data, positionOverride }) {
  const { scene, animations } = useGLTF(data.modelUrl);
  const group = useRef();
  const npcPosition = positionOverride || data.position;
  
  // Vinculamos las animaciones al contenedor del modelo
  const { actions, names } = useAnimations(animations, group);

  useEffect(() => {
    if (names.length > 0) {
      // Buscar una animación que se parezca a 'idle' o usar la primera
      const idleAnimName = names.find((n) => n.toLowerCase().includes('idle')) || names[0];
      const action = actions[idleAnimName];
      if (action) {
        action.reset().fadeIn(0.5).play();
      }
      return () => {
        if (action) {
          action.fadeOut(0.5);
        }
      };
    }
  }, [actions, names]);

  const handlePointerOver = (e) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
    useStore.getState().setInteractableNPC(data);
  };

  const handlePointerOut = () => {
    document.body.style.cursor = 'auto';
    useStore.getState().setInteractableNPC(null);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    const state = useStore.getState();
    if (!state.isDialogueActive) {
      state.triggerNPCDialogue(data);
    }
  };

  return (
    <RigidBody 
      type="fixed" 
      colliders="cuboid" 
      position={npcPosition} 
      rotation={data.rotation}
      name={data.name}
    >
      <group 
        ref={group}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <primitive object={scene} />
      </group>
    </RigidBody>
  );
}

export default function NPCs() {
  const npcPositionOverrides = useStore((s) => s.npcPositionOverrides);

  return (
    <>
      {npcsData.map((npc) => (
        <NPC
          key={npc.id}
          data={npc}
          positionOverride={npcPositionOverrides[npc.id]}
        />
      ))}
    </>
  );
}
