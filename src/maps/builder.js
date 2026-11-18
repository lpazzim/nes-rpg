// =====================================================================
// CONSTRUTOR DE MAPAS
// Ferramentas para desenhar um mapa em blocos (16 px):
//   chão:   g grama | f floresta | d terra | s campo arado | w água | b ponte
//           c calçamento | m metal | x muralha | k prédio cyber
//           n chão de dungeon | v parede de dungeon
//   objetos: árvores, casas, cercas... (ver src/map/art.js)
//   zones:  áreas de inimigos | exits: passagens para outros mapas
//   entries: pontos de chegada | crystals: cristais de save
// =====================================================================
import { TILE } from '../data.js';
import { hash } from '../map/art.js';

export class MapBuilder {
  constructor(w, h, fill = 'g') {
    this.w = w; this.h = h;
    this.T = Array.from({ length: h }, () => Array(w).fill(fill));
    this.objects = []; this.zones = []; this.exits = []; this.entries = {}; this.npcs = [];
    this.reserved = new Set();
    this.cropTiles = new Set();
  }
  inb(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  get(x, y) { return this.inb(x, y) ? this.T[y][x] : undefined; }
  set(x, y, v) { if (this.inb(x, y)) this.T[y][x] = v; }
  rect(x0, y0, x1, y1, v) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, v); }
  ellipse(cx, cy, rx, ry, v, keep = null) {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 && !(keep && keep.includes(this.get(x, y)))) this.set(x, y, v);
    }
  }
  // linha grossa passando pelos pontos
  stroke(pts, width, paint) {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 4);
      for (let s = 0; s <= steps; s++) {
        const cx = x0 + (x1 - x0) * s / steps, cy = y0 + (y1 - y0) * s / steps, r = width / 2;
        for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
          if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) paint(x, y);
        }
      }
    }
  }
  river(pts, width = 3.2) { this.stroke(pts, width, (x, y) => { if (['g', 'f', 'd'].includes(this.get(x, y))) this.set(x, y, 'w'); }); }
  road(pts, width = 2.6) {
    this.stroke(pts, width, (x, y) => {
      const t = this.get(x, y);
      if (t === 'w') this.set(x, y, 'b'); else if (t === 'g' || t === 'f') this.set(x, y, 'd');
    });
  }
  field(x0, y0, x1, y1, gapSide, gapX, crops = true) {
    this.rect(x0, y0, x1, y1, 's');
    if (crops) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.cropTiles.add(`${x},${y}`);
    for (let x = x0 - 1; x <= x1 + 1; x++) {
      if (!(gapSide === 'top' && (x === gapX || x === gapX + 1))) this.add('fenceH', x, y0 - 1, 0, 0, 2);
      if (!(gapSide === 'bottom' && (x === gapX || x === gapX + 1))) this.add('fenceH', x, y1 + 1, 0, 0, 2);
    }
    for (let y = y0; y <= y1; y++) { this.add('fenceV', x0 - 1, y, 0, 0, 4); this.add('fenceV', x1 + 1, y, 0, 0, 4); }
    this.reserve(x0 - 2, y0 - 2, x1 + 2, y1 + 2);
  }

  // --- objetos -------------------------------------------------------------
  add(type, tx, ty, variant = 0, dx = 0, dy = 0) {
    this.objects.push({ type, variant, x: tx * TILE + 8 + dx, y: ty * TILE + 12 + dy });
  }
  addPx(type, x, y, variant = 0, extra = {}) { this.objects.push({ type, variant, x, y, ...extra }); }
  reserve(x0, y0, x1, y1) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.reserved.add(`${x},${y}`); }
  isReserved(x, y) { return this.reserved.has(`${x},${y}`); }
  nearOpen(x, y, r, open = ['f', 'g']) {
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
      const t = this.get(x + i, y + j); if (t !== undefined && !open.includes(t)) return true;
    }
    return false;
  }
  // árvores numa grade com variação; where(x,y) decide onde pode
  trees(where, { density = 0.88, seed = 100, bushes = true } = {}) {
    for (let ty = 0; ty < this.h; ty += 2) for (let tx = 0; tx < this.w; tx += 2) {
      const x = tx + Math.floor(hash(tx, ty, seed + 1) * 2), y = ty + Math.floor(hash(tx, ty, seed + 2) * 2);
      if (this.isReserved(x, y) || !where(x, y)) continue;
      if (hash(x, y, seed + 3) < density) this.add('tree', x, y, hash(x, y, seed + 4) < 0.5 ? 0 : 1, Math.floor(hash(x, y, seed + 5) * 8) - 4);
      else if (bushes) this.add('bush', x, y);
    }
  }
  crystal(tx, ty, entryName = 'cristal') {
    this.objects.push({ type: 'crystal', x: tx * TILE + 8, y: ty * TILE + 12, interact: 'save', entry: entryName });
    this.entry(entryName, tx, ty + 2, 'down');
    this.reserve(tx - 1, ty - 1, tx + 1, ty + 2);
  }

  // --- jogo ----------------------------------------------------------------
  zone(x, y, type, count, opts = {}) { this.zones.push({ x, y, type, count, ...opts }); }
  // passagem: retângulo (em blocos) que leva a outro mapa/entrada
  exit(x0, y0, x1, y1, to, entry, opts = {}) { this.exits.push({ x0, y0, x1, y1, to, entry, ...opts }); }
  entry(name, x, y, dir = 'down') { this.entries[name] = { x, y, dir }; }
  // morador: id da folha "npcs" e de src/dialogues.js; wander = raio de passeio em blocos (0 = parado)
  npc(id, tx, ty, { dir = 'down', wander = 0 } = {}) {
    this.npcs.push({ id, tx, ty, x: tx * TILE + 8, y: ty * TILE + 8, dir, wander });
    this.reserve(tx - wander, ty - wander, tx + wander, ty + wander);
  }

  build(extra = {}) {
    const crops = this.cropTiles;
    return {
      w: this.w, h: this.h, tiles: this.T, objects: this.objects, zones: this.zones,
      exits: this.exits, entries: this.entries, npcs: this.npcs,
      flowerAt: (x, y) => this.get(x, y) === 'g' && hash(Math.floor(x / 3), Math.floor(y / 3), 111) > 0.62 && hash(x, y, 112) < 0.7,
      cropAt: (x, y) => crops.has(`${x},${y}`),
      ...extra,
    };
  }
}

// gerador pseudoaleatório com semente (mesmo mapa sempre)
export function makeRng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
