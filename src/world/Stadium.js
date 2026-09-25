import * as THREE from 'three';
import { mulberry32 } from '../core/rng.js';

export class Stadium {
  constructor({ scene }) {
    scene.add(new THREE.HemisphereLight(0x6666aa, 0x110011, 0.5));

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      new THREE.MeshStandardMaterial({ color: 0x0a0a12, roughness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    scene.add(new THREE.Mesh(
      new THREE.LatheGeometry([
        new THREE.Vector2(58, 0), new THREE.Vector2(60, 2), new THREE.Vector2(100, 26),
        new THREE.Vector2(103, 42), new THREE.Vector2(106, 42),
      ], 96),
      new THREE.MeshStandardMaterial({ color: 0x0d0b14, roughness: 1, side: THREE.DoubleSide })
    ));

    const rng = mulberry32(42), p = [];
    for (let i = 0; i < 2000; i++) {
      const u = rng() * 2 - 1, th = rng() * Math.PI * 2, s = Math.sqrt(1 - u * u);
      if (u * 400 > 30) p.push(s * Math.cos(th) * 400, u * 400, s * Math.sin(th) * 400);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, fog: false })));
  }
  update() {}
}