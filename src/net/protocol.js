export const MSG = Object.freeze({
  WELCOME: 'welcome',
  PLAYER_JOIN: 'player_join',
  PLAYER_LEAVE: 'player_leave',
  PLAYER_STATE: 'player_state',
  SHOW_EVENT: 'show_event',
  EMOTE: 'emote',
  HOST: 'host',
});

export const NET_TICK_HZ = 10;

export const encodeState = p => ({
  id: p.id,
  x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2),
  yaw: +p.yaw.toFixed(3),
});