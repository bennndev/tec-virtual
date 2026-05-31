import { useEffect, useRef, useState } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import objectsData from '../../data/objects.json';
import useStore from '../../store/useStore';

const HOVER_COLOR = '#ffffff';

function BvhBox({ args = [1, 1, 1], color = '#4a4a8a', position = [0, 0.5, 0], objectId }) {
  const geomRef = useRef();
  const [hovered, setHovered] = useState(false);
  const setHoveredObject = useStore((s) => s.setHoveredObject);

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

  const handlePointerOver = (e) => {
    e.stopPropagation();
    setHovered(true);
    const data = objectsData[objectId];
    if (data) {
      setHoveredObject({ id: objectId, ...data });
    }
  };

  const handlePointerOut = () => {
    setHovered(false);
    setHoveredObject(null);
  };

  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      <mesh
        castShadow
        receiveShadow
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry ref={geomRef} args={args} />
        <meshStandardMaterial
          color={color}
          emissive={hovered ? HOVER_COLOR : '#000000'}
          emissiveIntensity={hovered ? 0.4 : 0}
        />
      </mesh>
      <CuboidCollider args={[args[0] / 2, args[1] / 2, args[2] / 2]} />
    </RigidBody>
  );
}

function Ramp() {
  const geomRef = useRef();
  const [hovered, setHovered] = useState(false);
  const setHoveredObject = useStore((s) => s.setHoveredObject);
  const tilt = -Math.PI / 10;

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

  const handlePointerOver = (e) => {
    e.stopPropagation();
    setHovered(true);
    const data = objectsData['rampa'];
    if (data) {
      setHoveredObject({ id: 'rampa', ...data });
    }
  };

  const handlePointerOut = () => {
    setHovered(false);
    setHoveredObject(null);
  };

  return (
    <RigidBody type="fixed" position={[-3, 0.2, -4]} colliders={false}>
      <mesh
        castShadow
        receiveShadow
        rotation={[0, 0, tilt]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry ref={geomRef} args={[3, 0.2, 1.5]} />
        <meshStandardMaterial
          color="#5a5aaa"
          emissive={hovered ? HOVER_COLOR : '#000000'}
          emissiveIntensity={hovered ? 0.4 : 0}
        />
      </mesh>
      <CuboidCollider args={[1.5, 0.1, 0.75]} position={[0, 0, 0]} rotation={[0, 0, tilt]} />
    </RigidBody>
  );
}

export default function Obstacles() {
  return (
    <>
      <BvhBox objectId="torre-purpura" position={[4, 0.5, 3]} args={[1, 1, 1]} color="#6b3fa0" />
      <BvhBox objectId="bloque-azul" position={[-3, 0.5, 3]} args={[1.5, 1, 1]} color="#3f6ba0" />
      <BvhBox objectId="pilar-rosado" position={[5, 0.75, -3]} args={[1, 1.5, 1]} color="#a03f6b" />
      <BvhBox objectId="losa-verde" position={[-4, 0.25, -3]} args={[0.5, 0.5, 2]} color="#6ba03f" />
      <Ramp />
    </>
  );
}
