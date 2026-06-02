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
  const previousMesh = useRef(null);

  // BVH en todas las geometrías del escenario + cleanup solo del bounds tree
  useEffect(() => {
    const meshes = [];

    scene.traverse((child) => {
      if (child.isMesh && child.geometry) {
        child.geometry.computeBoundsTree();
        meshes.push(child);
      }

      // Remover luces y cámaras del GLB para usar las nuestras
      if (child.isLight || child.isCamera) {
        child.removeFromParent();
      }
    });

    return () => {
      meshes.forEach((mesh) => {
        if (mesh.geometry) {
          mesh.geometry.disposeBoundsTree();
        }
      });
    };
  }, [scene]);

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
