import { useEffect, useRef } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';

export default function Ground() {
  const geomRef = useRef();

  useEffect(() => {
    if (geomRef.current) {
      geomRef.current.computeBoundsTree();
    }
    return () => {
      if (geomRef.current) {
        geomRef.current.disposeBoundsTree();
        geomRef.current.dispose();
      }
    };
  }, []);

  return (
    <RigidBody type="fixed" colliders={false}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry ref={geomRef} args={[20, 20]} />
        <meshStandardMaterial color="#2d2d5e" />
      </mesh>
      <CuboidCollider args={[10, 0.1, 10]} position={[0, -0.1, 0]} />
    </RigidBody>
  );
}
