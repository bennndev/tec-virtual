---
name: vitrine-interaction
description: >
  Create proximity-based interaction zones that trigger a 2D minigame when the
  player approaches a specific location in the 3D world. Covers distance
  detection via useFrame, Zustand state for proximity flags, InteractionPrompt
  wiring, and E key binding for this project.
  Trigger: When adding a location-triggered minigame, proximity interaction,
  or vitrine-style hotspot that opens a game when the player approaches.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

Use this skill when:
- Adding a new hotspot zone that opens a minigame when the player approaches
- Creating a proximity-triggered interaction (E key prompt)
- Wiring a minigame to a specific 3D location instead of a global key
- Removing a global key/HUD trigger in favor of location-based access

---

## Critical Patterns

### Pattern 1: Architecture — The 5 Layers

Every vitrine-style interaction follows this layered architecture:

```
3D Position (GLB world coords)
  → Distance check in useFrame component
    → Zustand boolean flag (proximity)
      → InteractionPrompt shows/hides [E] prompt
        → Player.jsx E key handler opens the minigame
```

### Pattern 2: Distance Detection Component

Create a dedicated component in `src/components/world/` that:

1. Reads `playerPosition` from Zustand (already updated every frame by Player.jsx)
2. Compares squared distance against a target world position
3. Updates a Zustand boolean only when the value **changes** (avoid re-render storms)

```jsx
// VitrineInteraction.jsx — template
const TARGET_POS = new THREE.Vector3(41.7, 19.6, -33.6);
const DETECTION_RADIUS = 4.5;

export default function VitrineInteraction() {
  const playerPosition = useStore((s) => s.playerPosition);
  const setProximity = useStore((s) => s.setVitrineProximity);
  const wasCloseRef = useRef(false);

  useFrame(() => {
    const dx = playerPosition.x - TARGET_POS.x;
    const dy = playerPosition.y - TARGET_POS.y;
    const dz = playerPosition.z - TARGET_POS.z;
    const isClose = (dx*dx + dy*dy + dz*dz) < DETECTION_RADIUS * DETECTION_RADIUS;
    if (isClose !== wasCloseRef.current) {
      wasCloseRef.current = isClose;
      setProximity(isClose);
    }
  });
  return null;
}
```

### Pattern 3: Zustand State

Every proximity zone needs these fields in `useStore.js`:

```js
vitrineProximity: false,           // boolean flag
setVitrineProximity: (val) => set({ vitrineProximity: val }),
```

Rules:
- Default is `false` (not in range)
- Only the `useFrame` component writes to it
- Components read it via `useStore(s => s.vitrineProximity)`

### Pattern 4: InteractionPrompt Wiring

In `src/components/ui/InteractionPrompt.jsx`, add conditions for the new prompt:

```jsx
const showPrompt = proximityFlag && !networkGameWon && !networkGameActive;

// Priority: vitrine prompt > NPC prompt
if (showPrompt) {
  return (
    <div className={styles.prompt}>
      <span className={styles.key}>E</span>
      <span>Reparar Internet</span>
    </div>
  );
}
```

Rules:
- Guard with `!networkGameWon` (don't show if already completed)
- Guard with `!networkGameActive` (don't show while game is open)
- Vitrine prompt MUST take priority over NPC prompt in the return chain

### Pattern 5: Player.jsx E Key Handler

In `src/components/character/Player.jsx`, add the E key case BEFORE the NPC check:

```jsx
// E cerca de la zona → abre el minijuego
if (e.code === 'KeyE' && state.vitrineProximity && !state.networkGameWon) {
  e.preventDefault();
  state.toggleNetworkGame();
  return;
}
```

Rules:
- Must check BEFORE the NPC E handler (higher priority)
- Guard with `!state.networkGameWon` to prevent re-opening
- Call `state.toggleNetworkGame()` directly (same function the HUD used)

### Pattern 6: Removing Global Access

When migrating from a global key (e.g. X) to location-based:

1. **Player.jsx**: Remove the global `KeyX` listener block
2. **HUD.jsx**: Remove the button and its state selectors (`networkGameActive`, `toggleNetworkGame`)
3. **NetworkGame.jsx**: Keep as-is — it still reads `networkGameActive` from the store

### Pattern 7: Finding 3D Positions from GLB

To find a target position for the interaction zone:

1. Extract the GLB node name you want to target
2. Use a script to read the glTF JSON chunk and compute world transforms
3. Or find a nearby `zona_*` empty that already has a known position

The `zona_laboratorio_redes` position is `(36.15, 20.16, -39.84)` — nearby objects will be a few units offset.

---

## Steps to Add a New Vitrine Interaction

1. **Store**: Add `newZoneProximity` + `setNewZoneProximity` to `useStore.js`
2. **Component**: Create `src/components/world/NewZoneInteraction.jsx` with `useFrame` distance check
3. **Scene**: Import and render `<NewZoneInteraction />` in `Scene.jsx`
4. **Prompt**: Add condition in `InteractionPrompt.jsx` for the new zone
5. **Player**: Add E key handler in `Player.jsx` (before NPC check)
6. **HUD** (if removing global access): Remove button + state selectors

---

## Commands

```bash
# Extract GLB world positions for target nodes
node -e "
const fs = require('fs');
const buf = fs.readFileSync('public/scenes/tecsup-2.glb');
const dec = new TextDecoder();
let off = 12, json = '';
while (off < buf.length) {
  const len = buf.readUInt32LE(off), type = buf.readUInt32LE(off+4), d = buf.slice(off+8, off+8+len);
  if (type === 0x4E4F534A) { json = dec.decode(d); break; }
  off += 8 + len;
}
const gltf = JSON.parse(json);
// Find world position of a node by computing parent chain
function worldPos(id, nodes, sx, sy, sz, nodes2) { ... }
gltf.nodes.forEach((n,i) => { if (n.name === 'TARGET_NAME') console.log(i, n.translation); });
"
```

---

## Resources

- **Existing implementation**: `src/components/world/VitrineInteraction.jsx` — reference implementation
- **Store pattern**: `src/store/useStore.js` — lines with `vitrineProximity`
- **Prompt pattern**: `src/components/ui/InteractionPrompt.jsx` — vitrine prompt return
- **Key handler**: `src/components/character/Player.jsx` — lines 268-278
