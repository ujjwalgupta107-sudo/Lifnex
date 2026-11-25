import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useTheme } from '../../lib/theme';
import { useMedia, useOnScreen, useReduced } from '../../lib/hooks';

/** Biconcave red blood cell (Evans & Fung thickness profile). */
function erythrocyte() {
  const points: THREE.Vector2[] = [];
  const n = 26;
  const thick = (r: number) => 0.52 * Math.sqrt(Math.max(0, 1 - r * r)) * (0.34 + 1.3 * r * r - 0.4 * r * r * r * r);
  for (let i = 0; i <= n; i++) {
    const r = Math.sin((i / n) * Math.PI * 0.5);
    points.push(new THREE.Vector2(Math.max(0.0005, r), -thick(r)));
  }
  for (let i = n - 1; i >= 0; i--) {
    const r = Math.sin((i / n) * Math.PI * 0.5);
    points.push(new THREE.Vector2(Math.max(0.0005, r), thick(r)));
  }
  const g = new THREE.LatheGeometry(points, 40);
  g.computeVertexNormals();
  return g;
}

function Env() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const rt = pm.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = rt.texture;
    return () => {
      scene.environment = null;
      rt.dispose();
      pm.dispose();
    };
  }, [gl, scene]);
  return null;
}

interface Cell {
  t: number;
  speed: number;
  angle: number;
  radius: number;
  scale: number;
  spin: THREE.Vector3;
  rot: THREE.Euler;
  push: THREE.Vector3;
}

/** Vessel centreline. Wide screens: sweeps down the right. Narrow: across the top, above the title. */
function makeCurve(narrow: boolean) {
  const pts = narrow
    ? [[4.2, -0.4, -2], [2.2, 0.7, 0.2], [0.7, 1.55, 0.9], [-0.7, 2.4, 0.2], [-1.8, 3.6, -2.4], [-3.2, 5.6, -7]]
    : [[-3.4, -8.2, -1.5], [0.2, -4.6, 0.6], [3.1, -2.2, 1.3], [5.0, 0.1, 1.1], [5.5, 2.9, -1.8], [8, 5.8, -8]];
  return new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal');
}

const lubDub = (t: number) => {
  const p = (t * 1.02) % 1;
  const bump = (c: number, w: number) => Math.exp(-Math.pow((p - c) / w, 2));
  return bump(0.14, 0.06) + 0.6 * bump(0.36, 0.07);
};

