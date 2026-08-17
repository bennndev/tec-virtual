import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import useStore from '../../store/useStore';
import npcsData from '../../data/npcs.json';

const TALK_RADIUS = 1.9;
const TALK_RADIUS_SQ = TALK_RADIUS * TALK_RADIUS;

npcsData.forEach((npc) => {
  useGLTF.preload(npc.modelUrl);
});

function NPC({ data, positionOverride, visualPosRef, hoveredIdRef }) {
  const { scene, animations } = useGLTF(data.modelUrl);
  const group = useRef();
  const meshBox = useRef(new THREE.Box3());
  const meshSize = useRef(new THREE.Vector3());
  const npcPosition = positionOverride || data.position;

  const { actions, names } = useAnimations(animations, group);

  useEffect(() => {
    if (names.length > 0) {
      const idleAnimName = names.find((n) => n.toLowerCase().includes('idle')) || names[0];
      const action = actions[idleAnimName];
      if (action) {
        action.reset().fadeIn(0.5).play();
      }
      return () => {
        if (action) action.fadeOut(0.5);
      };
    }
  }, [actions, names]);

  useFrame(() => {
    if (!group.current) return;
    if (!visualPosRef.current[data.id]) {
      visualPosRef.current[data.id] = new THREE.Vector3();
    }
    const target = visualPosRef.current[data.id];
    let bestVol = 0;
    let found = false;
    group.current.traverse((child) => {
      if (!child.isMesh) return;
      meshBox.current.setFromObject(child);
      meshBox.current.getSize(meshSize.current);
      const vol = meshSize.current.x * meshSize.current.y * meshSize.current.z;
      if (vol > bestVol) {
        bestVol = vol;
        meshBox.current.getCenter(target);
        found = true;
      }
    });
    if (!found) group.current.getWorldPosition(target);
  });

  const handlePointerOver = (e) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
    hoveredIdRef.current = data.id;
    useStore.getState().setInteractableNPC(data);
  };

  const handlePointerOut = () => {
    document.body.style.cursor = 'auto';
    if (hoveredIdRef.current === data.id) {
      hoveredIdRef.current = null;
    }
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
  const visualPosRef = useRef({});
  const hoveredIdRef = useRef(null);
  const lastIdRef = useRef(null);

  useFrame(() => {
    const { playerPosition, isDialogueActive, setInteractableNPC } = useStore.getState();

    if (isDialogueActive) {
      if (lastIdRef.current !== null) {
        lastIdRef.current = null;
        setInteractableNPC(null);
      }
      return;
    }

    let nearNpc = null;
    let closest = TALK_RADIUS_SQ;
    for (const npc of npcsData) {
      const pos = visualPosRef.current[npc.id];
      if (!pos) continue;
      const dx = playerPosition.x - pos.x;
      const dz = playerPosition.z - pos.z;
      const distSq = dx * dx + dz * dz;
      if (distSq < closest) {
        closest = distSq;
        nearNpc = npc;
      }
    }

    const hovered = hoveredIdRef.current
      ? npcsData.find((n) => n.id === hoveredIdRef.current)
      : null;
    const chosen = hovered || nearNpc;
    const nextId = chosen?.id ?? null;

    if (nextId !== lastIdRef.current) {
      lastIdRef.current = nextId;
      setInteractableNPC(chosen ?? null);
    }
  });

  return (
    <>
      {npcsData.map((npc) => (
        <NPC
          key={npc.id}
          data={npc}
          positionOverride={npcPositionOverrides[npc.id]}
          visualPosRef={visualPosRef}
          hoveredIdRef={hoveredIdRef}
        />
      ))}
    </>
  );
}
