import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const MODES = ['fp', 'third', 'orbit'];

export class CameraRig {
  constructor({ camera, renderer, bus }, controller) {
    this.camera = camera; this.bus = bus; this.controller = controller;
    camera.rotation.order = 'YXZ';
    this.orbit = new OrbitControls(camera, renderer.domElement);
    this.orbit.enableDamping = true;
    this.orbit.maxPolarAngle = Math.PI * 0.49;
    this.orbit.target.set(0, 5, -20);
    this.mode = 'orbit';
    this._desired = new THREE.Vector3();
    this._look = new THREE.Vector3();
  }

  setMode(mode) {
    this.mode = mode;
    this.orbit.enabled = mode === 'orbit';
    if (mode === 'orbit') {
      document.exitPointerLock?.();
      this.camera.position.set(0, 40, 95);
      this.orbit.target.set(0, 5, -20);
    }
    this.bus.emit('camera:mode', mode);
  }

  cycle() { this.setMode(MODES[(MODES.indexOf(this.mode) + 1) % MODES.length]); }

  update(dt, player, avatar) {
    if (avatar) avatar.group.visible = this.mode !== 'fp';
    if (this.mode === 'orbit' || !player) { this.orbit.update(); return; }

    const pitch = this.controller.pitch;
    if (this.mode === 'fp') {
      this.camera.position.set(player.x, player.y + 1.65, player.z);
      this.camera.rotation.set(pitch, player.yaw, 0);
    } else {
      const d = 4.5;
      this._desired.set(
        player.x + Math.sin(player.yaw) * d * Math.cos(pitch),
        Math.max(0.3, player.y + 1.8 - Math.sin(pitch) * d),
        player.z + Math.cos(player.yaw) * d * Math.cos(pitch)
      );
      this.camera.position.lerp(this._desired, 1 - Math.exp(-dt * 12));
      this._look.set(player.x, player.y + 1.5, player.z);
      this.camera.lookAt(this._look);
    }
  }
}