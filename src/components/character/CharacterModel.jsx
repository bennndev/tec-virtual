import { useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';

// Preload ambos modelos para que el cambio sea instantáneo
useGLTF.preload('/models/test-character.glb');
useGLTF.preload('/models/test-character2.glb');

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
