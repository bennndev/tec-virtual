import { useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';

// Preload de todos los personajes para cambio instantáneo
useGLTF.preload('/models/test-character.glb');
useGLTF.preload('/models/test-character2.glb');
useGLTF.preload('/models/Alejandro.glb');
useGLTF.preload('/models/Felipe.glb');
useGLTF.preload('/models/Isabella.glb');
useGLTF.preload('/models/Sofia.glb');
useGLTF.preload('/models/test-character3.glb');

export default function CharacterModel({ modelUrl = '/models/test-character.glb', ...props }) {
  const { scene, animations } = useGLTF(modelUrl);
  const { names } = useAnimations(animations, scene);

  useEffect(() => {
    console.log('=== Character Model Animations ===');
    console.log(`  Model: ${modelUrl}`);
    if (names.length > 0) {
      names.forEach((name, index) => {
        console.log(`  ${index + 1}. "${name}"`);
      });
    } else {
      console.log('  (No animations found)');
    }
    console.log('==================================');
  }, [names, modelUrl]);

  return <primitive object={scene} {...props} />;
}
