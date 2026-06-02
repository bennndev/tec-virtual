---
name: scene-model
description: >
  Load GLB/GLTF scene environments with physics, hover interaction, and
  coordinate normalization in React Three Fiber + Rapier.
  Covers GLB loading, trimesh colliders, synchronous scaling/centering,
  BVH raycasting, and hover detection via R3F events for this project.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

Use this skill when:
- Loading a GLB/GLTF scene as a static physics environment (campus, building, map)
- Setting up Rapier trimesh colliders from a loaded GLB scene
- Normalizing CAD-scaled coordinates to game units (scale + center)
- Adding hover interaction (InfoCard + emissive glow) to scene objects
- Computing BVH on scene geometry for accelerated raycasting
- Handling multiple scene versions with different mesh names
- Preloading the scene for instant startup

---

## Critical Patterns

### Pattern 1: Scene Asset Organization

**ALWAYS** place scene GLB/GLTF files in `public/scenes/`.

```
# ✅ CORRECT — public/ files are served as static assets
public/scenes/tecsup2.glb
```

In Vite, only `public/` is copied to `dist/` as-is. Files elsewhere are NOT accessible at runtime.

**Naming convention**: Use kebab-case, no spaces. Version by changing the filename:
```
public/scenes/tecsup.glb          # v1
public/scenes/tecsup2.glb         # v2 (compressed/updated)
```

### Pattern 2: Scene Loading + Physics (Core Architecture)

Load the scene with `useGLTF` and wrap it in a `RigidBody type="fixed" colliders="trimesh"`:

```jsx
import { useGLTF } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';

useGLTF.preload('/scenes/tecsup2.glb');

export default function SceneEnvironment() {
  const { scene } = useGLTF('/scenes/tecsup2.glb');

  return (
    <>
      {/* Fallback floor at -200 depth — catches falls if trimesh fails */}
      <CuboidCollider args={[60, 0.25, 60]} position={[0, -200, 0]} />

      <RigidBody type="fixed" colliders="trimesh">
        <primitive object={scene} />
      </RigidBody>
    </>
  );
}
```

**Key points**:
- `colliders="trimesh"` creates accurate triangle-mesh colliders from ALL geometry in the scene
- Rapier **respects parent transforms** — setting `scene.scale` and `scene.position` works correctly
- The `<primitive>` component adds the existing THREE.Group to the R3F scene graph
- `CuboidCollider` at `y=-200` is a safety net; positioned far down to not interfere with gameplay
- MUST be inside `<Suspense>` (useGLTF suspends) and `<Physics>` (Rapier provider)

### Pattern 3: Synchronous Coordinate Normalization (CRITICAL)

GLB files exported from CAD/architecture tools use **millimeter or arbitrary units** with coordinates in the thousands. These MUST be normalized to game units (~100 wide) with the ground at `y=0`.

Apply the transform **synchronously in the component body** — BEFORE Rapier builds colliders:

```jsx
export default function SceneEnvironment() {
  const { scene } = useGLTF('/scenes/tecsup2.glb');

  // ============================================================
  // SYNCHRONOUS TRANSFORM — runs during render, before Rapier
  // ============================================================
  if (!scene.userData._sceneTransformed) {
    // 1. Calculate original bounding box
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.z);
    const scale = TARGET_SIZE / maxDim; // TARGET_SIZE ≈ 100

    // 2. Remove lights/cameras from GLB (use custom lighting instead)
    scene.traverse((child) => {
      if (child.isLight || child.isCamera) child.removeFromParent();
    });

    // 3. Apply scale + position to the ROOT group (NOT to vertices)
    scene.scale.set(scale, scale, scale);
    scene.position.set(
      -center.x * scale,
      -box.min.y * scale,  // floor → y=0
      -center.z * scale,
    );

    // 4. Force world matrix update for Rapier to see the transform
    scene.updateMatrixWorld(true);
    scene.userData._sceneTransformed = true;
  }

  return ( ... );
}
```

**Why synchronous**: Rapier generates colliders when the RigidBody mounts (commit phase). If the transform is in a `useEffect`, Rapier has already built colliders from the un-transformed coordinates. **Synchronous execution in the component body ensures Rapier sees the correct world matrices.**

**Why scene.scale/position NOT vertex baking**: Rapier respects parent transforms. Setting `scene.scale` and `scene.position` on the root group is cleaner and avoids mixing local vertex coordinates with world bounding box centers (which destroys geometry).

**StrictMode safety**: Guard with `scene.userData._sceneTransformed` to prevent double-transform on StrictMode double-invoke.

### Pattern 4: BVH for Accelerated Raycasting

