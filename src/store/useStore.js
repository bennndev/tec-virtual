import { create } from 'zustand';

const useStore = create((set) => ({
  playerPosition: { x: 0, y: 0, z: 0 },
  setPlayerPosition: (pos) => set({ playerPosition: pos }),

  // Estado hover para tarjetas de informacion
  hoveredObject: null, // { id, name, description } | null
  setHoveredObject: (obj) => set({ hoveredObject: obj }),

  // Personaje jugable activo
  activeCharacter: 'character1',
  setActiveCharacter: (id) => set({ activeCharacter: id }),

  // Camera mode: thirdPerson (cerca) | overview (vista aguila)
  cameraMode: 'thirdPerson',
  setCameraMode: (mode) => set({ cameraMode: mode }),

  // Character selector overlay
  isSelectorOpen: false,
  setSelectorOpen: (open) => set({ isSelectorOpen: open, controlsDisabled: open }),

  // Personaje seleccionado actualmente en el selector (no necesariamente el activo)
  previewCharacter: 'character1',
  setPreviewCharacter: (id) => set({ previewCharacter: id }),

  // Bloqueo de controles del personaje (activo mientras el selector está abierto)
  controlsDisabled: false,
  setControlsDisabled: (disabled) => set({ controlsDisabled: disabled }),
}));

export default useStore;
