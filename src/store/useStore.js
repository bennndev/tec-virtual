import { create } from 'zustand';
import { pathfinder } from '../services/pathfinding';

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

  // Teletransporte del jugador (coordinado con Rapier)
  teleportTarget: null, // [x, y, z] | null
  setTeleportTarget: (pos) => set({ teleportTarget: pos }),

  // Zonas de TP detectadas automáticamente del GLB: { [meshName]: [x, y, z] }
  tpZones: {},
  setTpZones: (zones) => set({ tpZones: zones }),

  // EnEx confirmation modal: { label: string, target: [x,y,z] } | null
  pendingEnex: null,

  // Unix ms timestamp — EnEx detection is blocked until Date.now() > this value.
  // Both EnExLights (open) and EnExConfirmModal (confirm) write to this field
  // via a single atomic useStore.setState() call so there is no timing gap.
  enexBlockedUntil: 0,

  // Estado de transición de la cámara
  isTransitioningCamera: false,
  setTransitioningCamera: (val) => set({ isTransitioningCamera: val }),

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
      // Fin del diálogo — cerrar limpiamente
      const nextState = { 
        isDialogueActive: false, 
        dialogueQueue: [], 
        currentDialogueIndex: 0,
        activeDialogueNPC: null,
        controlsDisabled: false,
      };
      // Solo en el tutorial se abre el selector al terminar
      if (state.gameState === 'tutorial') {
        nextState.isSelectorOpen = true;
        nextState.controlsDisabled = true;
        nextState.gameState = 'character_select';
      }
      // Si hablamos con PaquitoBot, activar navegación
      if (state.activeDialogueNPC?.id === 'paquito-bot') {
        if (state.npcPositionOverrides?.['paquito-bot']) {
          // Ya fue teletransportado → segundo diálogo: navegar a redes
          const redesZone = state.tpZones?.zona_laboratorio_redes;
          if (redesZone) {
            const targetPos = { x: redesZone[0], y: redesZone[1], z: redesZone[2] };
            const startPos = state.playerPosition;
            const path = pathfinder.calculatePath(startPos, targetPos);
            nextState.navigationTarget = { id: 'zona_laboratorio_redes', name: 'Laboratorio de Redes', ...targetPos };
            nextState.navigationPath = path;
            nextState.isNavigating = true;
          }
        } else {
          // Primer diálogo: navegar a marketing
          const marketingZone = state.tpZones?.zona_laboratorio_marketing;
          if (marketingZone) {
            const targetPos = { x: marketingZone[0], y: marketingZone[1], z: marketingZone[2] };
            const startPos = state.playerPosition;
            const path = pathfinder.calculatePath(startPos, targetPos);
            nextState.navigationTarget = { id: 'zona_laboratorio_marketing', name: 'Laboratorio de Marketing', ...targetPos };
            nextState.navigationPath = path;
            nextState.isNavigating = true;
          }
        }
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

  triggerNPCDialogue: (npc) => set((state) => {
    const targetNPC = npc || state.interactableNPC;
    if (!targetNPC) return {};

    let dialogues;
    switch (targetNPC.id) {
      case 'guardia_tecsup':
        dialogues = [
          "Buenos días.",
          "Por favor muéstreme su identificación.",
          "Todo en orden.",
          "Bienvenido a Tecsup."
        ];
        break;
      case 'paquito-bot':
        dialogues = [
          "¡Hola! Soy PaquitoBot 🤖",
          "Soy el bot asistente oficial de Tecsup, listo para guiarte en el campus.",
          "Primero comencemos conociendo el área de Marketing Digital, dirígete a su laboratorio."
        ];
        break;
      case 'docente_redes':
        dialogues = [
          "¡Bienvenido! Soy el profesor Torres.",
          "Cada mensaje que envías, cada videojuego online y cada videollamada dependen de profesionales capaces de diseñar y administrar redes.",
          "Pero no solo conectamos dispositivos. También protegemos la información frente a amenazas digitales.",
          "Por eso hoy tendrás dos misiones: primero restaurarás la conectividad del campus, después defenderás nuestra infraestructura de un ataque informático."
        ];
        break;
      case 'docente_marketing':
        dialogues = [
          "¡Bienvenido! Soy el profesor Carlos Mendoza.",
          "Cada anuncio que ves en internet, cada campaña en redes sociales y cada estrategia tiene detrás profesionales que analizan información y toman decisiones.",
          "Marketing ya no se trata solamente de vender. Hoy se trata de comprender personas, interpretar datos y generar experiencias memorables.",
          "Para que lo experimentes por ti mismo, acércate a la estación y presiona E para iniciar la misión."
        ];
        break;
      default:
        dialogues = [
          "¡Hola! Soy " + targetNPC.name + ".",
          targetNPC.description
        ];
    }

    return {
      dialogueQueue: dialogues,
      currentDialogueIndex: 0,
      isDialogueActive: true,
      activeDialogueNPC: targetNPC,
      controlsDisabled: true
    };
  }),

  // --- INTERACCIÓN CON LA VITRINA DE SERVIDORES ---
  vitrineProximity: false,
  setVitrineProximity: (val) => set({ vitrineProximity: val }),

  // --- INTERACCIÓN CON PC DE CIBERSEGURIDAD ---
  hackerGameProximity: false,
  setHackerGameProximity: (val) => set({ hackerGameProximity: val }),

  // --- MINIJUEGO DE RED (CONEXIÓN INTERNET) ---
  networkGameActive: false,
  networkGameWon: false,
  toggleNetworkGame: () => set((state) => {
    // Si ya ganamos, no volvemos a abrir el juego a menos que se resetee
    if (state.networkGameWon && !state.networkGameActive) return {};
    const nextActive = !state.networkGameActive;
    return {
      networkGameActive: nextActive,
      controlsDisabled: nextActive, // Desactiva WASD del avatar 3D
    };
  }),
  setNetworkGameWon: (won) => set({ networkGameWon: won }),
  resetNetworkGame: () => set({
    networkGameWon: false,
    networkGameActive: false,
    controlsDisabled: false
  }),

  // --- MINIJUEGO DE CIBERSEGURIDAD (DEFENDER ATAQUE HACKER) ---
  hackerGameActive: false,
  hackerGameWon: false,
  toggleHackerGame: () => set((state) => {
    if (state.hackerGameWon && !state.hackerGameActive) return {};
    const nextActive = !state.hackerGameActive;
    return {
      hackerGameActive: nextActive,
      controlsDisabled: nextActive,
    };
  }),
  setHackerGameWon: (won) => set({ hackerGameWon: won }),
  resetHackerGame: () => set({
    hackerGameWon: false,
    hackerGameActive: false,
    controlsDisabled: false
  }),

  // --- INTERACCIÓN CON TVS INFORMATIVOS ---
  tvRedesProximity: false,
  setTvRedesProximity: (val) => set({ tvRedesProximity: val }),
  tvMarketingProximity: false,
  setTvMarketingProximity: (val) => set({ tvMarketingProximity: val }),

  // --- MODAL DE VIDEO YOUTUBE ---
  tvVideoUrl: null,
  setTvVideoUrl: (url) => set({ tvVideoUrl: url }),

  // --- OVERRIDE DE POSICIONES DE NPCS ---
  // Permite teletransportar un NPC cambiando su posicion en runtime
  npcPositionOverrides: {},
  setNpcPosition: (npcId, position) => set((state) => ({
    npcPositionOverrides: { ...state.npcPositionOverrides, [npcId]: position },
  })),
}));

export default useStore;
