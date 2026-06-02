---
name: game-mechanics
description: >
  Implement game mechanics like flying, dashing, double jump, and other
  movement abilities on top of ecctrl in React Three Fiber + Rapier.
  Covers useKeyboardControls, ecctrlRef, direct RigidBody manipulation
  via setLinvel/applyImpulse, and Zustand integration for this project.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

Use this skill when:
- Adding a new movement mechanic (flying, dashing, wall jump, double jump, glide, etc.)
- Modifying the existing flying mechanic
- Needing to read keyboard state beyond ecctrl's built-in jump/run
- Accessing the player's Rapier RigidBody directly for force/velocity control
- Adding a toggleable mode that changes player behavior

---

## Critical Patterns

### Pattern 1: Mechanics Architecture

Every game mechanic in this project follows the same layered architecture:

```
Input layer         →  useKeyboardControls (from drei)
                         ↓
State layer         →  Zustand store (flyMode, etc.)
                         ↓
Physics layer      →  ecctrlRef.current.group (RapierRigidBody)
                         ↓
Execution layer    →  useFrame (overrides or augments velocity/forces)
```

**Key principle**: Mechanics are ADDITIVE to ecctrl. ecctrl handles ground movement (WASD, jumping, sprinting). Mechanics augment or override specific aspects (e.g., vertical velocity in fly mode). **NEVER replace ecctrl entirely** — build on top of it.

### Pattern 2: Adding a New Mechanic (Step by Step)

Each mechanic requires changes in exactly **3 files**:

| File | What to add |
|------|-------------|
| `src/store/useStore.js` | New state + setter for the mechanic toggle |
| `src/components/character/Player.jsx` | Key listener + useFrame logic |
| `src/components/ui/HUD.jsx` | Visual indicator (optional but recommended) |

#### Step 1: Store — Add state

```js
// src/store/useStore.js
myMechanic: false,
setMyMechanic: (mode) => set({ myMechanic: mode }),
```

#### Step 2: Player.jsx — Add key listener + useFrame logic

Add the key listener in the **outer `Player`** component:

```jsx
export default function Player() {
  const setMyMechanic = useStore((s) => s.setMyMechanic);

  useEffect(() => {
    const handler = (e) => {
      if (e.code === 'KeyX') {  // Your key
        e.preventDefault();
        const next = !useStore.getState().myMechanic;
        setMyMechanic(next);
        console.log(`[Mechanic] Modo ${next ? 'activado' : 'desactivado'} — X para alternar`);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setMyMechanic]);

  return (
    <KeyboardControls map={keyboardMap}>
      <Character />
    </KeyboardControls>
  );
}
```

Add the execution logic in the **inner `Character`** component's `useFrame`:

```jsx
function Character() {
  const ecctrlRef = useRef();
  const myMechanic = useStore((s) => s.myMechanic);
  useKeyboardControls((state) => state.jump); // Read keys as needed

  useFrame(() => {
    // Position sync (ALWAYS keep this)
    if (posRef.current) { /* ... */ }

    // --- YOUR MECHANIC ---
    if (myMechanic && ecctrlRef.current?.group) {
      const rb = ecctrlRef.current.group;
      // Read current velocity
      const vel = rb.linvel();
      // Modify velocity
      vel.y = FLY_SPEED;
      // Apply back
      rb.setLinvel(vel, true);
    }
  });
}
```

#### Step 3: HUD.jsx — Visual indicator

```jsx
const myMechanic = useStore((s) => s.myMechanic);

// In the coordinates box:
{myMechanic && (
  <div style={{ color: '#4fc3f7', marginTop: 4, fontSize: 11 }}>
    ✈ YOUR MECHANIC ACTIVE — X para salir
  </div>
)}
```

### Pattern 3: Reading Keyboard State (useKeyboardControls)

`useKeyboardControls` from `@react-three/drei` gives you REAL-TIME key state within a `<KeyboardControls>` provider:

```jsx
import { useKeyboardControls } from '@react-three/drei';

function Character() {
  // Subscribe to individual key states (re-renders only when that key changes)
  const jumpPressed = useKeyboardControls((state) => state.jump);
  const runPressed = useKeyboardControls((state) => state.run);
  const forwardPressed = useKeyboardControls((state) => state.forward);

  // useFrame can read these values directly
  useFrame(() => {
    if (jumpPressed) { /* do something while Space is held */ }
  });
}
```

