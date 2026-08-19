import { useEffect, useRef, useCallback } from 'react';
import { useGLTF } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import objectsData from '../../data/objects.json';
import { ZONE_OVERRIDES } from '../../data/zonePositions';
import useStore from '../../store/useStore';

// Construir lookup de prefijos para objetos agrupados (ej: monitores con sub-meshes)
// Se ordena de mayor a menor longitud para priorizar el match más específico
const PREFIX_ENTRIES = Object.entries(objectsData)
  .filter(([, v]) => v.meshPrefix)
  .sort(([, a], [, b]) => b.meshPrefix.length - a.meshPrefix.length);

const HOVER_COLOR = new THREE.Color('#ffffff');

// Precarga el escenario en el cache de R3F
useGLTF.preload('/scenes/tecsup-2.glb');

export default function SceneEnvironment() {
  const { scene } = useGLTF('/scenes/tecsup-2.glb');
  const setHoveredObject = useStore((s) => s.setHoveredObject);
  const setTpZones = useStore((s) => s.setTpZones);
  const previousMesh = useRef(null);

  // Bounds y Markers para el Minimapa
  const setMapBounds = useStore((s) => s.setMapBounds);
  const setMapMarkers = useStore((s) => s.setMapMarkers);

  // BVH en todas las geometrías del escenario + bounds calculation + detección de zonas TP
  useEffect(() => {
    // Forzar actualización de matrices para getWorldPosition preciso
    scene.updateMatrixWorld(true);

    const meshes = [];
    const markers = [];
    const zones = {};

    // Calcular la caja delimitadora real del campus
    const box = new THREE.Box3().setFromObject(scene);
    setMapBounds({
      minX: box.min.x,
      maxX: box.max.x,
      minZ: box.min.z,
      maxZ: box.max.z
    });

    scene.traverse((child) => {
      if (child.isMesh && child.geometry) {
        child.geometry.computeBoundsTree();
        meshes.push(child);
      }

      // Ancla de moneda: stand05 = pista delante del kiosco (teleportPos), no encima
      if (child.name && objectsData[child.name]?.coinAnchor) {
        const objConf = objectsData[child.name];
        const worldPos = new THREE.Vector3();
        child.getWorldPosition(worldPos);
        const box = new THREE.Box3().setFromObject(child);
        const groundY = box.isEmpty() ? worldPos.y : box.min.y;

        if (objConf.coinAnchor === 'front' && objConf.teleportPos) {
          zones[child.name] = [objConf.teleportPos[0], groundY, objConf.teleportPos[2]];
        } else if (!box.isEmpty()) {
          const center = box.getCenter(new THREE.Vector3());
          const height = box.max.y - box.min.y;
          const topY = height > 0 && height < 3 ? box.max.y : worldPos.y + 1.2;
          zones[child.name] = [center.x, topY, center.z];
        } else {
          zones[child.name] = [worldPos.x, worldPos.y, worldPos.z];
        }
        const p = zones[child.name];
        console.log(`[CoinAnchor] ${child.name} → (${p[0].toFixed(2)}, ${p[1].toFixed(2)}, ${p[2].toFixed(2)})`);
      }

      // Extraer marcadores si están en objects.json y son Zonas Principales
      if (child.isMesh && child.name && objectsData[child.name]) {
        const objConf = objectsData[child.name];
        if (objConf.category === 'Zona Principal') {
          const worldPos = new THREE.Vector3();
          child.getWorldPosition(worldPos);
          markers.push({
            id: child.name,
            name: objConf.name,
            x: worldPos.x,
            y: worldPos.y,
            z: worldPos.z,
            isZone: true,
            teleportPos: objConf.teleportPos || [worldPos.x, worldPos.y + 1.0, worldPos.z + 2.5]
          });
        }
      }

      // === ZONAS DE TP (detección por prefijo zona_, funciona con meshes o empties) ===
      if (child.name.startsWith('zona_')) {
        const worldPos = new THREE.Vector3();
        child.getWorldPosition(worldPos);
        zones[child.name] = [worldPos.x, worldPos.y, worldPos.z];
        console.log(`[TP] Zona detectada: ${child.name} → (${worldPos.x.toFixed(2)}, ${worldPos.y.toFixed(2)}, ${worldPos.z.toFixed(2)})`);

        // Extraer de objects.json si existe
        const objConf = objectsData[child.name];

        // Formatear el nombre para el marcador (ej: "zona_auditorio_a" -> "Auditorio A")
        const rawName = child.name.replace(/^zona_/, '').replace(/_/g, ' ');
        const prettyName = objConf?.name || rawName.replace(/\b\w/g, c => c.toUpperCase());

        // Por defecto mostramos en panorama, a menos que sea un "Laboratorio"
        const isLab = objConf?.category === 'Laboratorio';

        // Agregar a los marcadores del mapa solo si NO es "Oculto"
        if (objConf?.category !== 'Oculto') {
          markers.push({
            id: child.name,
            name: prettyName,
            x: worldPos.x,
            y: worldPos.y,
            z: worldPos.z,
            isZone: true,
            teleportPos: [worldPos.x, worldPos.y + 1.5, worldPos.z],
            showInPanorama: !isLab
          });
        }

        // Si tiene mesh, clonar material y hacer invisible
        if (child.isMesh && child.material) {
          child.material = child.material.clone();
          child.material.transparent = true;
          child.material.opacity = 0;
        }
      }

      // Remover luces y cámaras del GLB para usar las nuestras
      if (child.isLight || child.isCamera) {
        child.removeFromParent();
      }
    });

    Object.entries(ZONE_OVERRIDES).forEach(([id, conf]) => {
      zones[id] = conf.position;
      const [x, y, z] = conf.position;
      const existing = markers.find((m) => m.id === id);
      if (existing) {
        existing.x = x;
        existing.y = y;
        existing.z = z;
        existing.name = conf.name;
        existing.teleportPos = conf.position;
      } else if (conf.category !== 'Oculto') {
        markers.push({
          id,
          name: conf.name,
          x,
          y,
          z,
          isZone: true,
          teleportPos: conf.position,
          showInPanorama: conf.showInPanorama !== false,
        });
      }
    });

    setMapMarkers(markers);

    if (Object.keys(zones).length > 0) {
      setTpZones(zones);
    }

    return () => {
      meshes.forEach((mesh) => {
        if (mesh.geometry) {
          mesh.geometry.disposeBoundsTree();
        }
      });
    };
  }, [scene, setMapBounds, setMapMarkers, setTpZones]);

  // Guarda el material original antes de modificarlo
  const saveOriginalEmissive = useCallback((mesh) => {
    if (!mesh.userData._origEmissive && mesh.material) {
      const mat = mesh.material;
      mesh.userData._origEmissive = mat.emissive ? mat.emissive.clone() : new THREE.Color(0x000000);
      mesh.userData._origEmissiveIntensity = mat.emissiveIntensity ?? 0;
    }
  }, []);

  // Restaura el material original
  const restoreMesh = useCallback((mesh) => {
    if (mesh.material && mesh.userData._origEmissive) {
      const mat = mesh.material;
      mat.emissive.copy(mesh.userData._origEmissive);
      mat.emissiveIntensity = mesh.userData._origEmissiveIntensity;
    }
  }, []);

  // Aplica hover glow a un mesh
  const applyHover = useCallback((mesh) => {
    if (!mesh.material) return;
    saveOriginalEmissive(mesh);
    mesh.material.emissive.copy(HOVER_COLOR);
    mesh.material.emissiveIntensity = 0.4;
  }, [saveOriginalEmissive]);

  // Handler de movimiento del puntero sobre el escenario
  const handlePointerMove = useCallback((e) => {
    e.stopPropagation();
    const mesh = e.object;

    if (mesh === previousMesh.current) return;
    if (!mesh.isMesh) return;

    // Restaurar mesh anterior
    if (previousMesh.current) {
      restoreMesh(previousMesh.current);
    }

    previousMesh.current = mesh;

    // Buscar datos del objeto: exact match primero, luego por prefijo
    let objData = null;
    if (mesh.name) {
      objData = objectsData[mesh.name];
      if (!objData) {
        // Buscar por prefijo (para objetos con múltiples sub-meshes)
        for (const [, entry] of PREFIX_ENTRIES) {
          if (mesh.name.startsWith(entry.meshPrefix)) {
            objData = entry;
            break;
          }
        }
      }
    }

    if (objData) {
      applyHover(mesh);
      setHoveredObject({ id: mesh.name, ...objData });
    } else {
      setHoveredObject(null);
    }
  }, [setHoveredObject, restoreMesh, applyHover]);

  // Handler cuando el puntero sale del escenario
  const handlePointerOut = useCallback(() => {
    if (previousMesh.current) {
      restoreMesh(previousMesh.current);
      previousMesh.current = null;
    }
    setHoveredObject(null);
  }, [setHoveredObject, restoreMesh]);

  return (
    <RigidBody type="fixed" colliders="trimesh">
      <primitive
        object={scene}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
      />
    </RigidBody>
  );
}
