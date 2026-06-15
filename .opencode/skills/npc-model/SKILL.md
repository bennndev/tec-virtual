---
name: npc-model
description: >
  Integrate non-playable character (NPC) 3D models with physical colliders, animations, and interactive dialogs in React Three Fiber.
  Trigger: When adding, modifying, registering or importing a new NPC, setting up NPC dialogue, or when the user mentions adding a non-playable character.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.1"
---

## When to Use

Use this skill when:
- Importing or registering a new 3D NPC model (`.glb`) into the virtual campus.
- Setting up static collisions and physics boundaries for an NPC using Rapier.
- Mapping default idle animations or troubleshooting static animation playback on NPCs.
- Adding coordinates, descriptions, and interaction logic (dialogues) for new NPCs.
- Fixing or modifying how the HUD extracts and displays the NPC's name during dialogue.

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
    "description": "El bot asistente oficial de Tecsup."
  }
]
```

### Pattern 3: Hover Interaction & Physics (`NPCs.jsx`)

NPCs must handle `onPointerOver` and `onPointerOut` events to register themselves as the active target in the Zustand store (`interactableNPC`).
- Update the store on hover: `useStore.getState().setInteractableNPC(data);`
- Clear the store on blur: `useStore.getState().setInteractableNPC(null);`

### Pattern 4: Triggering Dialogue (`Player.jsx`)

Dialogues are triggered by pressing the **E** key when an NPC is interactable. The logic resides in `Player.jsx` inside a `keydown` listener:
- Always pass the `interactableNPC` to `startDialogue` as the second argument: 
  `state.startDialogue(["Mensaje 1", "Mensaje 2"], state.interactableNPC);`
- This ensures the HUD retains the NPC data even if the player's mouse stops hovering over the 3D model.

### Pattern 5: Persistent Dialogue HUD (`DialogHUD.jsx` & `useStore.js`)

- The store manages `activeDialogueNPC` separately from `interactableNPC`.
- `DialogHUD.jsx` must read `activeDialogueNPC` from the store.
- The speaker name is dynamically rendered: `{activeDialogueNPC ? activeDialogueNPC.name : 'Sistema'}`.

---

## Code Examples

### NPCs.jsx component (`src/components/character/NPCs.jsx`)

```jsx
// ... (imports and preload)
function NPC({ data }) {
  const { scene, animations } = useGLTF(data.modelUrl);
  const group = useRef();
  
  // Connect animations to the inner group ref
  const { actions, names } = useAnimations(animations, group);

  // ... (animation idle logic)

  const handlePointerOver = (e) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
    useStore.getState().setInteractableNPC(data); // <-- Registers hover
  };

  const handlePointerOut = () => {
    document.body.style.cursor = 'auto';
    useStore.getState().setInteractableNPC(null); // <-- Clears hover
  };

  return (
    <RigidBody type="fixed" colliders="cuboid" position={data.position} rotation={data.rotation} name={data.name}>
      <group ref={group} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
        <primitive object={scene} />
      </group>
    </RigidBody>
  );
}
```

### Player.jsx Interaction (`src/components/character/Player.jsx`)

```jsx
// inside the useEffect keydown handler
if (e.code === 'KeyE' && state.interactableNPC) {
  e.preventDefault();
  state.startDialogue([
    `¡Hola! Soy ${state.interactableNPC.name}.`,
    state.interactableNPC.description
  ], state.interactableNPC); // <-- MANDATORY: pass the NPC object
}
```

---

## Resources

- **NPC Config Registry**: [npcs.json](file:///c:/Users/benja/Documents/Dev%20Journey/test/tec-virtual/src/data/npcs.json)
- **NPC R3F Component**: [NPCs.jsx](file:///c:/Users/benja/Documents/Dev%20Journey/test/tec-virtual/src/components/character/NPCs.jsx)
- **Store**: [useStore.js](file:///c:/Users/benja/Documents/Dev%20Journey/test/tec-virtual/src/store/useStore.js)
- **HUD Component**: [DialogHUD.jsx](file:///c:/Users/benja/Documents/Dev%20Journey/test/tec-virtual/src/components/ui/DialogHUD.jsx)