Compute BVH on all meshes after the scene is loaded (in `useEffect` — geometry hasn't changed):

```jsx
useEffect(() => {
  const meshes = [];
  scene.traverse((child) => {
    if (child.isMesh && child.geometry) {
      child.geometry.computeBoundsTree();
      meshes.push(child);
    }
  });

  return () => {
    meshes.forEach((mesh) => {
      if (mesh.geometry) mesh.geometry.disposeBoundsTree();
    });
  };
}, [scene]);
```

**IMPORTANT**: Only call `disposeBoundsTree()` in cleanup. NEVER call `geometry.dispose()` — the geometry is cached by `useGLTF` and shared across renders.

### Pattern 5: Hover Detection with R3F Events

Use `onPointerMove`/`onPointerOut` on the `<primitive>` element. R3F's event system provides `e.object` (the actual THREE.Mesh under the cursor) — use `e.object.name` to identify interactive objects:

```jsx
const previousMesh = useRef(null);

const handlePointerMove = useCallback((e) => {
  e.stopPropagation();
  const mesh = e.object;
  if (mesh === previousMesh.current) return;
  if (!mesh.isMesh) return;

  // Restore previous mesh's emissive
  if (previousMesh.current) restoreMesh(previousMesh.current);
  previousMesh.current = mesh;

  // Check if this mesh is an interactive object
  if (mesh.name && objectsData[mesh.name]) {
    applyHover(mesh);
    setHoveredObject({ id: mesh.name, ...objectsData[mesh.name] });
  } else {
    setHoveredObject(null);
  }
}, [setHoveredObject, restoreMesh, applyHover]);

const handlePointerOut = useCallback(() => {
  if (previousMesh.current) {
    restoreMesh(previousMesh.current);
    previousMesh.current = null;
  }
  setHoveredObject(null);
}, [setHoveredObject, restoreMesh]);
```

**How it works**: R3F's event system tracks raycasting against all objects in the scene graph. The `<primitive>` fires `onPointerMove` for every child mesh the cursor passes over. `e.object` gives you the actual hit mesh. By comparing `mesh.name` against `objectsData`, you can show the InfoCard for known objects.

### Pattern 6: Emissive Glow on Hover

Save and restore each mesh's original emissive state using `userData`:

```jsx
const saveOriginalEmissive = useCallback((mesh) => {
  if (!mesh.userData._origEmissive && mesh.material) {
    const mat = mesh.material;
    mesh.userData._origEmissive = mat.emissive ? mat.emissive.clone() : new THREE.Color(0x000000);
    mesh.userData._origEmissiveIntensity = mat.emissiveIntensity ?? 0;
  }
}, []);

const restoreMesh = useCallback((mesh) => {
  if (mesh.material && mesh.userData._origEmissive) {
    const mat = mesh.material;
    mat.emissive.copy(mesh.userData._origEmissive);
    mat.emissiveIntensity = mesh.userData._origEmissiveIntensity;
  }
}, []);

const applyHover = useCallback((mesh) => {
  if (!mesh.material) return;
  saveOriginalEmissive(mesh);
  mesh.material.emissive.copy(new THREE.Color('#ffffff'));
  mesh.material.emissiveIntensity = 0.4;
}, [saveOriginalEmissive]);
```

### Pattern 7: Interactive Objects Data (objects.json)

Map GLB mesh names to display data in `src/data/objects.json`:

```json
{
  "stand05": {
    "name": "Stand de Información",
    "description": "Punto de información del evento. Aquí puedes encontrar mapas, horarios y resolver dudas sobre las actividades."
  },
  "CarrerasAdmision": {
    "name": "Carreras y Admisión",
    "description": "Información sobre las carreras profesionales y el proceso de admisión a la institución."
  }
}
```

**Keys MUST match the GLB mesh/node names exactly** — case-sensitive. To find available names, inspect the GLB structure:

```bash
node -e "
const fs = require('fs');
const buf = fs.readFileSync('public/scenes/tecsup2.glb');
const jsonLen = buf.readUInt32LE(12);
const jsonStr = buf.toString('utf-8', 20, 20 + jsonLen);
const json = JSON.parse(jsonStr);
json.nodes.forEach((n, i) => { if (n.name) console.log(i + ':', n.name); });
"
```

### Pattern 8: Scene Preloading

Add the scene GLB to the **StartScreen** preload list so it downloads while the splash screen is shown:

```jsx
const ASSETS = [
  { type: 'model', path: '/scenes/tecsup2.glb' },
  // ... other models
];
```

Also call `useGLTF.preload()` in the SceneEnvironment module scope for instant loading on subsequent visits:

```jsx
useGLTF.preload('/scenes/tecsup2.glb');
```

---

## Decision Tree

```
Load a new scene GLB?
├── Place file in public/scenes/ with kebab-case name
├── Update StartScreen.jsx preload list
├── Call useGLTF.preload() in SceneEnvironment module scope
├── Run dev server → check if scene loads
├── Scene coordinates are CAD-huge (mm scale)?
│   └── Add synchronous transform with scene.scale + scene.position
├── Need hover interaction on certain objects?
│   ├── Add mesh name entries to objects.json
│   ├── Confirm names exist in GLB (use node script above)
│   └── SceneEnvironment handles hover automatically
├── Ground collision not working?
│   ├── Verify CuboidCollider fallback is at y=-200
│   ├── Check Rapier trimesh is being generated (no console errors)
│   └── Try wrapping scene in <RigidBody colliders="trimesh">
├── Character falls through ground despite trimesh?
│   ├── Move fallback CuboidCollider closer (e.g., y=-2)
│   └── Or use a simple CuboidCollider at y=0 as primary floor
└── Scene version changed (new GLB file)?
    ├── Update path in SceneEnvironment.jsx
    ├── Update StartScreen.jsx preload
    ├── Verify objects.json mesh names exist in new GLB
    └── Re-check bounding box for new coordinates
```

---

## File Organization (this project)

```
tec-virtual/
├── public/scenes/
│   └── tecsup2.glb                    # Scene environment GLB
├── src/
│   ├── data/
│   │   └── objects.json               # Interactive objects display data
│   ├── components/
│   │   └── world/
│   │       ├── SceneEnvironment.jsx    # GLB loader + physics + hover + BVH
│   │       ├── Scene.jsx              # Scene composition (lighting + Physics wrapper)
│   │       ├── Ground.jsx             # (deprecated — replaced by SceneEnvironment)
│   │       └── Obstacles.jsx          # (deprecated — replaced by SceneEnvironment)
│   ├── components/ui/
│   │   ├── HUD.jsx                    # Shows coordinates + fly mode indicator
│   │   ├── InfoCard.jsx               # Hover info card (reacts to hoveredObject)
│   │   └── StartScreen.jsx            # Splash screen with preload progress bar
│   └── store/
│       └── useStore.js                # hoveredObject, flyMode, playerPosition
└── .opencode/skills/scene-model/
    └── SKILL.md                       # This file
```

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| Character falls through ground | Scene coordinates are CAD-scale (huge), Rapier built colliders before transform | Add synchronous scene.scale + scene.position transform in component body |
| Scene looks like it has holes/empty space | Vertex-level baking mixed local coordinates with world bounding box center | Use scene.scale/position on root group instead (Rapier respects parent transforms) |
| Character can't fly above certain height | CuboidCollider fallback is too close to play area | Move fallback to y=-200 |
| Hover doesn't show InfoCard | Mesh name in objects.json doesn't match GLB node name exactly | Run the node inspection script to verify exact names |
| Scene loads slowly / blank frame | Not preloaded in StartScreen | Add GLB path to ASSETS array in StartScreen.jsx |
| `useGLTF.preload` has no effect | Path doesn't match the one used in SceneEnvironment | Use EXACT same path string in preload and useGLTF |
| Scene appears twice (duplicated) | Another component also renders the same GLB (e.g., deprecated Ground + Obstacles still present) | Remove old components from Scene.jsx |
| Collider doesn't match visual | Scene transform was applied AFTER Rapier mounted | Move transform to component body (synchronous), not useEffect |

---

## Code Examples

### Complete SceneEnvironment.jsx

```jsx
import { useEffect, useRef, useCallback } from 'react';
import { useGLTF } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import objectsData from '../../data/objects.json';
import useStore from '../../store/useStore';

const HOVER_COLOR = new THREE.Color('#ffffff');
const TARGET_SIZE = 100;

useGLTF.preload('/scenes/tecsup2.glb');

export default function SceneEnvironment() {
  const { scene } = useGLTF('/scenes/tecsup2.glb');
  const setHoveredObject = useStore((s) => s.setHoveredObject);
  const previousMesh = useRef(null);

  // --- SYNCHRONOUS TRANSFORM ---
  if (!scene.userData._sceneTransformed) {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.z);
    const scale = TARGET_SIZE / maxDim;

    scene.traverse((child) => {
      if (child.isLight || child.isCamera) child.removeFromParent();
    });

    scene.scale.set(scale, scale, scale);
    scene.position.set(
      -center.x * scale,
      -box.min.y * scale,
      -center.z * scale,
    );
    scene.updateMatrixWorld(true);
    scene.userData._sceneTransformed = true;
  }

  // --- BVH ---
  useEffect(() => {
    const meshes = [];
    scene.traverse((child) => {
      if (child.isMesh && child.geometry) {
        child.geometry.computeBoundsTree();
        meshes.push(child);
      }
    });
    return () => {
      meshes.forEach((mesh) => {
        if (mesh.geometry) mesh.geometry.disposeBoundsTree();
      });
    };
  }, [scene]);

  // --- HOVER HANDLERS ---
  const saveOriginalEmissive = useCallback((mesh) => {
    if (!mesh.userData._origEmissive && mesh.material) {
      mesh.userData._origEmissive = mesh.material.emissive
        ? mesh.material.emissive.clone()
        : new THREE.Color(0x000000);
      mesh.userData._origEmissiveIntensity = mesh.material.emissiveIntensity ?? 0;
    }
  }, []);

  const restoreMesh = useCallback((mesh) => {
    if (mesh.material && mesh.userData._origEmissive) {
      mesh.material.emissive.copy(mesh.userData._origEmissive);
      mesh.material.emissiveIntensity = mesh.userData._origEmissiveIntensity;
    }
  }, []);

  const applyHover = useCallback((mesh) => {
    if (!mesh.material) return;
    saveOriginalEmissive(mesh);
    mesh.material.emissive.copy(HOVER_COLOR);
    mesh.material.emissiveIntensity = 0.4;
  }, [saveOriginalEmissive]);

  const handlePointerMove = useCallback((e) => {
    e.stopPropagation();
    const mesh = e.object;
    if (mesh === previousMesh.current) return;
    if (!mesh.isMesh) return;

    if (previousMesh.current) restoreMesh(previousMesh.current);
    previousMesh.current = mesh;

    if (mesh.name && objectsData[mesh.name]) {
      applyHover(mesh);
      setHoveredObject({ id: mesh.name, ...objectsData[mesh.name] });
    } else {
      setHoveredObject(null);
    }
  }, [setHoveredObject, restoreMesh, applyHover]);

  const handlePointerOut = useCallback(() => {
    if (previousMesh.current) {
      restoreMesh(previousMesh.current);
      previousMesh.current = null;
    }
    setHoveredObject(null);
  }, [setHoveredObject, restoreMesh]);

  return (
    <>
      <CuboidCollider args={[60, 0.25, 60]} position={[0, -200, 0]} />
      <RigidBody type="fixed" colliders="trimesh">
        <primitive
          object={scene}
          onPointerMove={handlePointerMove}
          onPointerOut={handlePointerOut}
        />
      </RigidBody>
    </>
  );
}
```

### objects.json (interactive object data)

```json
{
  "stand05": {
    "name": "Stand de Información",
    "description": "Punto de información del evento. Aquí puedes encontrar mapas, horarios y resolver dudas sobre las actividades."
  },
  "CarrerasAdmision": {
    "name": "Carreras y Admisión",
    "description": "Información sobre las carreras profesionales y el proceso de admisión a la institución."
  }
}
```

---

## Quick Start Checklist

When integrating a NEW scene GLB:

1. [ ] Place `.glb` file in `public/scenes/` with kebab-case name
2. [ ] Run node script to inspect mesh names (for objects.json)
3. [ ] Update `useGLTF.preload()` and `useGLTF()` paths in `SceneEnvironment.jsx`
4. [ ] Update ASSETS array in `StartScreen.jsx`
5. [ ] Update `objects.json` with mesh names that exist in the new GLB
6. [ ] Run dev server → verify scene loads and character stands on ground
7. [ ] If scene coordinates are CAD-huge: verify synchronous transform is working
8. [ ] Test hover on interactive objects (InfoCard + glow)
9. [ ] Test fly mode (F key) to explore all areas

---

## Commands

```bash
npm run dev         # Dev server with HMR
npm run build       # Production build
npm run preview     # Serve build locally
```

## Resources

- **Scene Environment Component**: `src/components/world/SceneEnvironment.jsx`
- **Scene Composition**: `src/components/world/Scene.jsx`
- **Interactive Objects Data**: `src/data/objects.json`
- **HUD with coordinates**: `src/components/ui/HUD.jsx`
- **InfoCard (hover overlay)**: `src/components/ui/InfoCard.jsx`
- **StartScreen (preload)**: `src/components/ui/StartScreen.jsx`
- **Zustand Store**: `src/store/useStore.js`
- **drei useGLTF docs**: https://github.com/pmndrs/drei#usegltf
- **react-three-rapier docs**: https://github.com/pmndrs/react-three-rapier
- **ecctrl README**: https://github.com/pmndrs/ecctrl