**Available key names** (from `keyboardMap` in Player.jsx):

| Name | Physical Key |
|------|-------------|
| `forward` | W / ArrowUp |
| `backward` | S / ArrowDown |
| `leftward` | A / ArrowLeft |
| `rightward` | D / ArrowRight |
| `jump` | Space |
| `run` | Shift |

**Rules**:
- Use the **selector form** `useKeyboardControls((s) => s.jump)` to avoid unnecessary re-renders
- The hook returns the CURRENT state (true/false) every frame — perfect for useFrame
- State updates synchronously with the key press — no delay

### Pattern 4: Accessing the Rapier RigidBody (ecctrlRef)

ecctrl exposes its internal Rapier RigidBody via a React ref:

```jsx
const ecctrlRef = useRef();

<Ecctrl ref={ecctrlRef} ... />

// Access:
//   ecctrlRef.current.group  → RapierRigidBody | null
//   ecctrlRef.current.group.linvel()   → current velocity { x, y, z }
//   ecctrlRef.current.group.setLinvel({ x, y, z }, true)  → set velocity
//   ecctrlRef.current.group.applyImpulse({ x, y, z }, true)  → apply impulse
```

**CRITICAL**: Always guard with optional chaining:
```js
if (ecctrlRef.current?.group) {
  const rb = ecctrlRef.current.group;
  // ...
}
```

### Pattern 5: Velocity Control Strategy

When overriding velocity, understand how ecctrl applies its own forces:

| Method | What it does | Use for |
|--------|-------------|---------|
| `rb.setLinvel({x, y, z}, true)` | **Sets** velocity directly (overrides) | Fly mode, hover, gravity cancel |
| `rb.applyImpulse({x, y, z}, true)` | **Adds** to current velocity | Boosts, dashes, jumps |
| `rb.addForce({x, y, z}, true)` | **Accumulates** force over time | Wind, gradual acceleration |

**For fly mode**: Use `setLinvel` to override Y velocity every frame. Since ecctrl uses `applyImpulse` for horizontal movement and `setLinvel` for vertical, they don't conflict — ecctrl's impulses ADD to whatever vertical velocity you set.

**Timing**: The `useFrame` in `Character` (inside Ecctrl) runs AFTER ecctrl's internal physics update for that frame. Your velocity override is what Rapier sees in the next physics step.

### Pattern 6: Modifying ecctrl Props Per-Mechanic

When a mechanic changes how the character moves, adjust ecctrl props dynamically:

```jsx
<Ecctrl
  maxVelLimit={myMechanic ? MECHANIC_SPEED : 3}
  sprintMult={myMechanic ? 1 : 1.8}
  jumpVel={myMechanic ? 0 : 4}
  // ...
>
```

This prevents conflicts between ecctrl's built-in movement and your custom mechanic.

---

## Decision Tree

```
Adding a new movement mechanic?
├── Read keyboard input?
│   └── Use useKeyboardControls with selector
├── Need to modify velocity?
│   ├── Replace velocity entirely? → setLinvel
│   ├── Add impulse (one-shot)? → applyImpulse
│   └── Accumulate force? → addForce
├── Mechanic toggles on/off?
│   ├── Add boolean + setter to Zustand store
│   ├── Add keydown listener in Player() component
│   └── Conditionally execute in useFrame
├── Mechanic conflicts with ecctrl movement?
│   ├── Disable ecctrl features via props (jumpVel=0, sprintMult=1)
│   ├── Override specific velocity axes in useFrame
│   └── Or set disableControl for full manual control
├── Need visual feedback?
│   └── Add indicator to HUD.jsx coordinates box
└── Mechanic needs to be on a cooldown/timer?
    └── Store last activation time in a ref, check in useFrame
```

---

## Code Examples

### Complete Flying Mechanic Reference

**Store** (`src/store/useStore.js`):
```js
flyMode: false,
setFlyMode: (mode) => set({ flyMode: mode }),
```

