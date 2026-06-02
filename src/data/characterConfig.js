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
  character1: {
    id: 'character1',
    name: 'Personaje 1',
    modelUrl: '/models/test-character.glb',
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

  character2: {
    id: 'character2',
    name: 'Personaje 2',
    modelUrl: '/models/test-character2.glb',
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

  character3: {
    id: 'character3',
    name: 'Personaje 3',
    modelUrl: '/models/test-character3.glb',
    offsetY: -0.25,
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
