---
name: npc-model
description: >
  Integrate non-playable character (NPC) 3D models with physical colliders and animations in React Three Fiber.
  Trigger: When adding, modifying, registering or importing a new NPC, or when the user mentions adding a non-playable character.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

Use this skill when:
- Importing or registering a new 3D NPC model (`.glb`) into the virtual campus.
- Setting up static collisions and physics boundaries for an NPC using Rapier.
- Mapping default idle animations or troubleshooting static animation playback on NPCs.
- Adding coordinates and descriptions for new NPCs in the system configuration.

---

## Critical Patterns

### Pattern 1: MANDATORY Interactive Parameter Gathering Protocol

> [!IMPORTANT]
> **BEFORE writing any code or modifying configuration files**, you MUST stop and ask the user for the necessary NPC configuration parameters.
> Do NOT guess or hardcode positions, IDs, or model files. Ask the user one single question at a time to gather the following:
>
> 1. **NPC ID**: Unique ID in kebab-case (e.g., `paquito-bot`).
> 2. **Name**: Public display name (e.g., `Paquito Bot`).
> 3. **Model GLB Path**: Path in the assets folder (e.g., `/models/npcs/paquito-bot.glb`).
> 4. **Spawn Coordinates**: Position `[x, y, z]` where the NPC should appear in the 3D world (e.g., `[62.12, 10.10, -94.97]`).
> 5. **Initial Rotation**: Rotation `[x, y, z]` in radians (defaults to `[0, 0, 0]`).
> 6. **Description**: Brief role or dialog description.

Once gathered, write them directly to the `src/data/npcs.json` registry file.

### Pattern 2: NPC Configuration Registry (`src/data/npcs.json`)

All NPCs must be registered in the global configuration file. The file is structured as a JSON array of objects:

```json
[
  {
    "id": "paquito-bot",
    "name": "Paquito Bot",
    "modelUrl": "/models/npcs/paquito-bot.glb",
    "position": [62.12, 10.10, -94.97],
    "rotation": [0, 0, 0],
    "description": "El bot asistente oficial de Tecsup. Listo para guiarte en el campus."
  }
]
```

### Pattern 3: Dynamic Rendering and Physics

NPCs are rendered dynamically inside the `<Physics>` context in `Scene.jsx` using `src/components/character/NPCs.jsx`.
- **Friction and Colliders**: Every NPC is wrapped in a `RigidBody` of type `fixed` with a `cuboid` collider to act as an impassable physical barrier.
- **Model Caching**: Preload GLB assets using `useGLTF.preload(modelUrl)` at the module level.
- **Animation Mixer**: Bind `useAnimations` to a `<group ref={group}>` wrapping the `<primitive>` scene.

---

## Code Examples

### NPCs.jsx component (`src/components/character/NPCs.jsx`)

```jsx
import { useEffect, useRef } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import npcsData from '../../data/npcs.json';

// Pre-load NPC models at module scope
npcsData.forEach((npc) => {
  useGLTF.preload(npc.modelUrl);
});

function NPC({ modelUrl, position, rotation = [0, 0, 0], name }) {
  const { scene, animations } = useGLTF(modelUrl);
  const group = useRef();
  
  // Connect animations to the inner group ref
  const { actions, names } = useAnimations(animations, group);

  useEffect(() => {
    if (names.length > 0) {
      // Find 'idle' animation or fallback to the first clip
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

  return (
    <RigidBody 
      type="fixed" 
      colliders="cuboid" 
      position={position} 
      rotation={rotation}
      name={name}
    >
      <group ref={group}>
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
          name={npc.name}
          modelUrl={npc.modelUrl}
          position={npc.position}
          rotation={npc.rotation}
        />
      ))}
    </>
  );
}
```

---

## Commands

No compilation commands are needed for static asset addition. Use standard development tools:

```bash
npm run dev         # Start local dev server with HMR
```

---

## Resources

- **NPC Config Registry**: [npcs.json](file:///c:/Users/benja/Documents/Dev%20Journey/test/tec-virtual/src/data/npcs.json)
- **NPC R3F Component**: [NPCs.jsx](file:///c:/Users/benja/Documents/Dev%20Journey/test/tec-virtual/src/components/character/NPCs.jsx)
- **3D Scene Environment**: [Scene.jsx](file:///c:/Users/benja/Documents/Dev%20Journey/test/tec-virtual/src/components/world/Scene.jsx)
