/**
 * Configuración de personajes jugables.
 *
 * Cada personaje define:
 * - modelUrl: Ruta al GLB en public/models/
 * - animationSet: Mapeo de estados ecctrl → nombres de clips en el GLB
 * - offsetY: Corrección de pivot (modelo centrado → bajar para tocar el suelo)
 * - name: Nombre visible en el UI
 */
const CHARACTERS = {
  alejandro: {
    id: 'alejandro',
    name: 'Alejandro',
    modelUrl: '/models/Alejandro.glb',
    offsetY: -0.6,
    animationSet: {
      idle: 'Armature|Idle',
      walk: 'Armature|Walk',
      run: 'Armature|Sprint',
      jump: 'Armature|Jump',
      jumpIdle: 'Armature|Grounded',
      jumpLand: 'Armature|Grounded',
      fall: 'Armature|Grounded',
    },
  },

  felipe: {
    id: 'felipe',
    name: 'Felipe',
    modelUrl: '/models/Felipe.glb',
    offsetY: -0.6,
    animationSet: {
      idle: 'Armature|Idle',
      walk: 'Armature|Walk',
      run: 'Armature|Sprint',
      jump: 'Armature|Jump',
      jumpIdle: 'Armature|Grounded',
      jumpLand: 'Armature|Grounded',
      fall: 'Armature|Grounded',
    },
  },

  isabella: {
    id: 'isabella',
    name: 'Isabella',
    modelUrl: '/models/Isabella.glb',
    offsetY: -0.6,
    animationSet: {
      idle: 'Armature|Idle',
      walk: 'Armature|Walk',
      run: 'Armature|Sprint',
      jump: 'Armature|Jump',
      jumpIdle: 'Armature|Grounded',
      jumpLand: 'Armature|Grounded',
      fall: 'Armature|Grounded',
    },
  },

  sofia: {
    id: 'sofia',
    name: 'Sofía',
    modelUrl: '/models/Sofia.glb',
    offsetY: -0.6,
    animationSet: {
      idle: 'Armature|Idle',
      walk: 'Armature|Walk',
      run: 'Armature|Sprint',
      jump: 'Armature|Jump',
      jumpIdle: 'Armature|Grounded',
      jumpLand: 'Armature|Grounded',
      fall: 'Armature|Grounded',
    },
  },
};

export default CHARACTERS;

// --- CONFIGURACIÓN DE APARICIÓN INICIAL ---
// Modificá estos valores para cambiar la dirección inicial a la que mira el personaje al aparecer (en radianes).
// Aumentar CHARACTER_INIT_DIR hace que el personaje rote a la izquierda (en sentido antihorario).
// CAM_INIT_DIR.y debe estar alineada para que la cámara empiece directamente detrás.
export const CHARACTER_INIT_DIR = 0.8; // Ej: 0.8 para mirar hacia la izquierda (puerta de Tecsup)
export const CAM_INIT_DIR = { x: 0, y: 0.8 }; // y: debe ser igual a CHARACTER_INIT_DIR para alinear la cámara

