import { Avatar } from '../entities/Avatar.js';
import { MSG, NET_TICK_HZ, encodeState } from '../net/protocol.js';
import { WORLD } from '../config.js';

export class PlayerManager {
  constructor(ctx, net) {
    this.ctx = ctx; this.net = net;
    this.players = new Map(); // id -> { data, avatar }
    this.localId = null; this.sendAcc = 0;
    const b = ctx.bus;

    b.on('net:' + MSG.WELCOME, w => {
      this.localId = w.playerId;
      w.players.forEach(p => this.add(p));
    });
    b.on('net:' + MSG.PLAYER_JOIN, ({ player }) => this.add(player));
    b.on('net:' + MSG.PLAYER_LEAVE, ({ id }) => this.remove(id));
    b.on('net:' + MSG.PLAYER_STATE, s => {
      if (s.id !== this.localId) this.players.get(s.id)?.avatar.setTarget(s);
    });
    b.on('net:' + MSG.EMOTE, ({ id, emote }) => this.players.get(id)?.avatar.playEmote(emote));
    b.on('local:emote', emote => net.send(MSG.EMOTE, { emote }));
  }

  get local() { return this.players.get(this.localId)?.data; }
  get localAvatar() { return this.players.get(this.localId)?.avatar; }

  add(p) {
    if (this.players.has(p.id)) return;
    const data = {
      x: WORLD.spawn.x + (Math.random() - 0.5) * 3, y: 0,
      z: WORLD.spawn.z + (Math.random() - 0.5) * 3, yaw: 0.3,
      name: 'Swiftie', color: '#ff5fc8', ...p,
    };
    const avatar = new Avatar(data, { isLocal: p.id === this.localId, palette: this.ctx.palette });
    this.ctx.scene.add(avatar.group);
    this.players.set(p.id, { data, avatar });
    this.ctx.bus.emit('players:changed', this.players.size);
  }

  remove(id) {
    const e = this.players.get(id);
    if (!e) return;
    this.ctx.scene.remove(e.avatar.group);
    e.avatar.dispose();
    this.players.delete(id);
    this.ctx.bus.emit('players:changed', this.players.size);
  }

  update({ dt, beat }) {
    for (const { data, avatar } of this.players.values()) avatar.update(dt, beat, data);
    this.sendAcc += dt;
    if (this.local && this.sendAcc >= 1 / NET_TICK_HZ) {
      this.sendAcc = 0;
      this.net.send(MSG.PLAYER_STATE, encodeState(this.local));
    }
  }
}