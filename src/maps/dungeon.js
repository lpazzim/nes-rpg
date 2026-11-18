// =====================================================================
// GERADOR DE DUNGEONS
// Salas retangulares ligadas por corredores, sempre iguais para a mesma
// semente. A primeira sala tem a escada de subida; a sala mais distante,
// a escada de descida (ou a passagem para o chefe).
// =====================================================================
import { MapBuilder, makeRng } from './builder.js';

// chão e parede de cada tema
const FLOOR = { roots: 'n', castle: 'c', lab: 'm' };
const WALL = { roots: 'v', castle: 'x', lab: 'k' };

const DECOR = {
  roots: ['rock', 'stump', 'mushroom', 'mushroom'],
  castle: ['barrel', 'crate', 'rock'],
  lab: ['crate', 'pipe', 'lamp'],
};

export function buildDungeon({
  seed, theme = 'roots', w = 72, h = 56, rooms = 10,
  enemies = ['treant'], perRoom = [2, 3],
  up, down, crystalAtEnd = false, name,
}) {
  const rnd = makeRng(seed);
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const F = FLOOR[theme], WL = WALL[theme];
  const B = new MapBuilder(w, h, WL);

  // 1) salas sem sobreposição
  const list = [];
  for (let tries = 0; tries < 600 && list.length < rooms; tries++) {
    const rw = ri(7, 12), rh = ri(6, 9);
    const r = { x: ri(2, w - rw - 3), y: ri(3, h - rh - 3), w: rw, h: rh };
    if (list.some((o) => r.x < o.x + o.w + 3 && r.x + r.w + 3 > o.x && r.y < o.y + o.h + 3 && r.y + r.h + 3 > o.y)) continue;
    r.cx = Math.floor(r.x + r.w / 2); r.cy = Math.floor(r.y + r.h / 2);
    list.push(r);
  }
  for (const r of list) B.rect(r.x, r.y, r.x + r.w - 1, r.y + r.h - 1, F);

  // 2) corredores (árvore mínima: cada sala liga à mais próxima já conectada)
  const carve = (x0, y0, x1, y1) => {
    const horizFirst = rnd() < 0.5;
    const hLine = (y, a, b) => { for (let x = Math.min(a, b); x <= Math.max(a, b); x++) { B.set(x, y, F); B.set(x, y + 1, F); } };
    const vLine = (x, a, b) => { for (let y = Math.min(a, b); y <= Math.max(a, b); y++) { B.set(x, y, F); B.set(x + 1, y, F); } };
    if (horizFirst) { hLine(y0, x0, x1); vLine(x1, y0, y1); } else { vLine(x0, y0, y1); hLine(y1, x0, x1); }
  };
  const linked = [list[0]];
  const rest = list.slice(1);
  while (rest.length) {
    let best = null, bd = Infinity, from = null;
    for (const r of rest) for (const l of linked) {
      const d = Math.abs(r.cx - l.cx) + Math.abs(r.cy - l.cy);
      if (d < bd) { bd = d; best = r; from = l; }
    }
    carve(from.cx, from.cy, best.cx, best.cy);
    linked.push(best); rest.splice(rest.indexOf(best), 1);
  }
  // um corredor extra para formar um circuito
  if (list.length > 4) carve(list[1].cx, list[1].cy, list[list.length - 1].cx, list[list.length - 1].cy);

  // 3) início e fim
  const start = list[0];
  const end = list.reduce((a, r) => (Math.hypot(r.cx - start.cx, r.cy - start.cy) > Math.hypot(a.cx - start.cx, a.cy - start.cy) ? r : a), start);
  const reserveRoomCross = (r) => { B.reserve(r.x, r.cy - 1, r.x + r.w, r.cy + 2); B.reserve(r.cx - 1, r.y, r.cx + 2, r.y + r.h); };

  // escada de subida (volta para o mapa anterior)
  B.addPx('stairsUp', start.cx * 16 + 8, start.y * 16 + 22);
  B.exit(start.cx - 1, start.y, start.cx + 1, start.y, up.to, up.entry);
  B.entry('entrada', start.cx, start.y + 2, 'down');
  // escada de descida / passagem do chefe
  if (down) {
    B.addPx(down.boss ? 'bossDoor' : 'stairsDown', end.cx * 16 + 8, end.cy * 16 + 10);
    B.exit(end.cx - 1, end.cy - 1, end.cx + 1, end.cy, down.to, down.entry);
    B.entry('escada', end.cx, end.cy + 2, 'down');
  }
  if (crystalAtEnd) B.crystal(end.x + 2, end.y + 1);
  for (const r of list) { reserveRoomCross(r); B.reserve(r.cx - 2, r.cy - 2, r.cx + 2, r.cy + 2); }
  B.reserve(start.x, start.y, start.x + start.w, start.y + start.h);

  // 4) inimigos e decoração
  for (const r of list) {
    if (r === start) continue;
    const type = enemies[Math.floor(rnd() * enemies.length)];
    B.zone(r.cx, r.cy, type, ri(perRoom[0], perRoom[1]), { radius: Math.min(r.w, r.h) / 2 - 1 });
  }
  const decor = DECOR[theme] || DECOR.roots;
  for (const r of list) {
    for (let i = 0; i < 4; i++) {
      const x = ri(r.x + 1, r.x + r.w - 2), y = ri(r.y + 1, r.y + r.h - 2);
      if (B.isReserved(x, y)) continue;
      B.add(decor[Math.floor(rnd() * decor.length)], x, y, 0);
      B.reserve(x, y, x, y);
    }
  }
  return B.build({ theme, dark: true, name });
}
