import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { EventBus } from './core/EventBus.js';
import { ShowClock } from './core/ShowClock.js';
import { OfflineAdapter } from './net/NetworkAdapter.js';
// import { WebSocketAdapter } from './net/WebSocketAdapter.js';
import { Palette } from './world/Palette.js';
import { Stadium } from './world/Stadium.js';
import { Stage } from './world/Stage.js';
import { Lights } from './world/Lights.js';
import { Crowd } from './world/Crowd.js';
import { Performer } from './world/Performer.js';
import { Fireworks } from './world/Fireworks.js';
import { ShowDirector } from './game/ShowDirector.js';
import { PlayerManager } from './game/PlayerManager.js';
import { PlayerController } from './game/PlayerController.js';
import { CameraRig } from './game/CameraRig.js';
import { Input } from './game/Input.js';
import { AudioEngine } from './audio/AudioEngine.js';
import { HUD } from './ui/HUD.js';

// ---------- Render ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05030a);
scene.fog = new THREE.FogExp2(0x05030a, 0.005);
const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 40, 95);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 1.1, 0.6, 0.15);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------- Núcleo ----------
const bus = new EventBus();
const clock = new ShowClock();
const palette = new Palette(bus);
const ctx = { scene, camera, renderer, bus, clock, palette };

// ---------- Mundo visual (determinista a partir de clock.time) ----------
const world = [new Stadium(ctx), new Stage(ctx), new Lights(ctx), new Crowd(ctx), new Performer(ctx), new Fireworks(ctx)];

// ---------- Red: para multijugador, cambia SOLO esta línea ----------
const net = new OfflineAdapter(bus);
// const net = new WebSocketAdapter(bus, 'ws://localhost:8080');

// ---------- Juego ----------
const director = new ShowDirector(ctx, net);
const players = new PlayerManager(ctx, net);
const input = new Input(renderer.domElement);
const controller = new PlayerController(input, bus);
const rig = new CameraRig(ctx, controller);
const audio = new AudioEngine(bus);
const hud = new HUD({ bus, director, audio, rig, input, canvas: renderer.domElement });

bus.on('net:welcome', w => {
  clock.syncServerTime(w.serverNow);
  clock.setShowStart(w.showStart);
  controller.attach(players.local);
});

async function start() {
  const profile = await hud.showLobby();
  await net.connect(profile);
  audio.startDemo();
  rig.setMode('fp');
}

// ---------- Bucle ----------
const timer = new THREE.Clock();
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(timer.getDelta(), 0.05);
  const t = clock.time;
  const { beat, energy } = audio.update(t, dt);
  const frame = { t, dt, beat, energy };

  palette.update(frame);
  controller.update(dt);
  players.update(frame);
  director.update(frame);
  for (const system of world) system.update(frame);
  rig.update(dt, players.local, players.localAvatar);

  bloom.strength = 0.9 + beat * 0.8;
  composer.render();
  input.endFrame();
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});

loop();   // el estadio se ve detrás del lobby
start();