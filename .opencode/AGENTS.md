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
│   │   ├── Ground.jsx   # Suelo con física estática + BVH
│   │   └── Obstacles.jsx# Obstáculos con hover detection + BVH
│   ├── character/       # Personaje y cámara
│   │   ├── Player.jsx   # Cápsula controlable con ecctrl + WASD
│   │   ├── CharacterModel.jsx # Carga de modelo GLB con animaciones
│   │   └── CameraRig.jsx# Transición de cámara con GSAP (tecla M)
│   └── ui/              # Overlays HTML sobre el canvas
│       ├── HUD.jsx      # Coordenadas, FPS, botón toggle
│       └── InfoCard.jsx # Tarjeta informativa al hacer hover en objetos
├── store/
│   └── useStore.js      # Estado global Zustand
├── data/
│   └── objects.json     # Datos descriptivos de los obstáculos
├── App.jsx              # Canvas + overlays
├── main.jsx             # Entry point + BVH prototype extension
└── index.css            # Reset full viewport

public/
└── models/
    └── hoodie-character.glb  # Modelo del personaje (Draco-compressed)
```

---

## Patrones Críticos

### 1. Geometrías estáticas → BVH + dispose

Toda geometría estática (suelo, obstáculos) DEBE:
- Tener un `ref` en la geometría para llamar `computeBoundsTree()` en `useEffect`
- Llamar `disposeBoundsTree()` y `geometry.dispose()` en el cleanup

```jsx
const geomRef = useRef();

useEffect(() => {
  if (geomRef.current) geomRef.current.computeBoundsTree();
  return () => {
    if (geomRef.current) {
      geomRef.current.disposeBoundsTree();
      geomRef.current.dispose();
    }
  };
}, []);
```

### 2. Física con Rapier

- `colliders={false}` en RigidBody estáticos y colliders manuales con CuboidCollider
- `timeStep="vary"` en Physics para sincronizar con el framerate
- Obstáculos: `type="fixed"`, personaje: ecctrl maneja su propio RigidBody dinámico
- Los eventos pointer events de R3F funcionan dentro de RigidBody con `colliders={false}`

### 3. Character Controller (ecctrl)

- KeyboardControls con keyboardMap definen las teclas
- La cámara sigue al personaje automáticamente via ecctrl
- `disableFollowCam` controla si ecctrl mueve la cámara (útil para transiciones)
- La posición del personaje se trackea con `getWorldPosition()` en `useFrame` sobre un `group` dentro de ecctrl

### 4. Transición de cámara (GSAP)

- Tecla **M** o botón en HUD disparan la transición
- **Ida** (thirdPerson → overview): `setCameraMode('overview')` inmediato → ecctrl suelta la cámara → GSAP anima a y=20
- **Vuelta** (overview → thirdPerson): GSAP anima primero → al completar `setCameraMode('thirdPerson')` → ecctrl retoma
- El HUD dispara con `window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM' }))` para no acoplar componentes

### 5. Hover Info Cards (pointer events)

- Cada mesh en Obstacles tiene `onPointerOver` y `onPointerOut`
- El handler lee de `objects.json` por `objectId` y actualiza `hoveredObject` en Zustand
- `e.stopPropagation()` para evitar burbujeo
- InfoCard reacciona al store y anima con GSAP (fade in/out)
- React 18 automatic batching evita flicker entre objetos

### 6. Modelo 3D con animaciones

- Ver skill `character-model` para el detalle completo
- Los modelos GLB con Draco van en `public/models/`
- `useGLTF` maneja Draco automáticamente
- `useAnimations(animations, scene)` — el segundo argumento `scene` es OBLIGATORIO

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
