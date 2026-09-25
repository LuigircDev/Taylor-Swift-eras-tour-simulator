import * as THREE from 'three';
import { basicVS, ledFloorFS, screenFS } from './shaders.js';

export class Stage {
  constructor({ scene, palette }) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x15151f, metalness: 0.6, roughness: 0.35 });
    const box = (w, h, d, x, y, z) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z); scene.add(m); return m;
    };
    box(44, 2, 14, 0, 1, -45);
    box(4, 2, 56, 0, 1, -10);
    box(10, 2, 10, 0, 1, 22).rotation.y = Math.PI / 4;
    box(80, 1, 1, 0, 25.5, -44);

    const led = new THREE.ShaderMaterial({ uniforms: palette.uniforms, vertexShader: basicVS, fragmentShader: ledFloorFS });
    [[44, 14, 0, -45, 0], [4, 56, 0, -10, 0], [10, 10, 0, 22, Math.PI / 4]].forEach(([w, d, x, z, r]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), led);
      m.rotation.set(-Math.PI / 2, 0, r); m.position.set(x, 2.02, z); scene.add(m);
    });

    const scr = new THREE.ShaderMaterial({ uniforms: palette.uniforms, vertexShader: basicVS, fragmentShader: screenFS });
    const main = new THREE.Mesh(new THREE.PlaneGeometry(70, 22), scr);
    main.position.set(0, 14, -52.5); scene.add(main);
    [-1, 1].forEach(s => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(14, 22), scr);
      m.position.set(s * 43, 14, -48); m.rotation.y = -s * 0.4; scene.add(m);
    });
  }
  update() {}
}