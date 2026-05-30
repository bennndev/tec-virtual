---
name: character-model
description: >
  Integrate playable 3D character models with animations in React Three Fiber.
  Covers GLB/Draco loading, animation mapping, ecctrl integration, and
  physics-based character control for this project.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "2.0"
---

## When to Use

Use this skill when:
- Loading a GLB/GLTF character model with Draco compression for use as a PLAYABLE character
- Mapping animation clips from a GLB to ecctrl movement states
- Setting up EcctrlAnimation with proper animationSet for character control
- Fixing a character that floats above the ground (pivot point correction)
- Debugging animation-related crashes ("cannot read properties of undefined")
- Preloading models for performance

---

## Critical Patterns

### Pattern 1: Model Asset Organization

**ALWAYS** place GLB/GLTF model files in `public/models/`.

```
# ✅ CORRECT — public/ files are served as static assets
public/models/test-character.glb
```

In Vite, only `public/` is copied to `dist/` as-is. Files placed at the project root in `models/` are NOT accessible at runtime.

**Naming convention**: Use kebab-case, no spaces.
```
public/models/test-character.glb  # ✅
models/Test Character.glb          # ❌ not served, wrong naming
```

### Pattern 2: Animation Discovery (ALWAYS do this first)

Before integrating a new model, log its clip names to verify what's available:

```jsx
import { useGLTF, useAnimations } from '@react-three/drei';

const MODEL_URL = '/models/test-character.glb';

export default function CharacterModel(props) {
  const { scene, animations } = useGLTF(MODEL_URL);
  const { names } = useAnimations(animations, scene);

  useEffect(() => {
    console.log('=== Character Model Animations ===');
    if (names.length > 0) {
      names.forEach((name, index) => {
        console.log(`  ${index + 1}. "${name}"`);
      });
    } else {
      console.log('  (No animations found)');
    }
    console.log('==================================');
  }, [names]);

  return <primitive object={scene} {...props} />;
}

useGLTF.preload(MODEL_URL);
```

**Key points**:
- `useGLTF` handles Draco decompression **automatically** — no extra setup needed
- `useAnimations(animations, scene)` — the **second argument** (`scene`) is CRITICAL. Without it the AnimationMixer won't target the right object
- `names` contains all animation clip names from the GLB — use these to build your animationSet
- `useGLTF` **suspends** — must be inside `<Suspense fallback={...}>`
- `useGLTF.preload()` prevents flash-of-empty on subsequent mounts

### Pattern 3: AnimationSet Mapping (CRITICAL — errors if wrong)

ecctrl requires exactly **7 animation keys** in the `animationSet`:

| Key | Purpose | Required |
|-----|---------|----------|
| `idle` | Standing still | ✅ Always |
| `walk` | Walking forward | ✅ Always |
| `run` | Sprinting (shift) | ✅ Always |
| `jump` | Jump initiation | ✅ Always |
| `jumpIdle` | Floating mid-air | ✅ Always |
| `jumpLand` | Landing on ground | ✅ Always |
| `fall` | Falling from height | ✅ Always |

**If any mapped clip name doesn't exist in the GLB, ecctrl CRASHES** with:
> `"cannot read properties of undefined (reading 'reset')"`

**Nothing will render** — the component tree breaks completely.

#### Mapping with fallbacks

When the model doesn't have separate clips for aerial states (`jumpIdle`, `jumpLand`, `fall`), use an existing clip as fallback:

```js
// Example: model has only 5 clips: Grounded, Idle, Jump, Sprint, Walk
const animationSet = {
  idle: 'Armature|Idle',           // Standard idle
  walk: 'Armature|Walk',           // Walking
  run: 'Armature|Sprint',          // Sprint/run
  jump: 'Armature|Jump',           // Jump takeoff
  jumpIdle: 'Armature|Grounded',   // Fallback — air float
  jumpLand: 'Armature|Grounded',   // Fallback — landing
  fall: 'Armature|Grounded',       // Fallback — falling
};
```

**Rule**: The GLB clip name on the right MUST exist verbatim. Use the names from Pattern 2's console output.

### Pattern 4: Full Player Integration (Playable Character)

Replace the ecctrl capsule placeholder with the animated model:

```jsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import Ecctrl, { EcctrlAnimation } from 'ecctrl';
import { KeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import useStore from '../../store/useStore';
import CharacterModel from './CharacterModel';

const MODEL_URL = '/models/test-character.glb';

const keyboardMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'rightward', keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'run', keys: ['Shift'] },
];

const animationSet = {
  idle: 'Armature|Idle',
  walk: 'Armature|Walk',
  run: 'Armature|Sprint',
  jump: 'Armature|Jump',
  jumpIdle: 'Armature|Grounded',
  jumpLand: 'Armature|Grounded',
  fall: 'Armature|Grounded',
};

function Character() {
  const posRef = useRef();
  const setPlayerPosition = useStore((s) => s.setPlayerPosition);
  const cameraMode = useStore((s) => s.cameraMode);
  const disableFollowCam = cameraMode === 'overview';
  const vec = useRef(new THREE.Vector3());

  useFrame(() => {
    if (posRef.current) {
      posRef.current.getWorldPosition(vec.current);
      setPlayerPosition({ x: vec.current.x, y: vec.current.y, z: vec.current.z });
    }
  });

  return (
    <Ecctrl
      animated                      // ← REQUIRED for animation control
      disableFollowCam={disableFollowCam}
      capsuleHalfHeight={0.35}      // Adjust to match model size
      capsuleRadius={0.3}
      floatHeight={0.08}            // Lower = less floating above ground
      maxVelLimit={3}
      sprintMult={1.8}
      jumpVel={4}
      camInitDis={-5}
      camMaxDis={-7}
      camMinDis={-0.7}
      camMoveSpeed={1}
      camZoomSpeed={1}
    >
      <group ref={posRef}>
        <EcctrlAnimation
          characterURL={MODEL_URL}
          animationSet={animationSet}
        >
          <group position={[0, -0.6, 0]}>  {/* Pivot offset — see Pattern 5 */}
            <CharacterModel />
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
```

**Critical details**:
- `Ecctrl` MUST have the `animated` prop for EcctrlAnimation to work
- `characterURL` is how EcctrlAnimation loads the model internally — it reads the same cached GLB useGLTF returns
- The `animationSet` maps ecctrl's movement states → actual GLB clip names
- `position={[0, -0.6, 0]}` corrects for models with center pivot — adjust per model

### Pattern 5: Pivot Point Correction (Fixing Floating Characters)

**Problem**: Most GLB character models have their origin (pivot) at the model's center, not at the feet. Since ecctrl's physics capsule is centered at the model origin, the visual mesh appears to float above the ground.

**Fix**: Apply a negative Y offset to the model inside `EcctrlAnimation`:

```jsx
<EcctrlAnimation characterURL={MODEL_URL} animationSet={animationSet}>
  <group position={[0, -0.6, 0]}>   {/* ← Adjust this value */}
    <CharacterModel />
  </group>
</EcctrlAnimation>
```

**How to find the right offset**:
1. Start with `-0.6` for a typical humanoid (~1.6-1.7 units tall)
2. If the character still floats → increase magnitude (more negative, e.g. `-0.8`)
3. If feet clip through ground → decrease magnitude (less negative, e.g. `-0.4`)
4. If unsure, add a temporary `onLoad` callback to log the model's bounding box height

**Also consider `floatHeight`**: The ecctrl `floatHeight` prop controls how much the physics capsule floats above the ground. Default is `0.3`. Lower values reduce floating:

```jsx
floatHeight={0.08}   // Minimal floating, closer to ground feel
```

### Pattern 6: Capsule Size vs Model Size

The ecctrl physics capsule must roughly match the model's size:

| Prop | What it controls | Typical range |
|------|-----------------|---------------|
| `capsuleRadius` | Width of the character's collision | `0.2` – `0.5` |
| `capsuleHalfHeight` | Half the height of the central cylinder | `0.3` – `0.8` |

Total capsule height = `(capsuleHalfHeight × 2) + (capsuleRadius × 2)`.

If the model extends beyond the capsule, it may clip through walls or the ground. If the capsule is much larger than the model, movement feels unresponsive.

### Pattern 7: Multi-Character Switching

When the project supports multiple selectable characters, use a **character config** + **Zustand store** pattern:

