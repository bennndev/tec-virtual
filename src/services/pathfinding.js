import * as THREE from 'three';

/**
 * Pathfinding Service
 * Encapsula la lógica de búsqueda de rutas.
 * 
 * FASE 1: Línea recta directa (Fallback).
 * FASE 2: Integrar `three-pathfinding` y NavMesh.
 */
class PathfindingService {
  constructor() {
    this.navMesh = null;
    this.pathfinder = null;
    this.ZONE = 'level';
  }

  // Se llamará cuando tengamos la NavMesh lista en el futuro
  initNavMesh(geometry) {
    // import { Pathfinding } from 'three-pathfinding';
    // this.pathfinder = new Pathfinding();
    // this.pathfinder.setZoneData(this.ZONE, Pathfinding.createZone(geometry));
    console.log('[PathfindingService] NavMesh guardada (no activada todavía)');
  }

  /**
   * Calcula la ruta desde un punto A hasta un punto B
   * @param {THREE.Vector3 | {x, y, z}} startPos 
   * @param {THREE.Vector3 | {x, y, z}} targetPos 
   * @returns {THREE.Vector3[]} Array de waypoints
   */
  calculatePath(startPos, targetPos) {
    const start = new THREE.Vector3(startPos.x, startPos.y || 0, startPos.z);
    const end = new THREE.Vector3(targetPos.x, targetPos.y || 0, targetPos.z);

    // Si tenemos NavMesh activa (Fase 2)
    if (this.pathfinder) {
      const groupID = this.pathfinder.getGroup(this.ZONE, start);
      const path = this.pathfinder.findPath(start, end, this.ZONE, groupID);
      if (path && path.length > 0) return path;
    }

    // FASE 1 Fallback: Línea Recta
    // Levantamos un poco la línea en el eje Y para que no atraviese el piso
    start.y += 0.1;
    end.y += 0.1;
    return [start, end];
  }
}

export const pathfinder = new PathfindingService();
