import { useEffect, useRef } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import useStore from '../../store/useStore';
import npcsData from '../../data/npcs.json';

// Pre-cargar todos los modelos GLB de NPCs para evitar lag al renderizar
npcsData.forEach((npc) => {
  useGLTF.preload(npc.modelUrl);
});

function NPC({ data }) {
  const { scene, animations } = useGLTF(data.modelUrl);
  const group = useRef();
  
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

  return (
    <RigidBody 
      type="fixed" 
      colliders="cuboid" 
      position={data.position} 
      rotation={data.rotation}
      name={data.name}
    >
      <group 
        ref={group}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <primitive object={scene} />
      </group>
    </RigidBody>
  );
}

export default function NPCs() {
  return (
    <>
      {npcsData.map((npc) => (
        <NPC
          key={npc.id}
          data={npc}
        />
      ))}
    </>
  );
}
