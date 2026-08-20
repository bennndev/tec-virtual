import { create } from 'zustand';
import { pathfinder } from '../services/pathfinding';
import { isMovementLocked } from './overlayLock';
import { playCoinPickup } from '../services/coinSfx';

const useStore = create((set, get) => ({
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
  setTeleportTarget: (pos) => set({
    teleportTarget: pos,
    enexBlockedUntil: Date.now() + 5000,
  }),

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
  setSelectorOpen: (open) =>
    set((state) => ({
      isSelectorOpen: open,
      controlsDisabled: isMovementLocked({ ...state, isSelectorOpen: open }),
    })),

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

  // Calidad de render adaptativa (PerformanceMonitor)
  renderQuality: {
    factor: 1,
    dpr: 1.5,
    shadows: true,
    shadowSize: 1024,
    aa: true,
  },
  setRenderQuality: (quality) => set({ renderQuality: quality }),

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
      };
      // Solo en el tutorial se abre el selector al terminar
      if (state.gameState === 'tutorial') {
        nextState.isSelectorOpen = true;
        nextState.controlsDisabled = true;
        nextState.gameState = 'character_select';
      }
      // Si hablamos con PaquitoBot, activar navegación según el paso
      if (state.activeDialogueNPC?.id === 'paquito-bot') {
        if (state.paquitoStep === 0) {
          // Paso 0 → navegar a marketing + teletransportar ya
          const marketingZone = state.tpZones?.zona_laboratorio_marketing;
          if (marketingZone) {
            const targetPos = { x: marketingZone[0], y: marketingZone[1], z: marketingZone[2] };
            const startPos = state.playerPosition;
            const path = pathfinder.calculatePath(startPos, targetPos);
            nextState.navigationTarget = { id: 'zona_laboratorio_marketing', name: 'Laboratorio de Marketing', ...targetPos };
            nextState.navigationPath = path;
            nextState.isNavigating = true;
          }
          nextState.npcPositionOverrides = { ...state.npcPositionOverrides, 'paquito-bot': [37.07, 20.04, -44.67] };
          nextState.paquitoStep = 1;
        } else if (state.paquitoStep === 1) {
          // Paso 1 (marketing) → cerrar y empezar timer de 15s para teletransporte a redes
          setTimeout(() => {
            const s = useStore.getState();
            s.setNpcPosition('paquito-bot', [41.43, 20.06, -44.42]);
            s.advancePaquitoStep();
          }, 15000);
        } else if (state.paquitoStep === 2) {
          // Paso 2 (redes guía) → navegar al lab de redes
          const redesZone = state.tpZones?.zona_laboratorio_redes;
          if (redesZone) {
            const targetPos = { x: redesZone[0], y: redesZone[1], z: redesZone[2] };
            const startPos = state.playerPosition;
            const path = pathfinder.calculatePath(startPos, targetPos);
            nextState.navigationTarget = { id: 'zona_laboratorio_redes', name: 'Laboratorio de Redes', ...targetPos };
            nextState.navigationPath = path;
            nextState.isNavigating = true;
          }
        }
      }
      nextState.controlsDisabled = isMovementLocked({ ...state, ...nextState });
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
  
  endDialogue: () => set((state) => {
    const next = {
      isDialogueActive: false,
      dialogueQueue: [],
      currentDialogueIndex: 0,
      activeDialogueNPC: null,
    };
    return {
      ...next,
      controlsDisabled: isMovementLocked({ ...state, ...next }),
    };
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
        switch (state.paquitoStep) {
          case 0: // Entrada: guiar a marketing
            dialogues = [
              "Hola! Soy PaquitoBot, el bot asistente oficial de Tecsup.",
              "Estoy listo para guiarte en el campus.",
              "Primero comencemos conociendo el area de Marketing Digital, dirigete a su laboratorio."
            ];
            break;
          case 1: // Marketing: saludo breve
            dialogues = ["Genial, llegaste."];
            break;
          case 2: // Redes: guiar al lab de redes
            dialogues = [
              "Genial, que divertido.",
              "Ahora exploremos el laboratorio de Redes y Telecomunicaciones."
            ];
            break;
          default: // Redes: cierre
            dialogues = [
              "Muy bien, exploraste todos los laboratorios.",
              "Acá termina nuestro recorrido.",
              "Espero te hayas divertido y aprendido."
            ];
        }
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
      controlsDisabled: isMovementLocked({ ...state, networkGameActive: nextActive }),
    };
  }),
  setNetworkGameWon: (won) => set({ networkGameWon: won }),
  resetNetworkGame: () => set((state) => {
    const next = { networkGameWon: false, networkGameActive: false };
    return { ...next, controlsDisabled: isMovementLocked({ ...state, ...next }) };
  }),

  // --- MINIJUEGO DE CIBERSEGURIDAD (DEFENDER ATAQUE HACKER) ---
  hackerGameActive: false,
  hackerGameWon: false,
  toggleHackerGame: () => set((state) => {
    if (state.hackerGameWon && !state.hackerGameActive) return {};
    const nextActive = !state.hackerGameActive;
    return {
      hackerGameActive: nextActive,
      controlsDisabled: isMovementLocked({ ...state, hackerGameActive: nextActive }),
    };
  }),
  setHackerGameWon: (won) => set({ hackerGameWon: won }),
  resetHackerGame: () => set((state) => {
    const next = { hackerGameWon: false, hackerGameActive: false };
    return { ...next, controlsDisabled: isMovementLocked({ ...state, ...next }) };
  }),

  // --- MINIJUEGO DE MARKETING (TUG OF ASSETS) ---
  marketingGameProximity: false,
  setMarketingGameProximity: (val) => set({ marketingGameProximity: val }),
  marketingGameActive: false,
  marketingGameWon: false,
  toggleMarketingGame: () => set((state) => {
    if (state.marketingGameWon && !state.marketingGameActive) return {};
    const nextActive = !state.marketingGameActive;
    return {
      marketingGameActive: nextActive,
      controlsDisabled: isMovementLocked({ ...state, marketingGameActive: nextActive }),
    };
  }),
  setMarketingGameWon: (won) => set({ marketingGameWon: won }),
  resetMarketingGame: () => set((state) => {
    const next = { marketingGameWon: false, marketingGameActive: false };
    return { ...next, controlsDisabled: isMovementLocked({ ...state, ...next }) };
  }),

  // --- INTERACCIÓN CON TVS INFORMATIVOS ---
  tvRedesProximity: false,
  setTvRedesProximity: (val) => set({ tvRedesProximity: val }),
  tvMarketingProximity: false,
  setTvMarketingProximity: (val) => set({ tvMarketingProximity: val }),

  // --- MODAL DE VIDEO YOUTUBE ---
  tvVideoUrl: null,
  setTvVideoUrl: (url) =>
    set((state) => ({
      tvVideoUrl: url,
      controlsDisabled: isMovementLocked({ ...state, tvVideoUrl: url }),
    })),

  // --- MONEDAS COLECCIONABLES ---
  collectedCoinIds: [],
  coinPopup: null, // { title, body } | null
  collectCoin: (coin) =>
    set((state) => {
      if (state.collectedCoinIds.includes(coin.id) || state.coinPopup) return {};
      if (isMovementLocked(state)) return {};
      if (!state.musicMuted) playCoinPickup();
      return {
        collectedCoinIds: [...state.collectedCoinIds, coin.id],
        coinPopup: { title: coin.title, body: coin.body },
        controlsDisabled: true,
      };
    }),
  closeCoinPopup: () =>
    set((state) => {
      const next = { coinPopup: null, enexBlockedUntil: Date.now() + 5000 };
      return {
        ...next,
        controlsDisabled: isMovementLocked({ ...state, ...next }),
      };
    }),

  // --- OVERRIDE DE POSICIONES DE NPCS ---
  // Permite teletransportar un NPC cambiando su posicion en runtime
  npcPositionOverrides: {},
  setNpcPosition: (npcId, position) => set((state) => ({
    npcPositionOverrides: { ...state.npcPositionOverrides, [npcId]: position },
  })),

  // --- FLUJO DE PAQUITOBOT ---
  // 0=entrada, 1=marketing (saludo), 2=redes-guia, 3=redes-cierre
  paquitoStep: 0,
  advancePaquitoStep: () => set((state) => ({ paquitoStep: state.paquitoStep + 1 })),
}));

export default useStore;
