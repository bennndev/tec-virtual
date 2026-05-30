# Tec-Virtual

Experiencia web 3D interactiva con React Three Fiber, física Rapier y personajes controlables.

## Stack

| Herramienta | Versión | Rol |
|-------------|---------|-----|
| Vite | 8 | Bundler y dev server |
| React | 19 | UI framework |
| Three.js | ^0.184.0 | Motor 3D |
| @react-three/fiber | ^9.6.1 | Renderer React para Three.js |
| @react-three/drei | ^10.7.7 | Utilidades R3F |
| @react-three/rapier | ^2.2.0 | Física |
| ecctrl | ^1.0.97 | Character controller |
| three-mesh-bvh | ^0.9.10 | BVH para raycasting |
| GSAP | ^3.15.0 | Animaciones de cámara |
| Zustand | ^5.0.13 | Estado global |

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Estructura del proyecto

```
src/
├── components/
│   ├── world/         # Elementos del mundo 3D (escena, suelo, obstáculos)
│   ├── character/     # Personajes, player, cámara
│   └── ui/            # Overlays HTML (HUD, selector de personaje, tarjetas)
├── store/             # Estado global con Zustand
├── data/              # Configuraciones y datos estáticos
├── App.jsx            # Punto de entrada de la app
└── main.jsx           # Entry point + extensión BVH

public/
└── models/            # Modelos GLB de personajes
```

## Controles

| Tecla | Acción |
|-------|--------|
| W / A / S / D / Flechas | Movimiento del personaje |
| Shift | Correr |
| Espacio | Saltar |
| M | Alternar cámara (tercera persona / vista general) |
| O | Cambiar de personaje |