function Stream({ count, narrow, still }: { count: number; narrow: boolean; still: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const plate = useRef<THREE.InstancedMesh>(null!);
  const { theme } = useTheme();
  const night = theme === 'night';
  const { camera, gl } = useThree();
  const geom = useMemo(erythrocyte, []);
  const platelet = useMemo(() => new THREE.IcosahedronGeometry(0.14, 1), []);
  const curve = useMemo(() => makeCurve(narrow), [narrow]);
  const frames = useMemo(() => {
    const N = 240;
    const f = curve.computeFrenetFrames(N, false);
    const pts = curve.getSpacedPoints(N);
    return { N, f, pts };
  }, [curve]);

  const cells = useMemo<Cell[]>(() => {
    return Array.from({ length: count }, () => ({
      t: Math.random(),
      speed: 0.016 + Math.random() * 0.016,
      angle: Math.random() * Math.PI * 2,
      radius: Math.pow(Math.random(), 0.62) * (narrow ? 0.95 : 1.95),
      scale: 0.26 + Math.random() * 0.3,
      spin: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.9),
      rot: new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6),
      push: new THREE.Vector3(),
    }));
  }, [count, narrow]);

  const pCells = useMemo(
    () =>
      Array.from({ length: Math.round(count * 0.28) }, () => ({
        t: Math.random(),
        speed: 0.03 + Math.random() * 0.02,
        angle: Math.random() * 6.28,
        radius: 0.4 + Math.random() * (narrow ? 1.4 : 2.1),
        scale: 0.35 + Math.random() * 0.75,
      })),
    [count, narrow],
  );

  const pointer = useRef(new THREE.Vector3(999, 999, 0));
  const surge = useRef(0);

  useEffect(() => {
    const ndc = new THREE.Vector3();
    const move = (e: PointerEvent) => {
      const r = gl.domElement.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom) {
        pointer.current.set(999, 999, 0);
        return;
      }
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1, 0.5).unproject(camera);
      ndc.sub(camera.position).normalize();
      const d = (0.6 - camera.position.z) / ndc.z;
      pointer.current.copy(camera.position).addScaledVector(ndc, d);
    };
    const down = () => {
      surge.current = 1;
    };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', down, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', down);
    };
  }, [camera, gl]);

  const tmp = useMemo(
    () => ({ o: new THREE.Object3D(), p: new THREE.Vector3(), d: new THREE.Vector3(), c: new THREE.Color() }),
    [],
  );

  // shade variation, darker at the back of the vessel
  useLayoutEffect(() => {
    const a = new THREE.Color(night ? '#d00a20' : '#c8071f');
    const b = new THREE.Color(night ? '#5c0410' : '#8a0618');
    cells.forEach((_, i) => {
      tmp.c.copy(a).lerp(b, Math.random() * 0.75);
      mesh.current.setColorAt(i, tmp.c);
    });
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, [cells, night, tmp]);

  const place = (t: number, angle: number, radius: number, beat: number, out: THREE.Vector3) => {
    const f = t * frames.N;
    const i = Math.min(frames.N - 1, Math.floor(f));
    const k = f - i;
    out.copy(frames.pts[i]).lerp(frames.pts[i + 1], k);
    const rr = radius * (1 + beat * 0.07);
    out.addScaledVector(frames.f.normals[i], Math.cos(angle) * rr);
    out.addScaledVector(frames.f.binormals[i], Math.sin(angle) * rr);
  };

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const time = state.clock.elapsedTime;
    const beat = still ? 0 : lubDub(time);
    surge.current *= Math.pow(0.06, dt);
    const flow = still ? 0 : 0.5 + beat * 1.5 + surge.current * 9;
    const { o, p, d } = tmp;

    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      c.t = (c.t + c.speed * flow * dt) % 1;
      c.angle += dt * 0.08 * (still ? 0 : 1);
      place(c.t, c.angle, c.radius, beat, p);
      d.copy(p).sub(pointer.current);
      d.z *= 0.35;
      const dist = d.length();
      const reach = 1.9;
      const force = dist < reach ? Math.pow(1 - dist / reach, 2) * 1.7 : 0;
      c.push.lerp(d.normalize().multiplyScalar(force), 1 - Math.pow(0.004, dt));
      p.add(c.push);
      o.position.copy(p);
      const s = still ? 0 : dt * (0.5 + flow * 0.5 + c.push.length() * 4);
      c.rot.x += c.spin.x * s;
      c.rot.y += c.spin.y * s;
      c.rot.z += c.spin.z * s;
      o.rotation.copy(c.rot);
      const edge = Math.min(1, c.t * 9, (1 - c.t) * 6);
      o.scale.setScalar(c.scale * (1 + beat * 0.035) * Math.max(0.0001, edge));
      o.updateMatrix();
      mesh.current.setMatrixAt(i, o.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < pCells.length; i++) {
      const c = pCells[i];
      c.t = (c.t + c.speed * flow * dt) % 1;
      place(c.t, c.angle + time * 0.1, c.radius, beat, p);
      o.position.copy(p);
      o.rotation.set(time * c.speed * 12, i, 0);
      o.scale.setScalar(c.scale);
      o.updateMatrix();
      plate.current.setMatrixAt(i, o.matrix);
    }
    plate.current.instanceMatrix.needsUpdate = true;

    // a small camera lean toward the pointer
    const px = pointer.current.x > 100 ? 0 : pointer.current.x;
    const py = pointer.current.y > 100 ? 0 : pointer.current.y;
    state.camera.position.x += (px * 0.05 - state.camera.position.x) * dt * 2;
    state.camera.position.y += (py * 0.05 - state.camera.position.y) * dt * 2;
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <instancedMesh ref={mesh} args={[geom, undefined, count]} frustumCulled={false}>
        <meshPhysicalMaterial
          roughness={0.42}
          metalness={0}
          clearcoat={0.5}
          clearcoatRoughness={0.28}
          sheen={0.35}
          sheenColor={night ? '#ff5a4a' : '#ff7a6c'}
          sheenRoughness={0.5}
          envMapIntensity={night ? 0.22 : 0.5}
          emissive={night ? '#2c0208' : '#4a020c'}
          emissiveIntensity={night ? 0.6 : 0.5}
        />
      </instancedMesh>
      <instancedMesh ref={plate} args={[platelet, undefined, pCells.length]} frustumCulled={false}>
        <meshStandardMaterial color={night ? '#d9962b' : '#e09a1c'} roughness={0.5} envMapIntensity={0.4} />
      </instancedMesh>
    </>
  );
}

const Lights: React.FC = () => {
  const { theme } = useTheme();
  const night = theme === 'night';
  return (
    <>
      <fog attach="fog" args={[night ? '#17080b' : '#f8f5f6', 8.5, 19]} />
      <ambientLight intensity={night ? 0.12 : 0.35} />
      <directionalLight position={[-4, 7, 6]} intensity={night ? 0.85 : 1.35} color={night ? '#ffd9d2' : '#ffffff'} />
      <pointLight position={[6, -3, 4]} intensity={night ? 46 : 14} color={night ? '#ff2a3f' : '#ff6a5c'} distance={18} />
      <pointLight position={[-5, 4, -3]} intensity={night ? 34 : 0} color="#ff9d6a" distance={18} />
    </>
  );
};

const BloodStream: React.FC = () => {
  const narrow = useMedia('(max-width: 900px)');
  const still = useReduced();
  const [ref, on] = useOnScreen<HTMLDivElement>();
  return (
    <div ref={ref} className="absolute inset-0" aria-hidden="true" style={{ pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 0, 9.4], fov: 42 }}
        dpr={[1, narrow ? 1.5 : 1.75]}
        frameloop={on ? 'always' : 'never'}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance', toneMapping: THREE.NeutralToneMapping }}
      >
        <Env />
        <Lights />
        <Stream count={narrow ? 70 : 150} narrow={narrow} still={still} />
      </Canvas>
    </div>
  );
};

export default BloodStream;
