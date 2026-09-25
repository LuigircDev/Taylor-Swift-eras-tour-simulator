import * as THREE from 'three';

const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
let heartTex;
function heartTexture() {
  if (!heartTex) {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    g.font = '48px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('💖', 32, 36);
    heartTex = new THREE.CanvasTexture(c);
  }
  return heartTex;
}
function makeNameTag(name) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,.5)'; g.beginPath(); g.roundRect(0, 0, 256, 64, 20); g.fill();
  g.fillStyle = '#fff'; g.font = 'bold 30px sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(name, 128, 32);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false }));
  s.scale.set(1.6, 0.4, 1); s.position.y = 2.3;
  return s;
}

// La MISMA clase sirve para el jugador local y los remotos
export class Avatar {
  constructor(player, { isLocal = false, palette }) {
    this.isLocal = isLocal; this.palette = palette;
    this.group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(player.color), roughness: 0.5, metalness: 0.3 });
    const skin = new THREE.MeshStandardMaterial({ color: 0xf1c7a8, roughness: 0.6 });

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.9, 4, 8), bodyMat); body.position.y = 0.7;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), skin); head.position.y = 1.6;
    this.armPivot = new THREE.Group(); this.armPivot.position.set(0.3, 1.25, 0);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6), bodyMat); arm.position.y = -0.3;
    this.band = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), new THREE.MeshBasicMaterial());
    this.band.position.y = -0.55;
    this.armPivot.add(arm, this.band);
    this.group.add(body, head, this.armPivot);
    if (!isLocal) this.group.add(makeNameTag(player.name));

    this.group.position.set(player.x, player.y, player.z);
    this.target = this.group.position.clone();
    this.targetYaw = player.yaw || 0;
    this.emote = null; this.emoteT = 0; this.time = Math.random() * 10; this.hearts = [];
  }

  setTarget(s) { this.target.set(s.x, s.y, s.z); this.targetYaw = s.yaw; }

  playEmote(name) {
    this.emote = name; this.emoteT = 0;
    if (name === 'heart') {
      for (let k = 0; k < 5; k++) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartTexture(), transparent: true, depthWrite: false }));
        s.position.set((Math.random() - 0.5) * 0.8, 2.2 + k * 0.25, (Math.random() - 0.5) * 0.8);
        s.scale.setScalar(0.5);
        this.group.add(s); this.hearts.push(s);
      }
    }
  }

  update(dt, beat, data) {
    if (this.isLocal) {
      this.group.position.set(data.x, data.y, data.z);
      this.group.rotation.y = data.yaw;
    } else {
      const k = 1 - Math.exp(-dt * 10); // interpolación suave de snapshots de red
      this.group.position.lerp(this.target, k);
      this.group.rotation.y += wrap(this.targetYaw - this.group.rotation.y) * k;
    }

    this.time += dt; this.emoteT += dt;
    let armZ = 2.5 + Math.sin(this.time * 4) * 0.25 + beat * 0.3;
    if (this.emote === 'wave' && this.emoteT < 2) armZ = 2.9 + Math.sin(this.emoteT * 14) * 0.35;
    this.armPivot.rotation.z = armZ;
    this.band.material.color.copy(this.palette.cur[1]).multiplyScalar(1 + beat * 2);

    for (let i = this.hearts.length - 1; i >= 0; i--) {
      const h = this.hearts[i];
      h.position.y += dt * 1.2;
      h.material.opacity -= dt * 0.5;
      if (h.material.opacity <= 0) {
        this.group.remove(h); h.material.dispose(); this.hearts.splice(i, 1);
      }
    }
  }

  dispose() {
    this.group.traverse(o => {
      o.geometry?.dispose();
      if (o.material) {
        if (o.material.map && o.material.map !== heartTex) o.material.map.dispose();
        o.material.dispose();
      }
    });
  }
}