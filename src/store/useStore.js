import { create } from 'zustand';

const useStore = create((set) => ({
  playerPosition: { x: 0, y: 0, z: 0 },
  setPlayerPosition: (pos) => set({ playerPosition: pos }),

  // Dirección de la cámara del jugador (yaw) para rotar el ícono en el minimapa
  playerRotation: 0,
  setPlayerRotation: (rot) => set({ playerRotation: rot }),

  // Minimap data
  isMapModalOpen: false,
  setMapModalOpen: (isOpen) => set({ isMapModalOpen: isOpen }),

  mapBounds: { minX: -100, maxX: 100, minZ: -100, maxZ: 100 }, // Fallback bounds
  setMapBounds: (bounds) => set({ mapBounds: bounds }),
  
  mapMarkers: [],
  setMapMarkers: (markers) => set({ mapMarkers: markers }),

  // Estado hover para tarjetas de informacion
  hoveredObject: null, // { id, name, description } | null
  setHoveredObject: (obj) => set({ hoveredObject: obj }),

  // Personaje jugable activo
  activeCharacter: 'alejandro',
  setActiveCharacter: (id) => set({ activeCharacter: id }),

  // Camera mode: thirdPerson (cerca) | overview (vista aguila)
  cameraMode: 'thirdPerson',
  setCameraMode: (mode) => set({ cameraMode: mode }),

  // Character selector overlay
  isSelectorOpen: false,
  setSelectorOpen: (open) => set({ isSelectorOpen: open, controlsDisabled: open }),

  // Personaje seleccionado actualmente en el selector (no necesariamente el activo)
  previewCharacter: 'alejandro',
  setPreviewCharacter: (id) => set({ previewCharacter: id }),

  // Bloqueo de controles del personaje (activo mientras el selector está abierto)
  controlsDisabled: false,
  setControlsDisabled: (disabled) => set({ controlsDisabled: disabled }),

  // Audio de fondo
  musicMuted: false,
  toggleMusic: () => set((state) => ({ musicMuted: !state.musicMuted })),

  // Intro animación inicial
  isIntro: false,
  setIntro: () => set({ isIntro: true }),
  setEndIntro: () => set({ isIntro: false }),

  // Modo vuelo: Space = subir, Shift = bajar, WASD = mover, F = toggle
  flyMode: false,
  setFlyMode: (mode) => set({ flyMode: mode }),

  // --- NAVEGACIÓN 3D ---
  navigationTarget: null, // { id, name, x, y, z }
  navigationPath: [], // [Vector3, Vector3, ...]
  isNavigating: false,
  arrivalTargetName: null, // Nombre del destino al que se llegó
  
  setNavigationTarget: (target, path) => set({ 
    navigationTarget: target,
    navigationPath: path,
    isNavigating: true,
  }),
  
  clearNavigation: () => set({
    navigationTarget: null,
    navigationPath: [],
    isNavigating: false,
  }),

  setArrivalTargetName: (name) => set({ arrivalTargetName: name }),
}));

export default useStore;