**Config file** (`src/data/characterConfig.js`):

```js
const CHARACTERS = {
  character1: {
    id: 'character1',
    name: 'Personaje 1',
    modelUrl: '/models/test-character.glb',
    offsetY: -0.6,
    animationSet: {
      idle: 'Armature|Idle',
      walk: 'Armature|Walk',
      run: 'Armature|Sprint',
      jump: 'Armature|Jump',
      jumpIdle: 'Armature|Grounded',
      jumpLand: 'Armature|Grounded',
      fall: 'Armature|Grounded',
    },
  },
  character2: {
    id: 'character2',
    name: 'Personaje 2',
    modelUrl: '/models/test-character2.glb',
    offsetY: -0.6,
    animationSet: {
      // Same structure — use animation names from the GLB
    },
  },
};
```

**Store** (`src/store/useStore.js`):

```js
activeCharacter: 'character1',
setActiveCharacter: (id) => set({ activeCharacter: id }),
```

**Player.jsx** reads from config + store dynamically (note the `key` prop):

```jsx
const activeCharacter = useStore((s) => s.activeCharacter);
const config = CHARACTERS[activeCharacter];

<EcctrlAnimation
  key={activeCharacter}         // ← FORCES remount — critical!
  characterURL={config.modelUrl}
  animationSet={config.animationSet}
>
  <group position={[0, config.offsetY, 0]}>
    <CharacterModel modelUrl={config.modelUrl} />
  </group>
</EcctrlAnimation>
```

**CharacterModel.jsx** accepts `modelUrl` prop and preloads all models:

```jsx
useGLTF.preload('/models/test-character.glb');
useGLTF.preload('/models/test-character2.glb');

export default function CharacterModel({ modelUrl, ...props }) {
  const { scene, animations } = useGLTF(modelUrl);
  // ...
}
```

**CharacterSwitcher** (`src/components/ui/CharacterSwitcher.jsx`) toggles between characters via store:

```jsx
const handleSwitch = useCallback(() => {
  const currentIndex = characterIds.indexOf(activeCharacter);
  const nextIndex = (currentIndex + 1) % characterIds.length;
  setActiveCharacter(characterIds[nextIndex]);
}, [activeCharacter, setActiveCharacter]);
```

**Key rules**:
- Both models must be preloaded at module scope so switching is instant (no Suspense flash)
- `animationSet` names are per-character — each model can have different clip names
- `offsetY` is per-character — each model may need different pivot correction
- **ALWAYS add `key={activeCharacter}` to EcctrlAnimation** — without it, EcctrlAnimation doesn't reinitialize its internal AnimationMixer when the URL changes. The visual model updates but animations stay frozen on the first character's clips.
- Switching characters is instant: Zustand re-render → new config → new key forces remount → EcctrlAnimation initializes fresh

### Pattern 8: Character Selector Overlay (Display Data)

The project includes a **character selector overlay** (press `O`) that shows a 3D preview of each character before selecting. When adding a new character, you MUST register it in all three places:

#### 8a. Display data — `src/store/characters.json`

Contains the human-readable display info for the selector UI:

```json
[
  {
    "id": "character1",
    "name": "Personaje 1",
    "description": "An agile explorer trained to move with dexterity on any terrain."
  },
  {
    "id": "character2",
    "name": "Personaje 2",
    "description": "A sturdy fighter with great physical resistance."
  }
]
```

**Fields**: `id` (matches the key in `characterConfig.js`), `name`, `description`.

Add a new entry with the same `id` from characterConfig when registering a new character.

#### 8b. Technical config — `src/data/characterConfig.js`

Already covered in Pattern 7. Must have the same `id` as the JSON entry.

#### 8c. Store state — `src/store/useStore.js`

The store includes selector-related state:

```js
// Character selector overlay
isSelectorOpen: false,
setSelectorOpen: (open) => set({ isSelectorOpen: open, controlsDisabled: open }),

// Character currently browsed in the selector
previewCharacter: 'character1',
setPreviewCharacter: (id) => set({ previewCharacter: id }),

// Blocks in-game actions while selector is open (synced with isSelectorOpen)
controlsDisabled: false,
setControlsDisabled: (disabled) => set({ controlsDisabled: disabled }),
```

