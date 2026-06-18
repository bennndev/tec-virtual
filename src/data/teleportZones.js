/**
 * Configuración de zonas de teletransporte para el campus.
 * Cada zona define:
 * - id: Identificador único
 * - name: Nombre visible
 * - description: Breve descripción de la zona
 * - position: Coordenadas 3D [x, y, z] de destino para el avatar
 * - labelOffset: Ajuste [x, y, z] para posicionar la etiqueta flotante sobre la zona
 * - radius: Radio de la zona circular de resaltado
 */
const TELEPORT_ZONES = [
  {
    id: 'playground',
    name: 'Playground',
    description: 'Zona recreativa y punto de encuentro inicial.',
    position: [65, 1.7, -90],
    labelOffset: [0, 5, 0],
    radius: 8,
  },
  {
    id: 'the_hub',
    name: 'The Hub',
    description: 'Edificio central y corazón administrativo del campus.',
    position: [98, 2.3, -114],
    labelOffset: [0, 6, 0],
    radius: 10,
  },
  {
    id: 'club_house',
    name: 'Club House',
    description: 'Área de descanso, cafetería y esparcimiento estudiantil.',
    position: [112, 2.2, -82],
    labelOffset: [0, 5, 0],
    radius: 9,
  },
  {
    id: 'the_quad',
    name: 'The Quad',
    description: 'Patio central de eventos e integraciones al aire libre.',
    position: [88, 1.8, -96],
    labelOffset: [0, 4, 0],
    radius: 12,
  },
  {
    id: 'the_courts',
    name: 'The Courts',
    description: 'Canchas polideportivas y áreas de entrenamiento físico.',
    position: [55, 1.8, -125],
    labelOffset: [0, 5, 0],
    radius: 9,
  },
  {
    id: 'swimming_pool',
    name: 'Swimming Pool',
    description: 'Piscina semiolímpica e infraestructura deportiva acuática.',
    position: [135, 1.8, -110],
    labelOffset: [0, 5, 0],
    radius: 8,
  },
  {
    id: 'tennis_padel',
    name: 'Tennis & Padel',
    description: 'Canchas de tenis y pádel de última generación.',
    position: [85, 1.8, -130],
    labelOffset: [0, 5, 0],
    radius: 8,
  }
];

export default TELEPORT_ZONES;
