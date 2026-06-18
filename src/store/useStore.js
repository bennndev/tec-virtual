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

  // Flujo del juego
  gameState: 'loading', // 'loading' | 'tutorial' | 'character_select' | 'game'
  setGameState: (state) => set({ gameState: state }),

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

  // --- DIÁLOGOS E INTERACCIÓN ---
  interactableNPC: null,
  setInteractableNPC: (npc) => set({ interactableNPC: npc }),

  dialogueQueue: [],
  currentDialogueIndex: 0,
  isDialogueActive: false,
  activeDialogueNPC: null,
  
  startDialogue: (messages, npc = null) => set((state) => ({ 
    dialogueQueue: messages, 
    currentDialogueIndex: 0, 
    isDialogueActive: true,
    activeDialogueNPC: npc || state.interactableNPC,
    controlsDisabled: true // Bloquea al jugador mientras habla
  })),
  
  nextDialogue: () => set((state) => {
    // Avanzar si hay más mensajes
    if (state.currentDialogueIndex < state.dialogueQueue.length - 1) {
      return { currentDialogueIndex: state.currentDialogueIndex + 1 };
    } else {
      // Fin del diálogo -> Disparar Escena 03 (Selector de avatar)
      const nextState = { 
        isDialogueActive: false, 
        dialogueQueue: [], 
        currentDialogueIndex: 0,
        activeDialogueNPC: null,
        isSelectorOpen: true, // Abre el selector automáticamente
        // No rehabilitamos controlsDisabled porque isSelectorOpen ya requiere controles bloqueados
      };
      if (state.gameState === 'tutorial') {
        nextState.gameState = 'character_select';
      }
      return nextState;
    }
  }),

  previousDialogue: () => set((state) => {
    // Retroceder si no estamos en el primer diálogo
    if (state.currentDialogueIndex > 0) {
      return { currentDialogueIndex: state.currentDialogueIndex - 1 };
    }
    return {};
  }),

  skipDialogue: () => set((state) => {
    if (state.dialogueQueue.length > 0) {
      return { currentDialogueIndex: state.dialogueQueue.length - 1 };
    }
    return {};
  }),
  
  endDialogue: () => set({ 
    isDialogueActive: false, 
    dialogueQueue: [], 
    currentDialogueIndex: 0,
    activeDialogueNPC: null,
    controlsDisabled: false
  }),
}));

export default useStore;