No changes needed when adding a new character — these are already dynamic.

#### 8d. Selector UI — `src/components/ui/CharacterSelector.jsx`

Renders an overlay with:
- **Left**: 3D preview of the character model loaded fresh via `GLTFLoader` + `DRACOLoader` (bypasses drei's `useGLTF` cache to avoid in-game modifications)
- **Right**: Name, description, `◄ X/Y ►` navigation, Select/Cancel buttons
- Auto-centers the model using bounding box (traverses `isMesh` children only)
- Handles keyboard: `ArrowLeft`/`ArrowRight` to browse, `Enter` to select, `Escape` to cancel

No code changes needed in this file when adding a character — it reads dynamically from `characters.json` and `characterConfig.js`.

#### 8e. Toggle — `src/components/ui/CharacterSwitcher.jsx`

The `O` key toggles the selector (open/close). The button shows the current character's name.

No changes needed when adding a character.

---

## Decision Tree

```
Playable character integration?
├── First time with this model?
│   ├── Run CharacterModel standalone to see console output
│   └── Note the exact clip names from the GLB
├── Building animationSet?
│   ├── Map idle/walk/run/jump first
│   ├── Use fallback clips for jumpIdle/jumpLand/fall if missing
│   └── EVERY name must exist in the GLB — or it crashes
├── Character floating above ground?
│   ├── Reduce floatHeight (try 0.08)
│   └── Add negative Y offset to model group (try -0.6)
├── Animations not playing / glitching?
│   ├── Confirm `animated` prop on Ecctrl
│   ├── Verify animationSet names match GLB clip names exactly
│   └── Check CharacterModel doesn't call useAnimations inside EcctrlAnimation
├── Multiple characters?
│   ├── Create/update characterConfig.js with all characters' data
│   ├── Add entry to src/store/characters.json with name and description
│   ├── Add activeCharacter to Zustand store
│   ├── Make CharacterModel accept modelUrl prop
│   ├── Preload ALL models at module scope
│   ├── Create CharacterSwitcher UI component (opens selector on O)
│   └── Create CharacterSelector overlay (3D preview + navigation)
├── Selector preview shows wrong position/inherits in-game state?
│   └── Preview uses independent GLTFLoader + DRACOLoader (not useGLTF cache)
└── Model not visible?
    ├── Check public/ directory placement
    ├── Check URL path (/models/...)
    ├── Check Suspense boundary
    └── Look for animationSet-related crashes in console
```

---

## File Organization (this project)

```
studio-web/
├── public/models/
│   ├── test-character.glb          # Character 1
│   └── test-character2.glb         # Character 2
├── src/
│   ├── data/
│   │   ├── characterConfig.js       # Per-character config (URL, animSet, offset)
│   │   └── objects.json
│   ├── components/
│   │   ├── character/
│   │   │   ├── CharacterModel.jsx   # Dynamic model loader (modelUrl prop)
│   │   │   ├── Player.jsx           # ecctrl + EcctrlAnimation integration
│   │   │   └── CameraRig.jsx
│   │   ├── controls/
│   │   │   └── PointerLock.jsx      # Pointer lock for continuous camera rotation
│   │   ├── ui/
│   │   │   ├── HUD.jsx
│   │   │   ├── CharacterSwitcher.jsx # Toggle selector with O key
│   │   │   ├── CharacterSelector.jsx # Overlay with 3D preview + navigation
│   │   │   └── InfoCard.jsx
│   │   └── world/
│   │       └── Scene.jsx
│   └── store/
│       ├── useStore.js              # activeCharacter, controlsDisabled, selector state
│       └── characters.json          # Display data (name, description) for selector
└── .opencode/skills/character-model/
    └── SKILL.md                     # This file
```

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `"cannot read properties of undefined (reading 'reset')"` | animationSet maps to a clip name that doesn't exist in the GLB | Fix the clip name in the right side of the mapping |
| Character floats above ground | Pivot at model center AND/OR floatHeight too high | Apply Y offset to model + reduce floatHeight |
| Character switches visually but animations don't play on second character | EcctrlAnimation doesn't reinitialize mixer when characterURL changes | Add `key={activeCharacter}` to EcctrlAnimation to force remount |
| Double animation (two clips playing) | CharacterModel's useAnimations conflicts with EcctrlAnimation's internal mixer | Remove useAnimations from CharacterModel when used inside EcctrlAnimation; use plain `<primitive>` instead |
| Model not visible, no errors | Not wrapped in `<Suspense>` | Wrap the Player or CharacterModel in `<Suspense fallback={null}>` |
| Model not visible in build | File in `models/` instead of `public/models/` | Move to `public/models/` |

---

## Code Examples

### CharacterModel.jsx (dynamic modelUrl, multiple preloads)

```jsx
import { useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';

// Preload ALL characters for instant switching
useGLTF.preload('/models/test-character.glb');
useGLTF.preload('/models/test-character2.glb');

export default function CharacterModel({ modelUrl = '/models/test-character.glb', ...props }) {
  const { scene, animations } = useGLTF(modelUrl);
  const { names } = useAnimations(animations, scene);

  useEffect(() => {
    console.log('=== Character Model Animations ===');
    console.log(`  Model: ${modelUrl}`);
    if (names.length > 0) {
      names.forEach((name, index) => {
        console.log(`  ${index + 1}. "${name}"`);
      });
    } else {
      console.log('  (No animations found)');
    }
    console.log('==================================');
  }, [names, modelUrl]);

  return <primitive object={scene} {...props} />;
}
```

### Player.jsx with character config (dynamic switching)

```jsx
import Ecctrl, { EcctrlAnimation } from 'ecctrl';
import { KeyboardControls } from '@react-three/drei';
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
  const activeCharacter = useStore((s) => s.activeCharacter);
  const config = CHARACTERS[activeCharacter];

  return (
    <Ecctrl animated floatHeight={0.08}>
      <EcctrlAnimation
        key={activeCharacter}    // ← Forces remount (critical!)
        characterURL={config.modelUrl}
        animationSet={config.animationSet}
      >
        <group position={[0, config.offsetY, 0]}>
          <CharacterModel modelUrl={config.modelUrl} />
        </group>
      </EcctrlAnimation>
    </Ecctrl>
  );
}
```

---

## Quick Start Checklist

When integrating a NEW character model:

1. [ ] Place `.glb` file in `public/models/` with kebab-case name
2. [ ] Add entry to `src/data/characterConfig.js` (modelUrl, animationSet, offsetY)
3. [ ] Add entry to `src/store/characters.json` (id, name, description — same id as step 2)
4. [ ] Add `useGLTF.preload()` in `CharacterModel.jsx`
5. [ ] Run dev server → check console for clip names
6. [ ] Fill `animationSet` in characterConfig mapping all 7 required keys
7. [ ] Adjust `offsetY` so feet touch the ground
8. [ ] Tweak capsule size (`capsuleHalfHeight`, `capsuleRadius`) if model clips or feels wrong
9. [ ] Tweak `floatHeight` for desired ground feel
10. [ ] Run dev server → test WASD movement, jump, sprint, camera transitions
11. [ ] Press O → verify selector shows 3D preview correctly centered
12. [ ] Test ◄/► navigation, Enter to select, Escape to cancel
13. [ ] Verify in-game controls are blocked while selector is open

---

## Commands

```bash
npm run dev         # Dev server with HMR
npm run build       # Production build
npm run preview     # Serve build locally
```

---

## Resources

- **Character Config**: `src/data/characterConfig.js`
- **Character Display Data**: `src/store/characters.json` (name, description for selector)
- **Character Model Component**: `src/components/character/CharacterModel.jsx`
- **ecctrl Player Integration**: `src/components/character/Player.jsx`
- **Character Switcher UI**: `src/components/ui/CharacterSwitcher.jsx`
- **Character Selector Overlay**: `src/components/ui/CharacterSelector.jsx`
- **Zustand Store**: `src/store/useStore.js` (activeCharacter, controlsDisabled, isSelectorOpen, previewCharacter)
- **Scene with player**: `src/components/world/Scene.jsx`
- **drei useGLTF docs**: https://github.com/pmndrs/drei#usegltf
- **drei useAnimations docs**: https://github.com/pmndrs/drei#useanimations
- **ecctrl README**: https://github.com/pmndrs/ecctrl
