import { useEffect, useRef, useCallback } from 'react';
import { useGLTF } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import objectsData from '../../data/objects.json';
import useStore from '../../store/useStore';

const HOVER_COLOR = new THREE.Color('#ffffff');

// Precarga el escenario en el cache de R3F
useGLTF.preload('/scenes/tecsup.glb');

export default function SceneEnvironment() {
  const { scene } = useGLTF('/scenes/tecsup.glb');
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

      // Extraer marcadores si están en objects.json
      if (child.isMesh && child.name && objectsData[child.name]) {
        const worldPos = new THREE.Vector3();
        child.getWorldPosition(worldPos);
        const objConf = objectsData[child.name];
        markers.push({
          id: child.name,
          name: objConf.name,
          x: worldPos.x,
          y: worldPos.y,
          z: worldPos.z,
          teleportPos: objConf.teleportPos || [worldPos.x, worldPos.y + 1.0, worldPos.z + 2.5]
        });
      }

      // === ZONAS DE TP (detección por prefijo zona_, funciona con meshes o empties) ===
      if (child.name.startsWith('zona_')) {
        const worldPos = new THREE.Vector3();
        child.getWorldPosition(worldPos);
        zones[child.name] = [worldPos.x, worldPos.y, worldPos.z];
        console.log(`[TP] Zona detectada: ${child.name} → (${worldPos.x.toFixed(2)}, ${worldPos.y.toFixed(2)}, ${worldPos.z.toFixed(2)})`);

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

    // Verificar si es un objeto interactivo
    if (mesh.name && objectsData[mesh.name]) {
      applyHover(mesh);
      setHoveredObject({ id: mesh.name, ...objectsData[mesh.name] });
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
