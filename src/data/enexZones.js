/**
 * EnEx Zone definitions for the Tecsup campus.
 *
 * destination:
 *   - string → ID of another zone; position resolved at runtime from store.tpZones
 *   - null   → visual marker only, no teleport (future work)
 *
 * radius: detection radius in Three.js units (XZ plane)
 */
export const ENEX_ZONES = [
  {
    id: 'zona_cafeteria_01',
    label: 'Cafetería',
    destination: null,
    radius: 1.8,
  },
  // Pabellón A — bidireccional
  {
    id: 'zona_pabellon_A',
    label: 'Pabellón A',
    destination: 'zona_entrada_pabellon_A',
    radius: 1.8,
  },
  {
    id: 'zona_entrada_pabellon_A',
    label: 'Pabellón A (salida)',
    destination: 'zona_pabellon_A',
    radius: 1.8,
  },
  {
    id: 'zona_pabellon_B',
    label: 'Pabellón B',
    destination: null,
    radius: 1.8,
  },
  {
    id: 'zona_pabellon_C',
    label: 'Pabellón C',
    destination: null,
    radius: 1.8,
  },
  {
    id: 'zona_pabellon_R',
    label: 'Pabellón R',
    destination: null,
    radius: 1.8,
  },
  {
    id: 'zona_enfermeria',
    label: 'Enfermería',
    destination: null,
    radius: 1.8,
  },
  {
    id: 'zona_estacionamiento',
    label: 'Estacionamiento',
    destination: null,
    radius: 1.8,
  },
  // Laboratorio de Redes — bidireccional
  {
    id: 'zona_laboratorio_redes',
    label: 'Laboratorio de Redes',
    destination: 'zona_entrada_laboratorio_redes',
    radius: 1.8,
  },
  {
    id: 'zona_entrada_laboratorio_redes',
    label: 'Lab. Redes (salida)',
    destination: 'zona_laboratorio_redes',
    radius: 1.8,
  },
  // Laboratorio de Marketing — bidireccional
  {
    id: 'zona_laboratorio_marketing',
    label: 'Laboratorio de Marketing',
    destination: 'zona_entrada_laboratorio_marketing',
    radius: 1.8,
  },
  {
    id: 'zona_entrada_laboratorio_marketing',
    label: 'Lab. Marketing (salida)',
    destination: 'zona_laboratorio_marketing',
    radius: 1.8,
  },
];
