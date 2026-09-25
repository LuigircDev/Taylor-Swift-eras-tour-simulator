export const ERAS = [
  { name: 'Lover',      colors: [0xff8fd8, 0x8fd3ff, 0xffe1f5] },
  { name: 'Fearless',   colors: [0xffc94d, 0xffe9a8, 0xfff6dd] },
  { name: 'Red',        colors: [0xff1e3c, 0xffffff, 0x990011] },
  { name: 'Speak Now',  colors: [0xb45cff, 0xe6c2ff, 0x7a1fd6] },
  { name: 'Reputation', colors: [0x39ff14, 0xffffff, 0x0b5f00] },
  { name: 'Folklore',   colors: [0xb8c9b8, 0xeeeeee, 0x6b8e6b] },
  { name: '1989',       colors: [0x4fc3ff, 0xffe07a, 0x7affd4] },
  { name: 'Midnights',  colors: [0x3b4cff, 0xb58bff, 0xff6bd6] },
];

export const WORLD = {
  seed: 1989,            // misma semilla = mismo público en todos los clientes
  floorRadius: 55,
  spawn: { x: 10, z: 10 },
  colliders: [
    { type: 'box', minX: -22, maxX: 22, minZ: -52, maxZ: -38 }, // escenario principal
    { type: 'box', minX: -2.2, maxX: 2.2, minZ: -38, maxZ: 18 }, // pasarela
    { type: 'circle', x: 0, z: 22, r: 7.3 },                     // escenario B
  ],
};