import * as THREE from 'three';
import { crowdVS, crowdFS } from './shaders.js';
import { mulberry32 } from '../core/rng.js';
import { isBlocked } from '../core/collision.js';
import { WORLD } from '../config.js';

export class Crowd {
  constructor({ scene, palette }) {
    const rng = mulberry32(WORLD.seed);
    const mat = new THREE.ShaderMaterial({
      uniforms: palette.uniforms, vertexShader: crowdVS, fragmentShader: crowdFS,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });

    // Gradas
    const pos = [], ph = [];
    for (let i = 0; i < 22000; i++) {
      const r = 62 + rng() * 37, a = rng() * Math.PI * 2;
      const rel = Math.atan2(Math.sin(a + Math.PI / 2), Math.cos(a + Math.PI / 2));
      if (Math.abs(rel) < 0.55) continue;
      pos.push(Math.cos(a) * r, 2 + (r - 60) * 0.6 + 1.3, Math.sin(a) * r);
      ph.push(rng());
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aPhase', new THREE.Float32BufferAttribute(ph, 1));
    scene.add(new THREE.Points(g, mat));

    // Pista (NPCs), deja libre la zona de aparición de los jugadores
    this.people = [];
    for (let x = -40; x <= 40; x += 1.3) {
      for (let z = -36; z <= 50; z += 1.3) {
        const px = x + (rng() - 0.5) * 0.6, pz = z + (rng() - 0.5) * 0.6, skip = rng() < 0.35;
        if (skip || isBlocked(px, pz, 0.6)) continue;
        if (Math.hypot(px - WORLD.spawn.x, pz - WORLD.spawn.z) < 5) continue;
        this.people.push({ x: px, z: pz, ph: rng() * Math.PI * 2 });
      }
    }
    this.bodies = new THREE.InstancedMesh(
      new THREE.CapsuleGeometry(0.22, 0.9, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 0.8 }),
      this.people.length
    );
    scene.add(this.bodies);

    this.bandPos = new Float32Array(this.people.length * 3);
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.BufferAttribute(this.bandPos, 3));
    bg.setAttribute('aPhase', new THREE.Float32BufferAttribute(this.people.map(() => rng()), 1));
    this.bands = new THREE.Points(bg, mat);
    this.bands.frustumCulled = false;
    scene.add(this.bands);
    this.dummy = new THREE.Object3D();
  }

  update({ t, energy }) {
    const d = this.dummy;
    this.people.forEach((p, i) => {
      const jump = Math.max(0, Math.sin(t * 7.4 + p.ph)) * (0.1 + energy * 0.5);
      d.position.set(p.x, 0.67 + jump, p.z); d.updateMatrix();
      this.bodies.setMatrixAt(i, d.matrix);
      this.bandPos[i * 3] = p.x + Math.sin(t * 3 + p.ph) * 0.3;
      this.bandPos[i * 3 + 1] = 2.0 + jump + Math.sin(t * 5 + p.ph) * 0.15;
      this.bandPos[i * 3 + 2] = p.z;
    });
    this.bodies.instanceMatrix.needsUpdate = true;
    this.bands.geometry.attributes.position.needsUpdate = true;
  }
}