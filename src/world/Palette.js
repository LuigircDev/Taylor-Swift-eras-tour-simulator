import * as THREE from 'three';
import { ERAS } from '../config.js';

export class Palette {
  constructor(bus) {
    this.cur = ERAS[0].colors.map(c => new THREE.Color(c));
    this.tgt = ERAS[0].colors.map(c => new THREE.Color(c));
    this.uniforms = {
      uTime: { value: 0 }, uBeat: { value: 0 }, uEnergy: { value: 0 },
      uMode: { value: 0 }, uScale: { value: innerHeight / 2 },
      uC1: { value: this.cur[0] }, uC2: { value: this.cur[1] }, uC3: { value: this.cur[2] },
    };
    bus.on('show:era', i => ERAS[i].colors.forEach((c, k) => this.tgt[k].set(c)));
    bus.on('show:crowdMode', m => (this.uniforms.uMode.value = m));
    addEventListener('resize', () => (this.uniforms.uScale.value = innerHeight / 2));
  }
  update({ t, beat, energy }) {
    const u = this.uniforms;
    u.uTime.value = t; u.uBeat.value = beat; u.uEnergy.value = energy;
    this.cur.forEach((c, k) => c.lerp(this.tgt[k], 0.04));
  }
}