import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Mathematically accurate biconcave erythrocyte (red blood cell) geometry
 * Generated using LatheGeometry with Evans & Fung biconcave thickness equation
 */
function useErythrocyteGeometry() {
  return useMemo(() => {
    const points: THREE.Vector2[] = [];
    const segments = 24;
    // Upper contour from center (r=0) to outer rim (r=1)
    for (let i = 0; i <= segments; i++) {
      const r = (i / segments) * 1.0;
      const thickness = 0.52 * Math.sqrt(Math.max(0, 1 - r * r)) * (0.28 + 1.25 * r * r);
      points.push(new THREE.Vector2(Math.max(0.001, r), thickness));
    }
    // Lower contour from outer rim back to center
    for (let i = segments; i >= 0; i--) {
      const r = (i / segments) * 1.0;
      const thickness = 0.52 * Math.sqrt(Math.max(0, 1 - r * r)) * (0.28 + 1.25 * r * r);
      points.push(new THREE.Vector2(Math.max(0.001, r), -thickness));
    }
    const geom = new THREE.LatheGeometry(points, 36);
    geom.computeVertexNormals();
    return geom;
  }, []);
}

/**
 * Tear-drop blood droplet geometry using Lathe profile
 */
function useDropletGeometry() {
  return useMemo(() => {
    const points: THREE.Vector2[] = [];
    const segments = 40;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments; // 0 (tip) to 1 (base)
      const y = (1 - t) * 1.8 - 0.9; // from +0.9 to -0.9
      // Tear shape: radius is 0 at top, bulges near bottom, rounds to 0 at bottom
      const r = Math.sin(t * Math.PI) * Math.pow(t, 0.45) * 1.15;
      points.push(new THREE.Vector2(Math.max(0.001, r), y));
    }
    const geom = new THREE.LatheGeometry(points, 48);
    geom.computeVertexNormals();
    return geom;
  }, []);
}

/**
 * Centerpiece: Glossy crimson translucent blood droplet
 */
function MasterBloodDroplet() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const geom = useDropletGeometry();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.35;
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.6) * 0.08;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.12;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={0.8}>
      <mesh ref={meshRef} geometry={geom} scale={[1.4, 1.5, 1.4]} position={[0, 0, 0]}>
        <meshPhysicalMaterial
          color="#FF1E46"
          emissive="#880E2B"
          emissiveIntensity={0.35}
          roughness={0.06}
          metalness={0.12}
          transmission={0.82}
          ior={1.42}
          thickness={2.4}
          clearcoat={0.9}
          clearcoatRoughness={0.05}
          attenuationColor="#670014"
          attenuationDistance={0.8}
          transparent
          opacity={0.94}
        />
      </mesh>
    </Float>
  );
}

/**
 * Orbiting Biconcave Red Blood Cell
 */
function OrbitingRBC({
  radius,
  speed,
  yOffset,
  scale,
  initialAngle,
  tilt,
}: {
  radius: number;
  speed: number;
  yOffset: number;
  scale: number;
  initialAngle: number;
  tilt: [number, number, number];
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const meshRef = useRef<THREE.Mesh>(null!);
  const geom = useErythrocyteGeometry();

  useFrame((state) => {
    const t = state.clock.elapsedTime * speed + initialAngle;
    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(t) * radius;
      groupRef.current.position.z = Math.sin(t) * (radius * 0.7);
      groupRef.current.position.y = yOffset + Math.sin(t * 1.5) * 0.4;
    }
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.015;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} geometry={geom} scale={[scale, scale, scale]} rotation={tilt}>
        <meshPhysicalMaterial
          color="#E11D48"
          emissive="#7F1D1D"
          emissiveIntensity={0.2}
          roughness={0.24}
          metalness={0.08}
          clearcoat={0.5}
          clearcoatRoughness={0.15}
          transmission={0.25}
          ior={1.38}
          thickness={0.8}
        />
      </mesh>
    </group>
  );
}