**Player.jsx** (relevant parts):
```jsx
const FLY_SPEED = 3;
const FLY_HORIZONTAL_SPEED = 3;

function Character() {
  const ecctrlRef = useRef();
  const flyMode = useStore((s) => s.flyMode);
  const jumpPressed = useKeyboardControls((state) => state.jump);
  const runPressed = useKeyboardControls((state) => state.run);

  useFrame(() => {
    // Position sync (always)
    if (posRef.current) {
      posRef.current.getWorldPosition(vec.current);
      setPlayerPosition({ x: vec.current.x, y: vec.current.y, z: vec.current.z });
    }

    // Fly mechanic
    if (flyMode && ecctrlRef.current?.group) {
      const rb = ecctrlRef.current.group;
      const vel = rb.linvel();
      if (jumpPressed) vel.y = FLY_SPEED;
      else if (runPressed) vel.y = -FLY_SPEED;
      else vel.y = 0;
      rb.setLinvel(vel, true);
    }
  });

  return (
    <Ecctrl
      ref={ecctrlRef}
      maxVelLimit={flyMode ? FLY_HORIZONTAL_SPEED : 3}
      sprintMult={flyMode ? 1 : 1.8}
      jumpVel={flyMode ? 0 : 4}
    >
      {/* children */}
    </Ecctrl>
  );
}

export default function Player() {
  const setFlyMode = useStore((s) => s.setFlyMode);

  useEffect(() => {
    const handler = (e) => {
      if (e.code === 'KeyF') {
        e.preventDefault();
        setFlyMode(!useStore.getState().flyMode);
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
```

### Adding a Dash Mechanic (Example)

```jsx
// Store
dashCooldown: 0,
setDashCooldown: (t) => set({ dashCooldown: t }),

// Player.jsx
const dashCooldown = useStore((s) => s.dashCooldown);
const dashTimer = useRef(0);

useFrame((_, delta) => {
  // Cooldown timer
  if (dashCooldown > 0) {
    dashTimer.current += delta;
    if (dashTimer.current >= dashCooldown) {
      setDashCooldown(0);
      dashTimer.current = 0;
    }
  }
});

const handleDash = (e) => {
  if (e.code === 'KeyQ' && !useStore.getState().dashCooldown) {
    const rb = ecctrlRef.current?.group;
    if (rb) {
      const vel = rb.linvel();
      vel.z += 10; // Forward dash
      rb.setLinvel(vel, true);
      setDashCooldown(1.5); // 1.5s cooldown
    }
  }
};
```

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|------|
| Mechanic doesn't activate | Key listener not added, or `e.preventDefault()` missing | Add keydown listener with `e.preventDefault()` |
| Velocity override doesn't stick | ecctrl's useFrame runs AFTER yours and overrides | Use `setLinvel` (direct set, not impulse) — ecctrl uses impulses which add, not replace |
| `ecctrlRef.current` is null | Ref not passed to Ecctrl, or component hasn't mounted yet | Check ref is `<Ecctrl ref={ecctrlRef}>` and guard with `?.` |
| `useKeyboardControls` returns undefined | Called outside `<KeyboardControls>` provider | Add it inside the `Character` component (which is INSIDE KeyboardControls) |
| Mechanic toggles on mount | State initializes as `true` | Initialize as `false` in Zustand store |
| Double-activation on key press | `keydown` fires repeatedly while held | Toggle on `keydown` (not `keyup`) and check state before setting |
| Mechanic breaks when selector is open | `controlsDisabled` doesn't affect your key listener | Check `controlsDisabled` in your mechanic's useFrame before executing |

---

## Commands

```bash
npm run dev         # Dev server with HMR
npm run build       # Production build
npm run preview     # Serve build locally
```

## Resources

- **Player Component**: `src/components/character/Player.jsx`
- **Zustand Store**: `src/store/useStore.js`
- **HUD Indicators**: `src/components/ui/HUD.jsx`
- **Keyboard Map**: Defined at top of `src/components/character/Player.jsx`
- **ecctrl Props Reference**: https://github.com/pmndrs/ecctrl
- **drei KeyboardControls**: https://github.com/pmndrs/drei#keyboardcontrols
- **Rapier RigidBody API**: https://rapier.rs/docs/user_guides/javascript/rigid_bodies
