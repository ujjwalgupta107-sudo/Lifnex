/**
 * LIFNEX 3D HERO VISUALIZATION (Three.js WebGL Engine)
 * Features:
 * - Procedural translucent 3D pulsating Blood Droplet with refraction
 * - Floating interconnected donor synapses & neural plexus grid
 * - Interactive mouse parallax & cinematic depth
 * - Optimized render loop with automatic device performance detection
 */

import * as THREE from 'three';

class LifnexHero3D {
  constructor(containerId = 'hero-3d-canvas') {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.dropletMesh = null;
    this.particles = null;
    this.connections = null;
    this.clock = new THREE.Clock();

    this.mouseX = 0;
    this.mouseY = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;

    this.init();
  }

  init() {
    // 1. Scene setup
    this.scene = new THREE.Scene();

    // 2. Camera setup
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.z = 24;

    // 3. Renderer setup with high-precision antialiasing
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting - Cinematic medical aesthetic
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    const redLight = new THREE.PointLight(0xff2e54, 4, 50);
    redLight.position.set(10, 10, 15);
    this.scene.add(redLight);

    const cyanRimLight = new THREE.PointLight(0x38bdf8, 3, 50);
    cyanRimLight.position.set(-15, -10, 10);
    this.scene.add(cyanRimLight);

    // 5. Build procedural 3D elements
    this.createBloodDroplet();
    this.createNeuralPlexus();

    // 6. Event listeners
    window.addEventListener('resize', this.onWindowResize.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));

    // 7. Start render loop
    this.animate();
  }

  createBloodDroplet() {
    // Build stylized droplet geometry using parametric sphere deformation
    const geometry = new THREE.SphereGeometry(4.2, 64, 64);
    const pos = geometry.attributes.position;

    // Tear-drop shaping equation
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      if (y > 0) {
        const factor = 1 - (y / 4.2) * 0.45;
        x *= factor;
        z *= factor;
        y *= 1.35;
      }
      pos.setXYZ(i, x, y, z);
    }
    geometry.computeVertexNormals();

    // Translucent biological glass material with subsurface crimson glow
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xff1744,
      emissive: 0x880e2b,
      emissiveIntensity: 0.35,
      roughness: 0.1,
      metalness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      transmission: 0.65,
      ior: 1.33,
      thickness: 2.5,
      transparent: true,
      opacity: 0.92
    });

    this.dropletMesh = new THREE.Mesh(geometry, material);
    this.dropletMesh.position.set(7, 0, 2);
    this.scene.add(this.dropletMesh);
  }

  createNeuralPlexus() {
    // 120 interconnected nodes symbolizing voluntary donors across the grid
    const nodeCount = 100;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(nodeCount * 3);

    for (let i = 0; i < nodeCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 35;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 25;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 15;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.28,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);

    // Line network connecting nearby donor nodes
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xff2e54,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending
    });

    const linePositions = [];
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < 6.5) {
          linePositions.push(
            positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
            positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]
          );
        }
      }
    }

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    this.connections = new THREE.LineSegments(lineGeometry, lineMaterial);
    this.scene.add(this.connections);
  }

  onMouseMove(e) {
    this.targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
    this.targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  onWindowResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    const elapsedTime = this.clock.getElapsedTime();

    // Smooth camera mouse parallax
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

    this.camera.position.x = this.mouseX * 2;
    this.camera.position.y = this.mouseY * 2;
    this.camera.lookAt(0, 0, 0);

    // Droplet organic pulse and rotation
    if (this.dropletMesh) {
      this.dropletMesh.rotation.y = elapsedTime * 0.35;
      this.dropletMesh.rotation.x = Math.sin(elapsedTime * 0.5) * 0.15;
      const pulse = 1 + Math.sin(elapsedTime * 2.2) * 0.04;
      this.dropletMesh.scale.set(pulse, pulse, pulse);
    }

    // Grid floating animation
    if (this.particles) {
      this.particles.rotation.y = elapsedTime * 0.04;
    }
    if (this.connections) {
      this.connections.rotation.y = elapsedTime * 0.04;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Automatically mount when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const canvasEl = document.getElementById('hero-3d-canvas');
  if (canvasEl) {
    new LifnexHero3D('hero-3d-canvas');
  }
});

export default LifnexHero3D;

