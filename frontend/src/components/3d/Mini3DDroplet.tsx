import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

function useDropletGeometry() {
  return useMemo(() => {
    const points: THREE.Vector2[] = [];
    const segments = 28;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const y = (1 - t) * 1.6 - 0.8;
      const r = Math.sin(t * Math.PI) * Math.pow(t, 0.45) * 0.95;
      points.push(new THREE.Vector2(Math.max(0.001, r), y));
    }
    const geom = new THREE.LatheGeometry(points, 32);
    geom.computeVertexNormals();
    return geom;
  }, []);
}

function MiniBloodDroplet() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const geom = useDropletGeometry();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.8;
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.2) * 0.12;
    }
  });

  return (
    <Float speed={3.5} rotationIntensity={0.6} floatIntensity={0.8}>
      <mesh ref={meshRef} geometry={geom} scale={[1, 1, 1]}>
        <meshPhysicalMaterial
          color="#FF1E46"
          emissive="#880E2B"
          emissiveIntensity={0.4}
          roughness={0.08}
          metalness={0.15}
          transmission={0.8}
          ior={1.4}
          thickness={1.8}
          clearcoat={0.9}
          clearcoatRoughness={0.05}
          transparent
          opacity={0.95}
        />
      </mesh>
    </Float>
  );
}

export const Mini3DDroplet: React.FC = () => {
  return (
    <div style={{ width: '64px', height: '64px', margin: '0 auto', pointerEvents: 'none' }}>
      <Canvas camera={{ position: [0, 0, 3.8], fov: 38 }} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={1.2} />
        <pointLight position={[4, 4, 4]} color="#FF2E54" intensity={4} />
        <pointLight position={[-4, -4, -2]} color="#38BDF8" intensity={2.5} />
        <MiniBloodDroplet />
      </Canvas>
    </div>
  );
};
