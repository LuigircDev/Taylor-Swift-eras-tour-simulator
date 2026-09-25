import * as THREE from 'three';

const lerp = THREE.MathUtils.lerp;
const smooth = k => k * k * (3 - 2 * k);

export class Performer {
  constructor({ scene, palette }) {
    this.palette = palette;
    const g = this.group = new THREE.Group();
    this.dressMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.25 });
    const skin = new THREE.MeshStandardMaterial({ color: 0xf1c7a8, roughness: 0.6 });
    const hairM = new THREE.MeshStandardMaterial({ color: 0xd8b060, roughness: 0.5 });
    const mesh = (geo, m, y, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(0, y, z); g.add(o); return o; };
    mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.8), skin, 0.4);
    mesh(new THREE.ConeGeometry(0.55, 1.0, 24), this.dressMat, 1.0);
    mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.55), this.dressMat, 1.6);
    mesh(new THREE.SphereGeometry(0.17, 20, 20), skin, 2.05);
    mesh(new THREE.SphereGeometry(0.2, 20, 20), hairM, 2.02, -0.06).scale.set(1, 1.25, 1);
    this.arms = [-1, 1].map(s => {
      const pivot = new THREE.Group(); pivot.position.set(0.22 * s, 1.82, 0);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.65), skin);
      arm.position.y = -0.32; pivot.add(arm); g.add(pivot); return pivot;
    });
    g.scale.setScalar(1.4);
    scene.add(g);

    this.spot = new THREE.SpotLight(0xffffff, 12, 0, 0.08, 0.4, 0);
    this.spot.position.set(0, 45, 45);
    scene.add(this.spot, this.spot.target);
  }

  // Función pura del tiempo -> sincronizada en todos los clientes
  static path(t) {
    const c = t % 60; let x = 0, z = -42, face = 0;
    if (c < 15)      x = Math.sin(c * 2 * Math.PI / 15) * 12;
    else if (c < 22) z = lerp(-42, 22, smooth((c - 15) / 7));
    else if (c < 37) { x = Math.sin((c - 22) * 2 * Math.PI / 15) * 2.5; z = 22; face = Math.sin((c - 22) * 0.8) * 2; }
    else if (c < 44) { z = lerp(22, -42, smooth((c - 37) / 7)); face = Math.PI; }
    else             x = Math.sin((c - 44) * 2 * Math.PI / 16) * 12;
    return { x, z, face };
  }

  update({ t, beat, energy }) {
    const p = Performer.path(t);
    this.group.position.set(p.x, 2 + beat * 0.08, p.z);
    this.group.rotation.y = p.face;
    this.arms[0].rotation.z = -(0.2 + beat * 1.6 + Math.sin(t * 2) * 0.2);
    this.arms[1].rotation.z = 0.2 + energy * 1.2 + Math.sin(t * 2.3) * 0.3;
    this.dressMat.color.copy(this.palette.cur[0]);
    this.dressMat.emissive.copy(this.palette.cur[0]).multiplyScalar(0.15 + beat * 0.3);
    this.spot.target.position.copy(this.group.position);
  }
}