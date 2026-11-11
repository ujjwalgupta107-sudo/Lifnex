import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

function MiniBloodDroplet() {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.6;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.8) * 0.2;
    }
  });

  return (
    <Float speed={3} rotationIntensity={0.8} floatIntensity={1.2}>
      <mesh ref={meshRef} scale={[1.1, 1.45, 1.1]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshPhysicalMaterial
          color="#FF1744"
          emissive="#880E2B"
          emissiveIntensity={0.5}
          roughness={0.1}
          metalness={0.2}
          transmission={0.65}
          ior={1.35}
          thickness={1.8}
          transparent
          opacity={0.95}
        />
      </mesh>
    </Float>
  );
}

export const Mini3DDroplet: React.FC = () => {
  return (
    <div style={{ width: '64px', height: '64px', margin: '0 auto' }}>
      <Canvas camera={{ position: [0, 0, 4.5], fov: 40 }} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={1.2} />
        <pointLight position={[5, 5, 5]} color="#FF2E54" intensity={4} />
        <pointLight position={[-5, -5, -2]} color="#38BDF8" intensity={2} />
        <MiniBloodDroplet />
      </Canvas>
    </div>
  );
};

