/**
 * Zonas que no vienen (o no coinciden) con empties del GLB.
 * position = coords de pie del jugador (HUD). EnEx no suma +1.5 aquí.
 */
export const ZONE_OVERRIDES = {
  zona_entrada: {
    name: 'Entrada',
    description: 'Acceso principal al campus Tecsup Arequipa.',
    category: 'Zona General',
    position: [-66.71, 20.04, -7.71],
    standing: true,
    showInPanorama: true,
  },
  zona_pabellon_M: {
    name: 'Pabellón M',
    description: 'Pabellón de la carrera de Mecánica.',
    category: 'Zona General',
    position: [140.85, 20.39, -41.01],
    standing: true,
    showInPanorama: true,
  },
  zona_pabellon_G: {
    name: 'Pabellón G',
    description: 'Pabellón de la carrera de Mecatrónica.',
    category: 'Zona General',
    position: [128.43, 21.89, -66.72],
    standing: true,
    showInPanorama: true,
  },
  zona_pabellon_E: {
    name: 'Pabellón E',
    description: 'Pabellón de la carrera de Electricidad.',
    category: 'Zona General',
    position: [149.38, 21.89, -96.94],
    standing: true,
    showInPanorama: true,
  },
};

export const STANDING_ZONE_IDS = new Set(
  Object.entries(ZONE_OVERRIDES)
    .filter(([, z]) => z.standing)
    .map(([id]) => id)
);