/**
 * Atmospheric Bio-Particle Field (Neural nodes / Plasma particles)
 */
function BioParticleField() {
  const pointsRef = useRef<THREE.Points>(null!);
  const count = 160;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const colorCrimson = new THREE.Color('#FF2E54');
    const colorCyan = new THREE.Color('#38BDF8');
    const colorWhite = new THREE.Color('#FFFFFF');

    for (let i = 0; i < count; i++) {
      // Disperse in an elliptical sphere around center
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * 8 + 1.5;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = (r * Math.sin(phi) * Math.sin(theta)) * 0.7;
      pos[i * 3 + 2] = (r * Math.cos(phi)) * 0.8;

      const pick = Math.random();
      const chosenColor = pick < 0.65 ? colorCrimson : pick < 0.9 ? colorCyan : colorWhite;
      col[i * 3] = chosenColor.r;
      col[i * 3 + 1] = chosenColor.g;
      col[i * 3 + 2] = chosenColor.b;
    }
    return [pos, col];
  }, [count]);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.04;
      pointsRef.current.rotation.x += delta * 0.01;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.18}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/**
 * Ambient Synaptic Rings (Coordinate Geofence grid)
 */
function SynapticRings() {
  const ringRef1 = useRef<THREE.Mesh>(null!);
  const ringRef2 = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ringRef1.current) {
      ringRef1.current.rotation.z = t * 0.12;
      ringRef1.current.rotation.x = Math.PI / 3 + Math.sin(t * 0.2) * 0.05;
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.z = -t * 0.09;
      ringRef2.current.rotation.y = Math.PI / 4 + Math.cos(t * 0.15) * 0.05;
    }
  });

  return (
    <group>
      <mesh ref={ringRef1} scale={[3.4, 3.4, 3.4]}>
        <torusGeometry args={[1, 0.012, 16, 96]} />
        <meshBasicMaterial color="#FF2E54" transparent opacity={0.28} />
      </mesh>
      <mesh ref={ringRef2} scale={[4.2, 4.2, 4.2]}>
        <torusGeometry args={[1, 0.008, 16, 96]} />
        <meshBasicMaterial color="#38BDF8" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

export const Hero3DCanvas: React.FC = () => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <Canvas
        camera={{ position: [0, 0.2, 7.8], fov: 42 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={1.1} />
        {/* Key Light: High-intensity medical crimson */}
        <pointLight position={[6, 5, 6]} color="#FF2E54" intensity={4.5} distance={20} />
        {/* Rim Light: Cool cyber cyan */}
        <pointLight position={[-7, -4, -4]} color="#38BDF8" intensity={3.2} distance={20} />
        {/* Top Soft White Accent */}
        <directionalLight position={[0, 8, 3]} color="#FFFFFF" intensity={1.4} />

        {/* Master Blood Droplet */}
        <MasterBloodDroplet />

        {/* Orbiting Biconcave Erythrocytes (Red Blood Cells) */}
        <OrbitingRBC
          radius={2.8}
          speed={0.45}
          yOffset={0.3}
          scale={0.55}
          initialAngle={0}
          tilt={[0.4, 0.3, 0.5]}
        />
        <OrbitingRBC
          radius={3.6}
          speed={-0.35}
          yOffset={-0.4}
          scale={0.48}
          initialAngle={Math.PI * 0.7}
          tilt={[0.2, 0.8, -0.4]}
        />
        <OrbitingRBC
          radius={2.2}
          speed={0.55}
          yOffset={-0.8}
          scale={0.42}
          initialAngle={Math.PI * 1.4}
          tilt={[-0.5, 0.2, 0.7]}
        />
        <OrbitingRBC
          radius={4.2}
          speed={-0.25}
          yOffset={0.7}
          scale={0.62}
          initialAngle={Math.PI * 0.3}
          tilt={[0.6, -0.4, 0.2]}
        />

        {/* Plasma bio-particles & Synaptic geofence rings */}
        <BioParticleField />
        <SynapticRings />
      </Canvas>
    </div>
  );
};
