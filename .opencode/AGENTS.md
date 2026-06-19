# studio-web — Project Guide

Proof of concept de experiencia web 3D interactiva con React Three Fiber, física Rapier y personaje controlable.

---

## Stack

| Tool | Versión | Rol |
|------|---------|-----|
| Vite 8 | — | Bundler y dev server |
| React 19 | — | UI framework |
| Three.js | ^0.184.0 | Motor 3D |
| @react-three/fiber | ^9.6.1 | Renderer React para Three.js |
| @react-three/drei | ^10.7.7 | Utilidades R3F (useGLTF, useAnimations, KeyboardControls) |
| @react-three/rapier | ^2.2.0 | Física (RigidBody, CuboidCollider) |
| ecctrl | ^1.0.97 | Character controller con WASD + joystick táctil |
| three-mesh-bvh | ^0.9.10 | BVH acelerado para raycasting en mallas estáticas |
| GSAP | ^3.15.0 | Animaciones de cámara (transiciones third-person ↔ overview) |
| Zustand | ^5.0.13 | Estado global |

---

## Arquitectura

```
src/
├── components/
│   ├── world/           # Elementos del mundo 3D
│   │   ├── Scene.jsx    # Composición raíz: luces + Physics + todos los elementos
│   │   ├── SceneEnvironment.jsx # Carga de GLB como escenario con física + hover + BVH
│   │   ├── Ground.jsx   # (deprecated — reemplazado por SceneEnvironment)
│   │   ├── VitrineInteraction.jsx # Zona de interacción por proximidad con minijuego
│   │   └── Obstacles.jsx# (deprecated — reemplazado por SceneEnvironment)
│   ├── character/       # Personaje y cámara
│   │   ├── Player.jsx   # Cápsula controlable con ecctrl + WASD + fly mode (F)
│   │   ├── CharacterModel.jsx # Carga de modelo GLB con animaciones
│   │   └── CameraRig.jsx# Transición de cámara con GSAP (tecla M)
│   └── ui/              # Overlays HTML sobre el canvas
│       ├── HUD.jsx      # Coordenadas, FPS, botón toggle, fly mode indicator
│       ├── InfoCard.jsx # Tarjeta informativa al hacer hover en objetos
│       └── StartScreen.jsx# Splash screen con precarga + barra de progreso
├── store/
│   └── useStore.js      # Estado global Zustand
├── data/
│   └── objects.json     # Datos descriptivos de objetos interactivos del escenario
├── App.jsx              # Canvas + overlays
├── main.jsx             # Entry point + BVH prototype extension
└── index.css            # Reset full viewport

public/
├── scenes/
│   └── tecsup2.glb      # Escenario 3D del campus (compressed GLB)
└── models/
    └── *.glb            # Personajes jugables (Draco-compressed)
```

---

## Patrones Críticos

### 1. Geometrías estáticas → BVH + dispose

Toda geometría estática (suelo, obstáculos, escenario GLB) DEBE:
- Llamar `computeBoundsTree()` en `useEffect` después de cargar
- Llamar SOLO `disposeBoundsTree()` en el cleanup (NUNCA `geometry.dispose()` — las geometrías del GLB son cacheadas por useGLTF)

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

### 2. Física con Rapier

- Escenario GLB: `RigidBody type="fixed" colliders="trimesh"` sobre el `<primitive object={scene}>`
- La transformación (scale + position) debe ser **síncrona** en el cuerpo del componente, no en useEffect
- `timeStep="vary"` en Physics para sincronizar con el framerate
- Personaje: ecctrl maneja su propio RigidBody dinámico internamente
- Las coordenadas CAD del GLB se normalizan con `scene.scale` + `scene.position` (NO bakear en vértices)

### 3. Character Controller (ecctrl)

- KeyboardControls con keyboardMap definen las teclas
- La cámara sigue al personaje automáticamente via ecctrl
- `disableFollowCam` controla si ecctrl mueve la cámara (útil para transiciones)
- La posición del personaje se trackea con `getWorldPosition()` en `useFrame` sobre un `group` dentro de ecctrl
- Fly mode: tecla F togglea, Space sube, Shift baja, WASD horizontal, hover al soltar

### 4. Transición de cámara (GSAP)

- Tecla **M** o botón en HUD disparan la transición
- **Ida** (thirdPerson → overview): `setCameraMode('overview')` inmediato → ecctrl suelta la cámara → GSAP anima a y=20
- **Vuelta** (overview → thirdPerson): GSAP anima primero → al completar `setCameraMode('thirdPerson')` → ecctrl retoma
- El HUD dispara con `window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM' }))` para no acoplar componentes

### 5. Hover Info Cards (R3F events sobre el GLB)

- Se usa `onPointerMove`/`onPointerOut` sobre el `<primitive object={scene}>`
- `e.object` es el mesh real bajo el cursor — se identifica por `e.object.name`
- El handler compara el nombre contra `objects.json` y actualiza `hoveredObject` en Zustand
- El glow emissivo se aplica directamente al material del mesh, guardando/restaurando el estado original via `userData`
- InfoCard reacciona al store y anima con GSAP (fade in/out)

### 6. Modelo 3D con animaciones

- Ver skill `character-model` para el detalle completo
- Los modelos GLB con Draco van en `public/models/`
- `useGLTF` maneja Draco automáticamente
- `useAnimations(animations, scene)` — el segundo argumento `scene` es OBLIGATORIO

### 7. Escenario 3D desde GLB

- Ver skill `scene-model` para el detalle completo
- Los escenarios GLB van en `public/scenes/`
- Se cargan con `useGLTF`, física trimesh, y transformación síncrona de coordenadas
- Los objetos interactivos se mapean desde `objects.json` por nombre de mesh del GLB

---

## Estado Global (Zustand)

```js
{
  cameraMode: 'thirdPerson' | 'overview',
  setCameraMode: (mode) => set({ cameraMode: mode }),

  playerPosition: { x, y, z },
  setPlayerPosition: (pos) => set({ playerPosition: pos }),

  hoveredObject: null | { id, name, description },
  setHoveredObject: (obj) => set({ hoveredObject: obj }),
}
```

---

## Skills del proyecto

| Contexto | Skill |
|----------|-------|
| Cargar modelos GLB con Draco, animaciones, useGLTF, useAnimations, integrar con ecctrl | character-model |
| Cargar escenarios GLB con física Rapier, transformación de coordenadas CAD, hover detection con R3F events, BVH | scene-model |
| Agregar mecánicas de movimiento (vuelo, dash, etc.) usando useKeyboardControls + ecctrlRef + setLinvel | game-mechanics |
| Crear zonas de interacción por proximidad que disparan un minijuego al acercarse (vitrina-style), con detección distancia, prompt [E] y enlace al juego | vitrine-interaction |

---

## Comandos

```bash
npm run dev      # Dev server con HMR
npm run build    # Build producción
npm run preview  # Servir build localmente
npm run lint     # ESLint
```

---

## Convenciones

- **Nombres de archivo**: kebab-case para assets (`hoodie-character.glb`), PascalCase para componentes (`InfoCard.jsx`)
- **Imports**: siempre relativos, sin alias de path
- **Eventos R3F**: `onPointerOver`/`onPointerOut` en meshes, `stopPropagation` para aislar
- **Dispose**: toda geometría estática con cleanup en useEffect
- **GSAP**: guardar ref al timeline (`.kill()` en cleanup y antes de crear uno nuevo)
