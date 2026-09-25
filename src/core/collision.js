import { WORLD } from '../config.js';

// Compartido entre cliente y (en el futuro) servidor para validar posiciones
export function isBlocked(x, z, r = 0.35) {
  if (Math.hypot(x, z) > WORLD.floorRadius) return true;
  return WORLD.colliders.some(c =>
    c.type === 'box'
      ? x > c.minX - r && x < c.maxX + r && z > c.minZ - r && z < c.maxZ + r
      : Math.hypot(x - c.x, z - c.z) < c.r + r
  );
}