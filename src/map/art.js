// =====================================================================
// ARTE DO MAPA — pintada pixel a pixel (estilo SNES)
// Blocos do chão (16x16) e objetos (árvores, casas, cercas...).
// Tudo é desenhado uma vez em buffers de pixels e vira canvas.
// =====================================================================
import { TILE } from '../data.js';

// --- Paleta -----------------------------------------------------------
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), 255];
const P = {
  grass:  ['#2f6b22', '#4b9a32', '#58a838', '#7cc44a', '#9bd65e'].map(hex),
  forest: ['#1f4a1a', '#2f6626', '#3a7a2c', '#4f9638', '#6a8a3a'].map(hex),
  dirt:   ['#8a5f34', '#a87a44', '#c49558', '#d8b072', '#e6c690'].map(hex),
  soil:   ['#4e3220', '#6b4a2e', '#7f5836', '#96693f'].map(hex),
  water:  ['#1d4a8c', '#2a62b0', '#3b7fd0', '#6aa8ec', '#cfe8ff'].map(hex),
  bank:   ['#4a3420', '#6b4a2a', '#8a6438'].map(hex),
  wood:   ['#4a2e17', '#6b4423', '#8a5a32', '#a8763c', '#c8945a'].map(hex),
  stone:  ['#4f4b45', '#6f6a62', '#8c8579', '#a8a294', '#c4beb0'].map(hex),
  cobble: ['#5e5a52', '#7c776d', '#958f83', '#ada79a', '#c8c2b4'].map(hex),
  metal:  ['#12141f', '#1c2032', '#262b42', '#323853', '#454c6c'].map(hex),
  neonC:  hex('#29e0ff'), neonM: hex('#ff3ad0'), neonY: hex('#ffd84a'),
  leaf:   ['#173f14', '#245a1c', '#2f7d2a', '#46a03a', '#6cc24a', '#9be06a'].map(hex),
  roofO:  ['#6e2c14', '#8e3f1e', '#b0532a', '#c86a34', '#e08a4a'].map(hex),
  roofG:  ['#2e2a2a', '#433c3a', '#5a514c', '#726760'].map(hex),
  plaster: ['#b8a582', '#d8c8a2', '#ece0c0'].map(hex),
  hay:    ['#8a6a20', '#b8902c', '#e0c060', '#f2dc8a'].map(hex),
  flowers: ['#ff8ad8', '#ffe14a', '#ffffff', '#b48aff', '#ff6a5a'].map(hex),
  shadow: [0, 0, 0, 70],
  cave:   ['#1c1610', '#2a2218', '#3a2e20', '#4a3c2a', '#5c4a32'].map(hex),
  moss:   ['#2a3f1a', '#3f5a24', '#56782e'].map(hex),
  root:   ['#2e2014', '#4a3220', '#6a4a2c'].map(hex),
  caveWall: ['#0e0b08', '#1a140e', '#33261a', '#4a3624', '#634a30'].map(hex),
  glow:   ['#3ad8c8', '#a06aff', '#e8fff8'].map(hex),
  outline: hex('#141a12'),
};

// --- Ruído determinístico ---------------------------------------------
export function hash(x, y, s = 0) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 982451653)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function smooth(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

// --- Buffer de pixels -------------------------------------------------
export class PixelBuf {
  constructor(w, h) { this.w = w; this.h = h; this.data = new Uint8ClampedArray(w * h * 4); }
  set(x, y, c) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4, a = c[3] ?? 255;
    if (a === 255 || this.data[i + 3] === 0) { this.data[i] = c[0]; this.data[i + 1] = c[1]; this.data[i + 2] = c[2]; this.data[i + 3] = a === 255 ? 255 : a; return; }
    const t = a / 255; // mistura (sombras)
    this.data[i] = this.data[i] * (1 - t) + c[0] * t;
    this.data[i + 1] = this.data[i + 1] * (1 - t) + c[1] * t;
    this.data[i + 2] = this.data[i + 2] * (1 - t) + c[2] * t;
  }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
  disc(cx, cy, r, c, ry = r) {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
      const dx = (x - cx) / r, dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) this.set(x, y, c);
    }
  }
  toCanvas() {
    const c = document.createElement('canvas');
    c.width = this.w; c.height = this.h;
    c.getContext('2d').putImageData(new ImageData(this.data, this.w, this.h), 0, 0);
    return c;
  }
}

// =====================================================================
// CHÃO
// =====================================================================
// Tipos: g grama | f chão de floresta | d terra | s campo arado | w água
//        b ponte | c calçamento | m piso metálico | x muralha | k prédio cyber
const WALKABLE_EDGE = new Set(['g', 'f']);

export function paintGround(map) {
  const { w, h, get } = map;
  const buf = new PixelBuf(w * TILE, h * TILE);
  for (let ty = 0; ty < h; ty++) for (let tx = 0; tx < w; tx++) {
    const t = get(tx, ty), ox = tx * TILE, oy = ty * TILE;
    const nb = { u: get(tx, ty - 1), d: get(tx, ty + 1), l: get(tx - 1, ty), r: get(tx + 1, ty) };
    switch (t) {
      case 'g': grassTile(buf, ox, oy, tx, ty, false, map); break;
      case 'f': grassTile(buf, ox, oy, tx, ty, true, map); break;
      case 'd': dirtTile(buf, ox, oy, nb); break;
      case 's': soilTile(buf, ox, oy, tx, ty, nb, map); break;
      case 'w': waterTile(buf, ox, oy, nb); break;
      case 'b': bridgeTile(buf, ox, oy, nb); break;
      case 'c': cobbleTile(buf, ox, oy, tx, ty, nb); break;
      case 'm': metalTile(buf, ox, oy, tx, ty, nb); break;
      case 'x': wallTile(buf, ox, oy, nb); break;
      case 'k': cyberBlockTile(buf, ox, oy, tx, ty, nb); break;
      case 'n': caveFloorTile(buf, ox, oy, tx, ty, nb); break;
      case 'v': caveWallTile(buf, ox, oy, tx, ty, nb); break;
    }
    if (WALKABLE_EDGE.has(t)) landEdges(buf, ox, oy, nb, tx, ty);
  }
  return buf.toCanvas();
}

function grassTile(b, ox, oy, tx, ty, forest, map) {
  const pal = forest ? P.forest : P.grass;
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const X = ox + x, Y = oy + y;
    const patch = smooth(X / 40, Y / 40, forest ? 7 : 3);
    const n = hash(X, Y, 1);
    let c = patch > 0.55 ? pal[2] : pal[1];
    if (patch > 0.75) c = pal[3];
    if (n < 0.06) c = pal[0];
    else if (n > 0.95) c = pal[Math.min(4, (patch > 0.55 ? 3 : 2) + 1)];
    b.set(X, Y, c);
  }
  // tufos de grama ("v")
  for (let i = 0; i < 3; i++) {
    const x = ox + 2 + Math.floor(hash(tx, ty, 10 + i) * 12), y = oy + 3 + Math.floor(hash(tx, ty, 20 + i) * 11);
    b.set(x, y, pal[0]); b.set(x - 1, y - 1, pal[forest ? 3 : 4]); b.set(x + 1, y - 1, pal[forest ? 3 : 4]); b.set(x, y - 2, pal[3]);
  }
  if (forest) {                                     // folhas caídas
    for (let i = 0; i < 3; i++) if (hash(tx, ty, 30 + i) < 0.5) {
      const x = ox + Math.floor(hash(tx, ty, 40 + i) * 15), y = oy + Math.floor(hash(tx, ty, 50 + i) * 15);
      b.set(x, y, P.wood[2]); b.set(x + 1, y, P.wood[1]);
    }
  } else if (map.flowerAt(tx, ty)) {                // flores no prado
    for (let i = 0; i < 4; i++) {
      const x = ox + 2 + Math.floor(hash(tx, ty, 60 + i) * 12), y = oy + 2 + Math.floor(hash(tx, ty, 70 + i) * 12);
      const c = P.flowers[Math.floor(hash(tx, ty, 80 + i) * P.flowers.length)];
      b.set(x, y, c); b.set(x + 1, y, c); b.set(x, y + 1, c); b.set(x + 1, y + 1, P.grass[0]);
    }
  }
}

// Borda orgânica: grama invadindo terra, margem do rio etc.
function landEdges(b, ox, oy, nb, tx, ty) {
  const sides = [['u', 0, -1], ['d', 0, 1], ['l', -1, 0], ['r', 1, 0]];
  for (const [k] of sides) {
    if (nb[k] !== 'w') continue;
    // margem de terra junto à água (3-4 px)
    for (let i = 0; i < 16; i++) {
      const depth = 2 + Math.floor(hash(tx * 16 + i, ty, k.charCodeAt(0)) * 2);
      for (let d = 0; d < depth; d++) {
        const c = d === 0 ? P.bank[0] : d === depth - 1 ? P.bank[2] : P.bank[1];
        if (k === 'u') b.set(ox + i, oy + d, c);
        if (k === 'd') b.set(ox + i, oy + 15 - d, c);
        if (k === 'l') b.set(ox + d, oy + i, c);
        if (k === 'r') b.set(ox + 15 - d, oy + i, c);
      }
    }
  }
}

function dirtTile(b, ox, oy, nb) {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const X = ox + x, Y = oy + y, n = hash(X, Y, 2), m = smooth(X / 9, Y / 9, 4);
    let c = m > 0.6 ? P.dirt[3] : P.dirt[2];
    if (n < 0.07) c = P.dirt[1];
    else if (n > 0.96) c = P.dirt[4];
    b.set(X, Y, c);
  }
  // pedrinhas
  for (let i = 0; i < 2; i++) {
    const x = ox + 2 + Math.floor(hash(ox, oy, 90 + i) * 12), y = oy + 2 + Math.floor(hash(ox, oy, 95 + i) * 12);
    b.set(x, y, P.dirt[4]); b.set(x + 1, y, P.dirt[3]); b.set(x, y + 1, P.dirt[1]); b.set(x + 1, y + 1, P.dirt[1]);
  }
  grassOverhang(b, ox, oy, nb, new Set(['g', 'f', 's']));
}

// Grama irregular nas bordas de terra/campo (como no SNES)
function grassOverhang(b, ox, oy, nb, grassy) {
  for (const k of ['u', 'd', 'l', 'r']) {
    if (!grassy.has(nb[k])) continue;
    const pal = nb[k] === 'f' ? P.forest : P.grass;
    for (let i = 0; i < 16; i++) {
      const depth = 1 + Math.floor(smooth((ox + oy + i) / 3, k.charCodeAt(0), 5) * 3.5);
      for (let d = 0; d <= depth; d++) {
        const c = d === depth ? P.dirt[1] : (d === depth - 1 ? pal[1] : pal[2]);
        if (k === 'u') b.set(ox + i, oy + d, c);
        if (k === 'd') b.set(ox + i, oy + 15 - d, d === depth ? P.dirt[1] : pal[d === 0 ? 1 : 2]);
        if (k === 'l') b.set(ox + d, oy + i, c);
        if (k === 'r') b.set(ox + 15 - d, oy + i, c);
      }
    }
  }
}

function soilTile(b, ox, oy, tx, ty, nb, map) {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const X = ox + x, Y = oy + y, row = Y % 6;
    let c = row < 2 ? P.soil[1] : row < 4 ? P.soil[2] : row === 4 ? P.soil[3] : P.soil[0];
    if (hash(X, Y, 3) < 0.05) c = P.soil[0];
    b.set(X, Y, c);
  }
  // plantação (brotos nas leiras)
  if (map.cropAt(tx, ty)) {
    for (let y = 2; y < 16; y += 6) for (let x = 1; x < 16; x += 4) {
      const X = ox + x, Y = oy + y;
      b.set(X, Y, P.grass[1]); b.set(X + 1, Y, P.grass[2]); b.set(X, Y - 1, P.grass[3]);
      b.set(X + 1, Y - 2, P.grass[4]); b.set(X - 1, Y - 1, P.grass[2]);
    }
  }
  grassOverhang(b, ox, oy, nb, new Set(['g', 'f']));
}

function waterTile(b, ox, oy, nb) {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const X = ox + x, Y = oy + y, m = smooth(X / 14, Y / 10, 6);
    let c = m > 0.62 ? P.water[1] : P.water[2];
    // ondinhas
    if ((X + Math.floor(Y * 1.7)) % 11 === 0 && hash(X >> 2, Y, 7) < 0.35) c = P.water[3];
    b.set(X, Y, c);
  }
  // borda escura + espuma junto à terra
  const land = (k) => nb[k] !== 'w' && nb[k] !== 'b';
  for (let i = 0; i < 16; i++) {
    const foam = hash(ox + i, oy, 8) < 0.6;
    if (land('u')) { b.set(ox + i, oy, P.water[0]); if (foam) b.set(ox + i, oy + 1, P.water[4]); }
    if (land('d')) { b.set(ox + i, oy + 15, P.water[0]); if (foam) b.set(ox + i, oy + 14, P.water[3]); }
    if (land('l')) { b.set(ox, oy + i, P.water[0]); if (foam) b.set(ox + 1, oy + i, P.water[4]); }
    if (land('r')) { b.set(ox + 15, oy + i, P.water[0]); if (foam) b.set(ox + 14, oy + i, P.water[4]); }
  }
}

function bridgeTile(b, ox, oy, nb) {
  // tábuas atravessando o rio
  // ponte "horizontal" = atravessa da esquerda para a direita (tábuas em pé)
  const road = (t) => t === 'b' || t === 'd';
  const horizontal = road(nb.l) || road(nb.r) || !(road(nb.u) || road(nb.d));
  const railA = horizontal ? nb.u === 'w' : nb.l === 'w';
  const railB = horizontal ? nb.d === 'w' : nb.r === 'w';
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const along = horizontal ? x : y, across = horizontal ? y : x;
    let c = P.wood[3];
    if (along % 4 === 3) c = P.wood[1];                 // fresta entre tábuas
    else if (along % 4 === 0) c = P.wood[4];
    if (hash(ox + x, oy + y, 9) < 0.06) c = P.wood[2];
    if (railA && across <= 2) c = across === 1 ? P.wood[2] : P.wood[0];
    if (railB && across >= 13) c = across === 14 ? P.wood[2] : P.wood[0];
    b.set(ox + x, oy + y, c);
  }
  // pilares do corrimão
  for (let a = 1; a < 16; a += 8) {
    if (railA) { const [x, y] = horizontal ? [a, 0] : [0, a]; b.rect(ox + x, oy + y, 2, 2, P.wood[4]); }
    if (railB) { const [x, y] = horizontal ? [a, 14] : [14, a]; b.rect(ox + x, oy + y, 2, 2, P.wood[4]); }
  }
}

function cobbleTile(b, ox, oy, tx, ty, nb) {
  b.rect(ox, oy, 16, 16, P.cobble[1]);
  const worn = smooth(tx / 5, ty / 5, 25) > 0.62;      // manchas de pedra mais escura/gasta
  // pedras 4x4 com deslocamento por linha
  for (let r = 0; r < 4; r++) for (let q = -1; q < 4; q++) {
    const sx = ox + q * 5 + (r % 2 ? 2 : 0) + 1, sy = oy + r * 4;
    const v = hash(tx * 7 + q, ty * 7 + r, 11);
    let base = v < 0.3 ? P.cobble[2] : v < 0.8 ? P.cobble[3] : P.cobble[4];
    if (worn) base = v < 0.5 ? P.cobble[1] : P.cobble[2];
    for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) {
      const X = sx + x, Y = sy + y;
      if (X < ox || X >= ox + 16 || Y >= oy + 16) continue;
      if ((x === 0 || x === 3) && (y === 0 || y === 2)) continue;  // cantos arredondados
      b.set(X, Y, y === 0 ? P.cobble[4] : y === 2 ? P.cobble[2] : base);
    }
  }
  // musgo/grama entre as pedras
  if (hash(tx, ty, 26) < 0.35) for (let i = 0; i < 3; i++) {
    const x = ox + Math.floor(hash(tx, ty, 27 + i) * 15), y = oy + 3 + 4 * Math.floor(hash(tx, ty, 30 + i) * 3);
    b.set(x, y, P.grass[1]); b.set(x + 1, y, P.grass[2]);
  }
  for (const k of ['u', 'd', 'l', 'r']) {           // meio-fio
    if (nb[k] === 'c' || nb[k] === 'x' || nb[k] === undefined) continue;
    for (let i = 0; i < 16; i++) {
      if (k === 'u') b.set(ox + i, oy, P.cobble[0]);
      if (k === 'd') b.set(ox + i, oy + 15, P.cobble[0]);
      if (k === 'l') b.set(ox, oy + i, P.cobble[0]);
      if (k === 'r') b.set(ox + 15, oy + i, P.cobble[0]);
    }
  }
}

function metalTile(b, ox, oy, tx, ty, nb) {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    let c = P.metal[2];
    if (x === 0 || y === 0) c = P.metal[1];
    else if (x === 15 || y === 15) c = P.metal[3];
    else if (hash(ox + x, oy + y, 12) < 0.05) c = P.metal[1];
    b.set(ox + x, oy + y, c);
  }
  for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]]) b.set(ox + x, oy + y, P.metal[4]); // rebites
  const v = hash(tx, ty, 13);
  if (v < 0.18) {                                   // faixa de neon no chão
    const c = v < 0.09 ? P.neonC : P.neonM;
    if (hash(tx, ty, 14) < 0.5) for (let x = 3; x < 13; x++) b.set(ox + x, oy + 8, c);
    else for (let y = 3; y < 13; y++) b.set(ox + 8, oy + y, c);
  } else if (v > 0.93) {                            // grade de ventilação
    for (let y = 4; y < 12; y += 2) for (let x = 4; x < 12; x++) b.set(ox + x, oy + y, P.metal[0]);
  }
  // borda de neon onde o metal encontra outro chão
  for (const k of ['u', 'd', 'l', 'r']) {
    if (nb[k] === 'm' || nb[k] === 'k' || nb[k] === undefined) continue;
    for (let i = 0; i < 16; i++) {
      if (k === 'u') { b.set(ox + i, oy, P.metal[0]); b.set(ox + i, oy + 1, P.neonC); }
      if (k === 'd') { b.set(ox + i, oy + 15, P.metal[0]); b.set(ox + i, oy + 14, P.neonC); }
      if (k === 'l') { b.set(ox, oy + i, P.metal[0]); b.set(ox + 1, oy + i, P.neonC); }
      if (k === 'r') { b.set(ox + 15, oy + i, P.metal[0]); b.set(ox + 14, oy + i, P.neonC); }
    }
  }
}

function wallTile(b, ox, oy, nb) {
  const face = nb.d !== 'x';
  if (face) {
    // face de tijolos
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const row = Math.floor(y / 4), off = row % 2 ? 4 : 0;
      let c = (y % 4 === 3 || (x + off) % 8 === 7) ? P.stone[1] : P.stone[2];
      if (y % 4 === 0 && (x + off) % 8 !== 7) c = P.stone[3];
      if (hash(ox + x, oy + y, 15) < 0.05) c = P.stone[1];
      if (y >= 14) c = P.stone[0];
      b.set(ox + x, oy + y, c);
    }
  } else {
    // topo da muralha (caminho de ronda)
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      let c = hash(ox + x, oy + y, 16) < 0.1 ? P.stone[2] : P.stone[3];
      if ((x + y * 3) % 13 === 0) c = P.stone[2];
      b.set(ox + x, oy + y, c);
    }
  }
  if (nb.u !== 'x') {                                // ameias
    for (let x = 0; x < 16; x++) {
      const merlon = x % 8 < 5;
      b.set(ox + x, oy, merlon ? P.stone[4] : P.stone[1]);
      b.set(ox + x, oy + 1, merlon ? P.stone[3] : P.stone[1]);
      b.set(ox + x, oy + 2, merlon ? P.stone[2] : P.stone[0]);
    }
  }
  // ameias nas muralhas laterais (lado de fora)
  if (!face) for (const side of ['l', 'r']) {
    if (nb[side] === 'x') continue;
    for (let y = 0; y < 16; y++) {
      const merlon = (oy + y) % 8 < 5;
      for (let d = 0; d < 4; d++) {
        const x = side === 'l' ? ox + d : ox + 15 - d;
        b.set(x, oy + y, merlon ? (d === 0 ? P.stone[1] : d === 3 ? P.stone[2] : P.stone[4]) : (d === 3 ? P.stone[1] : P.stone[2]));
      }
    }
  }
  if (nb.l !== 'x') for (let y = 0; y < 16; y++) b.set(ox, oy + y, P.stone[0]);
  if (nb.r !== 'x') for (let y = 0; y < 16; y++) b.set(ox + 15, oy + y, P.stone[0]);
}

function cyberBlockTile(b, ox, oy, tx, ty, nb) {
  const face = nb.d !== 'k';
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    let c = face ? P.metal[1] : P.metal[3];
    if (!face && (x % 8 === 0 || y % 8 === 0)) c = P.metal[2];
    if (face && y >= 14) c = P.metal[0];
    b.set(ox + x, oy + y, c);
  }
  if (face) {
    // janelas de neon e cano
    const c = hash(tx, ty, 17) < 0.5 ? P.neonC : P.neonM;
    for (let x = 3; x < 13; x++) if (x % 4 !== 2) { b.set(ox + x, oy + 5, c); b.set(ox + x, oy + 6, c); }
    for (let x = 0; x < 16; x++) b.set(ox + x, oy + 10, P.metal[4]);
  } else if (hash(tx, ty, 18) < 0.3) {
    b.rect(ox + 4, oy + 4, 8, 6, P.metal[1]);      // ventilação no teto
    for (let x = 5; x < 11; x += 2) b.rect(ox + x, oy + 5, 1, 4, P.metal[0]);
  }
  if (nb.u !== 'k') for (let x = 0; x < 16; x++) b.set(ox + x, oy, P.neonM);
  if (nb.l !== 'k') for (let y = 0; y < 16; y++) b.set(ox, oy + y, P.metal[0]);
  if (nb.r !== 'k') for (let y = 0; y < 16; y++) b.set(ox + 15, oy + y, P.metal[0]);
}

// --- Caverna de raízes (dungeon da aventura 1) ---------------------------
function caveFloorTile(b, ox, oy, tx, ty, nb) {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const X = ox + x, Y = oy + y, m = smooth(X / 12, Y / 12, 31), n = hash(X, Y, 34);
    let c = m > 0.58 ? P.cave[3] : P.cave[2];
    if (n < 0.07) c = P.cave[1]; else if (n > 0.96) c = P.cave[4];
    if (smooth(X / 7, Y / 7, 32) > 0.72) c = n < 0.5 ? P.moss[1] : P.moss[0];
    b.set(X, Y, c);
  }
  if (hash(tx, ty, 33) < 0.22) {                    // raiz atravessando o chão
    const base = 4 + Math.floor(hash(tx, ty, 35) * 8);
    for (let i = 0; i < 16; i++) {
      const y = oy + base + Math.round(Math.sin((ox + i) / 3.5) * 1.5);
      b.set(ox + i, y, P.root[1]); b.set(ox + i, y - 1, P.root[2]); b.set(ox + i, y + 1, P.root[0]);
    }
  }
  // sombra das paredes
  if (nb.u === 'v') for (let y = 0; y < 4; y++) for (let x = 0; x < 16; x++) b.set(ox + x, oy + y, [0, 0, 0, 120 - y * 28]);
  if (nb.l === 'v') for (let x = 0; x < 3; x++) for (let y = 0; y < 16; y++) b.set(ox + x, oy + y, [0, 0, 0, 80 - x * 25]);
  if (nb.r === 'v') for (let x = 0; x < 3; x++) for (let y = 0; y < 16; y++) b.set(ox + 15 - x, oy + y, [0, 0, 0, 80 - x * 25]);
}

function caveWallTile(b, ox, oy, tx, ty, nb) {
  const face = nb.d !== undefined && nb.d !== 'v';
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const X = ox + x, Y = oy + y, n = hash(X, Y, 36);
    let c;
    if (face) {
      // parede de terra com veios verticais
      const stripe = hash(X >> 1, 0, 37);
      c = stripe < 0.3 ? P.caveWall[2] : stripe < 0.8 ? P.caveWall[3] : P.caveWall[4];
      if (n < 0.08) c = P.caveWall[1];
      if (y >= 14) c = P.caveWall[1];
      if (y === 0) c = P.caveWall[4];
    } else {
      c = n < 0.04 ? P.caveWall[1] : P.caveWall[0];
    }
    b.set(X, Y, c);
  }
  if (face) {
    // raízes penduradas
    for (let i = 0; i < 3; i++) {
      const x = ox + 2 + Math.floor(hash(tx, ty, 38 + i) * 12), len = 4 + Math.floor(hash(tx, ty, 41 + i) * 9);
      for (let y = 0; y < len; y++) { b.set(x + Math.round(Math.sin(y / 2)), oy + y, P.root[1]); b.set(x + 1 + Math.round(Math.sin(y / 2)), oy + y, P.root[0]); }
    }
    if (hash(tx, ty, 44) < 0.3) {                   // cogumelo brilhante na parede
      const x = ox + 3 + Math.floor(hash(tx, ty, 45) * 10), y = oy + 8 + Math.floor(hash(tx, ty, 46) * 4);
      b.set(x, y, P.glow[0]); b.set(x + 1, y, P.glow[0]); b.set(x, y + 1, P.glow[2]);
    }
  } else {
    // borda do topo junto ao chão
    const edge = (k) => nb[k] !== undefined && nb[k] !== 'v';
    for (let i = 0; i < 16; i++) {
      if (edge('l')) { b.set(ox, oy + i, P.caveWall[3]); b.set(ox + 1, oy + i, P.caveWall[2]); }
      if (edge('r')) { b.set(ox + 15, oy + i, P.caveWall[3]); b.set(ox + 14, oy + i, P.caveWall[2]); }
      if (edge('u')) { b.set(ox + i, oy, P.caveWall[3]); b.set(ox + i, oy + 1, P.caveWall[2]); }
    }
    if (hash(tx, ty, 47) < 0.15) {                  // raízes no escuro
      for (let i = 0; i < 10; i++) b.set(ox + 3 + i, oy + 6 + Math.round(Math.sin(i / 2) * 2), P.root[0]);
    }
  }
}

// =====================================================================
// OBJETOS (desenhados uma vez; âncora = base, no chão)
// =====================================================================
function shade(b, cx, cy, rx, ry) { b.disc(cx, cy, rx, P.shadow, ry); }

function leafBlobs(b, blobs, pal = P.leaf) {
  for (const [x, y, r] of blobs) b.disc(x, y, r + 1, P.outline);
  for (const [x, y, r] of blobs) b.disc(x, y, r, pal[1]);
  for (const [x, y, r] of blobs) b.disc(x - 1, y - 1, r - 1, pal[2]);
  for (const [x, y, r] of blobs) b.disc(x - 2, y - 2, Math.max(1, r - 3), pal[3]);
  for (const [x, y, r] of blobs) b.disc(x - 3, y - 3, Math.max(1, r - 6), pal[4]);
  // textura de folhas (pontilhado)
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
    const i = (y * b.w + x) * 4;
    if (b.data[i + 3] !== 255) continue;
    const n = hash(x, y, 21);
    if (n < 0.08) b.set(x, y, pal[1]);
    else if (n > 0.95) b.set(x, y, pal[5]);
  }
}

const OBJECTS = {
  tree(v) {
    const b = new PixelBuf(40, 50);
    shade(b, 20, 46, 15, 4);
    b.rect(17, 32, 6, 15, P.wood[1]); b.rect(17, 32, 2, 15, P.wood[0]); b.rect(21, 32, 1, 15, P.wood[2]);
    b.set(15, 46, P.wood[0]); b.set(16, 45, P.wood[1]); b.set(24, 46, P.wood[0]); b.set(23, 45, P.wood[1]);
    const blobs = v === 0
      ? [[20, 16, 12], [11, 23, 9], [29, 23, 9], [20, 27, 10], [14, 11, 7], [26, 11, 7]]
      : [[20, 14, 11], [12, 21, 8], [28, 20, 9], [19, 26, 9], [22, 8, 7]];
    leafBlobs(b, blobs);
    return { buf: b, ax: 20, ay: 46, foot: [12, 6] };
  },
  bush() {
    const b = new PixelBuf(22, 18);
    shade(b, 11, 15, 9, 3);
    leafBlobs(b, [[11, 9, 6], [6, 11, 4], [16, 11, 4]]);
    return { buf: b, ax: 11, ay: 15, foot: [14, 6] };
  },
  rock() {
    const b = new PixelBuf(18, 14);
    shade(b, 9, 11, 8, 3);
    b.disc(9, 7, 7, P.outline, 5); b.disc(9, 7, 6, P.stone[2], 4); b.disc(8, 6, 4, P.stone[3], 3); b.disc(7, 5, 2, P.stone[4], 1);
    return { buf: b, ax: 9, ay: 11, foot: [12, 5] };
  },
  stump() {
    const b = new PixelBuf(16, 12);
    shade(b, 8, 10, 7, 2);
    b.rect(3, 4, 10, 6, P.wood[1]); b.disc(8, 4, 5, P.wood[3], 2); b.disc(8, 4, 2, P.wood[2], 1);
    b.rect(3, 4, 1, 6, P.wood[0]);
    return { buf: b, ax: 8, ay: 10, foot: [10, 4] };
  },
  fenceH() {
    const b = new PixelBuf(16, 14);
    for (const px of [1, 13]) { b.rect(px, 2, 2, 11, P.wood[1]); b.rect(px, 2, 1, 11, P.wood[2]); b.set(px, 1, P.wood[3]); }
    b.rect(0, 4, 16, 2, P.wood[3]); b.rect(0, 5, 16, 1, P.wood[1]);
    b.rect(0, 9, 16, 2, P.wood[3]); b.rect(0, 10, 16, 1, P.wood[1]);
    return { buf: b, ax: 8, ay: 12, foot: [16, 4] };
  },
  fenceV() {
    const b = new PixelBuf(8, 20);
    b.rect(3, 0, 2, 19, P.wood[1]); b.rect(3, 0, 1, 19, P.wood[3]);
    b.rect(2, 2, 4, 2, P.wood[2]); b.rect(2, 14, 4, 2, P.wood[2]);
    return { buf: b, ax: 4, ay: 18, foot: [4, 16] };
  },
  barn() {
    const b = new PixelBuf(68, 62);
    shade(b, 34, 58, 34, 5);
    // paredes de tábuas
    for (let y = 26; y < 58; y++) for (let x = 4; x < 64; x++) {
      let c = x % 5 === 0 ? P.wood[0] : (x % 5 === 1 ? P.wood[3] : P.wood[2]);
      if (hash(x, y, 22) < 0.05) c = P.wood[1];
      b.set(x, y, c);
    }
    b.rect(4, 26, 60, 2, P.wood[0]); b.rect(4, 56, 60, 2, P.wood[0]);
    // portão duplo com X
    b.rect(24, 36, 20, 20, P.wood[1]); b.rect(24, 36, 20, 1, P.wood[0]); b.rect(33, 36, 2, 20, P.wood[0]);
    for (let i = 0; i < 18; i++) {
      b.set(25 + Math.floor(i * 8 / 18), 37 + i, P.wood[3]); b.set(32 - Math.floor(i * 8 / 18), 37 + i, P.wood[3]);
      b.set(36 + Math.floor(i * 7 / 18), 37 + i, P.wood[3]); b.set(42 - Math.floor(i * 7 / 18), 37 + i, P.wood[3]);
    }
    // janelas
    b.rect(10, 34, 8, 7, P.wood[0]); b.rect(11, 35, 6, 5, hex('#2a3a5a')); b.set(12, 36, hex('#8ab0e0'));
    b.rect(50, 34, 8, 7, P.wood[0]); b.rect(51, 35, 6, 5, hex('#2a3a5a')); b.set(52, 36, hex('#8ab0e0'));
    // telhado
    for (let y = 2; y < 28; y++) {
      const inset = Math.max(0, 10 - Math.floor(y / 2.6));
      for (let x = inset; x < 68 - inset; x++) {
        let c = y % 4 === 0 ? P.roofG[0] : (y % 4 === 1 ? P.roofG[3] : P.roofG[2]);
        if ((x + (Math.floor(y / 4) % 2) * 3) % 6 === 0 && y % 4 !== 0) c = P.roofG[1];
        b.set(x, y, c);
      }
    }
    b.rect(0, 26, 68, 2, P.roofG[0]);
    return { buf: b, ax: 34, ay: 58, foot: [62, 26] };
  },
  house(v) {
    const W = 66, WT = 36, WB = 70;                  // largura, topo da parede, base
    const b = new PixelBuf(W, WB + 4);
    shade(b, W / 2, WB, W / 2 - 1, 4);
    // paredes enxaimel
    b.rect(5, WT, W - 10, WB - WT, P.plaster[1]);
    for (let y = WT; y < WB; y++) for (let x = 5; x < W - 5; x++) if (hash(x, y, 23) < 0.06) b.set(x, y, P.plaster[0]);
    for (const x of [5, 19, W - 21, W - 7]) b.rect(x, WT, 2, WB - WT, P.wood[1]);
    b.rect(5, WT, W - 10, 2, P.wood[1]); b.rect(5, WT + 15, W - 10, 2, P.wood[1]); b.rect(5, WB - 2, W - 10, 2, P.wood[0]);
    for (let i = 0; i < 13; i++) { b.set(7 + i, WT + 2 + i, P.wood[1]); b.set(W - 8 - i, WT + 2 + i, P.wood[1]); } // mãos-francesas
    // porta (com degrau) e janelas com floreira
    const dx = W / 2 - 5;
    b.rect(dx, WT + 17, 11, WB - WT - 17, P.wood[0]); b.rect(dx + 1, WT + 18, 9, WB - WT - 18, P.wood[2]);
    b.rect(dx + 1, WT + 18, 9, 2, P.wood[1]); b.set(dx + 7, WT + 26, P.neonY); b.rect(dx - 1, WB - 2, 13, 2, P.stone[3]);
    for (const wx of [9, W - 17]) {
      b.rect(wx, WT + 19, 8, 8, P.wood[0]); b.rect(wx + 1, WT + 20, 6, 6, hex('#3a5a8a'));
      b.rect(wx + 1, WT + 20, 2, 2, hex('#a8d0f0')); b.rect(wx + 4, WT + 20, 1, 6, P.wood[0]);
      b.rect(wx - 1, WT + 27, 10, 3, P.wood[1]);
      for (let i = 0; i < 4; i++) b.set(wx + 1 + i * 2, WT + 26, P.flowers[(i + v) % 5]);
    }
    // telhado
    const roof = v === 1 ? [P.roofG[0], P.roofG[1], P.roofG[2], P.roofG[3], hex('#8a7e76')] : P.roofO;
    for (let y = 2; y < WT + 2; y++) {
      const inset = Math.max(0, 11 - Math.floor(y / 3));
      for (let x = inset; x < W - inset; x++) {
        let c = y % 5 === 0 ? roof[1] : roof[3];
        if ((x + (Math.floor(y / 5) % 2) * 3) % 6 === 0 && y % 5) c = roof[2];
        if (y % 5 === 1) c = roof[4];
        if (x === inset || x === W - inset - 1) c = roof[0];
        b.set(x, y, c);
      }
    }
    b.rect(0, WT, W, 3, roof[0]); b.rect(1, WT, W - 2, 1, roof[2]);
    b.rect(W - 20, 0, 7, 12, P.stone[2]); b.rect(W - 20, 0, 7, 2, P.stone[0]); b.rect(W - 20, 2, 2, 10, P.stone[3]); // chaminé
    return { buf: b, ax: W / 2, ay: WB, foot: [W - 8, 24] };
  },
  stall(v) {
    const b = new PixelBuf(42, 40);
    shade(b, 21, 36, 20, 3);
    b.rect(3, 12, 2, 24, P.wood[1]); b.rect(37, 12, 2, 24, P.wood[1]);
    b.rect(2, 22, 38, 12, P.wood[2]); b.rect(2, 22, 38, 2, P.wood[3]); b.rect(2, 32, 38, 2, P.wood[0]);
    const goods = v === 1 ? [hex('#e8483a'), hex('#f0a020'), hex('#8ac040')] : [hex('#d8c070'), hex('#c87840'), hex('#f0e0b0')];
    for (let i = 0; i < 9; i++) b.disc(6 + i * 4, 20, 2, goods[i % 3]);
    const stripe = v === 1 ? [hex('#c83c3c'), hex('#f2ead8')] : [hex('#3c6cc8'), hex('#f2ead8')];
    for (let y = 2; y < 13; y++) for (let x = 0; x < 42; x++) b.set(x, y, stripe[Math.floor(x / 6) % 2]);
    for (let x = 0; x < 42; x++) { b.set(x, 13, stripe[Math.floor(x / 6) % 2]); if (x % 6 < 3) b.set(x, 14, stripe[Math.floor(x / 6) % 2]); b.set(x, 2, P.wood[0]); }
    return { buf: b, ax: 21, ay: 36, foot: [40, 8] };
  },
  barrel() {
    const b = new PixelBuf(14, 18);
    shade(b, 7, 16, 6, 2);
    b.rect(2, 3, 10, 13, P.wood[2]); b.rect(1, 5, 12, 9, P.wood[2]);
    for (const y of [5, 12]) b.rect(1, y, 12, 1, P.stone[1]);
    b.rect(2, 3, 10, 2, P.wood[3]); b.disc(7, 3, 5, P.wood[1], 1);
    b.rect(3, 6, 1, 6, P.wood[3]);
    return { buf: b, ax: 7, ay: 16, foot: [10, 5] };
  },
  planter() {
    const b = new PixelBuf(22, 14);
    shade(b, 11, 12, 10, 2);
    b.rect(1, 6, 20, 7, P.stone[2]); b.rect(1, 6, 20, 1, P.stone[4]); b.rect(1, 12, 20, 1, P.stone[0]);
    leafBlobs(b, [[6, 5, 3], [11, 4, 3], [16, 5, 3]]);
    for (let i = 0; i < 6; i++) b.set(4 + i * 3, 3 + (i % 2) * 2, P.flowers[i % 5]);
    return { buf: b, ax: 11, ay: 12, foot: [20, 6] };
  },
  fountain() {
    const b = new PixelBuf(52, 40);
    shade(b, 26, 34, 25, 5);
    b.disc(26, 26, 24, P.stone[0], 11); b.disc(26, 25, 23, P.stone[3], 10); b.disc(26, 25, 19, P.stone[1], 8);
    b.disc(26, 26, 18, P.water[2], 7); b.disc(24, 25, 12, P.water[3], 4);
    b.rect(23, 8, 6, 18, P.stone[2]); b.rect(23, 8, 2, 18, P.stone[3]); b.disc(26, 8, 6, P.stone[3], 3); b.disc(26, 7, 4, P.water[3], 2);
    return { buf: b, ax: 26, ay: 34, foot: [44, 18] };
  },
  hay() {
    const b = new PixelBuf(22, 18);
    shade(b, 11, 15, 10, 3);
    b.disc(11, 10, 10, P.hay[0], 6); b.disc(11, 9, 9, P.hay[2], 5); b.disc(9, 7, 5, P.hay[3], 3);
    for (let i = 0; i < 12; i++) b.set(3 + Math.floor(hash(i, 1, 24) * 16), 5 + Math.floor(hash(i, 2, 24) * 9), P.hay[1]);
    return { buf: b, ax: 11, ay: 15, foot: [18, 6] };
  },
  crate() {
    const b = new PixelBuf(16, 16);
    shade(b, 8, 14, 7, 2);
    b.rect(1, 2, 14, 12, P.wood[0]); b.rect(2, 3, 12, 10, P.wood[3]);
    for (let i = 0; i < 10; i++) { b.set(2 + i, 3 + i, P.wood[1]); b.set(13 - i, 3 + i, P.wood[1]); }
    b.rect(2, 3, 12, 1, P.wood[4]);
    return { buf: b, ax: 8, ay: 14, foot: [12, 6] };
  },
  lamp() {
    const b = new PixelBuf(12, 40);
    shade(b, 6, 37, 5, 2);
    b.rect(5, 6, 2, 31, P.metal[3]); b.rect(5, 6, 1, 31, P.metal[4]); b.rect(3, 35, 6, 2, P.metal[2]);
    b.disc(6, 5, 5, [41, 224, 255, 70]); b.disc(6, 5, 3, P.neonC); b.disc(5, 4, 1, [220, 255, 255, 255]);
    return { buf: b, ax: 6, ay: 37, foot: [4, 3] };
  },
  pipe() {
    const b = new PixelBuf(32, 14);
    shade(b, 16, 12, 15, 2);
    b.rect(0, 3, 32, 8, P.metal[3]); b.rect(0, 3, 32, 2, P.metal[4]); b.rect(0, 9, 32, 2, P.metal[1]);
    for (const x of [6, 24]) b.rect(x, 2, 3, 10, P.metal[2]);
    b.rect(14, 5, 4, 3, P.neonM);
    return { buf: b, ax: 16, ay: 12, foot: [32, 6] };
  },
  stairsUp() {
    const b = new PixelBuf(36, 28);
    b.rect(2, 0, 32, 28, P.caveWall[0]);
    for (let i = 0; i < 5; i++) {                     // degraus subindo para a luz
      const y = 22 - i * 5, c = P.stone[Math.min(4, 1 + i)];
      b.rect(4 + i, y, 28 - i * 2, 5, c); b.rect(4 + i, y, 28 - i * 2, 1, P.stone[4]);
      b.rect(4 + i, y + 4, 28 - i * 2, 1, P.stone[0]);
    }
    b.disc(18, 0, 10, [255, 240, 190, 90], 4);
    b.rect(2, 0, 2, 28, P.caveWall[3]); b.rect(32, 0, 2, 28, P.caveWall[3]);
    return { buf: b, ax: 18, ay: 26, foot: null, flat: true };
  },
  stairsDown() {
    const b = new PixelBuf(36, 26);
    b.rect(2, 2, 32, 22, P.stone[1]); b.rect(2, 2, 32, 2, P.stone[3]);
    b.rect(4, 4, 28, 18, [8, 6, 4, 255]);
    for (let i = 0; i < 4; i++) {                     // degraus descendo para o escuro
      const y = 5 + i * 4, c = P.stone[Math.max(0, 3 - i)];
      b.rect(5 + i * 2, y, 26 - i * 4, 2, c); b.rect(5 + i * 2, y + 2, 26 - i * 4, 1, P.stone[0]);
    }
    return { buf: b, ax: 18, ay: 22, foot: null, flat: true };
  },
  bossDoor() {
    const b = new PixelBuf(48, 46);
    shade(b, 24, 42, 22, 4);
    b.disc(24, 22, 22, P.root[0], 21); b.disc(24, 24, 18, [10, 6, 4, 255], 18);
    for (let i = 0; i < 9; i++) {                     // raízes formando o arco
      const a = Math.PI + (i / 8) * Math.PI;
      for (let r = 14; r < 23; r++) {
        const x = 24 + Math.cos(a + Math.sin(r) * 0.08) * r, y = 24 + Math.sin(a) * r;
        b.set(x, y, P.root[r % 3 === 0 ? 2 : 1]); b.set(x + 1, y, P.root[0]);
      }
    }
    b.rect(16, 14, 3, 2, [255, 60, 40, 255]); b.rect(29, 14, 3, 2, [255, 60, 40, 255]); // olhos no escuro
    b.rect(2, 40, 44, 4, P.root[1]);
    return { buf: b, ax: 24, ay: 42, foot: null };
  },
  cave() {
    const b = new PixelBuf(64, 50);
    shade(b, 32, 46, 31, 4);
    for (const [x, y, r, ry] of [[32, 26, 30, 20], [14, 32, 14, 13], [50, 32, 14, 13], [32, 16, 18, 12]]) b.disc(x, y, r + 1, P.outline, ry + 1);
    for (const [x, y, r, ry] of [[32, 26, 30, 20], [14, 32, 14, 13], [50, 32, 14, 13], [32, 16, 18, 12]]) b.disc(x, y, r, P.stone[1], ry);
    for (const [x, y, r, ry] of [[28, 20, 22, 14], [12, 28, 9, 8], [46, 26, 9, 8]]) b.disc(x, y, r, P.stone[2], ry);
    for (const [x, y, r, ry] of [[24, 12, 10, 6], [10, 24, 4, 3], [42, 20, 5, 3]]) b.disc(x, y, r, P.stone[3], ry);
    for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
      const i = (y * b.w + x) * 4; if (b.data[i + 3] !== 255) continue;
      if (hash(x, y, 48) < 0.06) b.set(x, y, P.stone[0]);
    }
    leafBlobs(b, [[18, 8, 5], [44, 10, 4], [32, 5, 4]]);  // mato em cima da rocha
    b.disc(32, 40, 10, P.caveWall[0], 13); b.rect(22, 40, 21, 7, P.caveWall[0]); // boca da caverna
    b.disc(32, 38, 7, [6, 4, 2, 255], 10);
    return { buf: b, ax: 32, ay: 46, foot: null, solids: [[-31, -26, 20, 26], [11, -26, 20, 26], [-20, -40, 40, 20]] };
  },
  mushroom() {
    const b = new PixelBuf(16, 16);
    shade(b, 8, 14, 7, 2);
    for (const [x, y, r, c] of [[5, 9, 3, 0], [11, 7, 4, 1], [8, 11, 2, 0]]) {
      b.rect(x, y, 1, 14 - y, P.plaster[1]);
      b.disc(x, y, r, P.glow[c], Math.max(1, r - 1)); b.set(x - 1, y - 1, P.glow[2]);
    }
    return { buf: b, ax: 8, ay: 14, foot: [8, 3] };
  },
};

const cache = new Map();
export function objectArt(type, variant = 0) {
  const key = `${type}:${variant}`;
  if (!cache.has(key)) {
    const o = OBJECTS[type](variant);
    cache.set(key, { img: o.buf.toCanvas(), ax: o.ax, ay: o.ay, foot: o.foot, solids: o.solids, flat: !!o.flat });
  }
  return cache.get(key);
}

// Brilho animado sobre a água (desenhado a cada quadro, só na tela)
export function drawWaterSparkles(ctx, map, cam, viewW, viewH, time) {
  const tx0 = Math.max(0, Math.floor(cam.x / TILE)), ty0 = Math.max(0, Math.floor(cam.y / TILE));
  const tx1 = Math.min(map.w - 1, Math.ceil((cam.x + viewW) / TILE)), ty1 = Math.min(map.h - 1, Math.ceil((cam.y + viewH) / TILE));
  ctx.fillStyle = '#cfe8ff';
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
    if (map.get(tx, ty) !== 'w') continue;
    for (let i = 0; i < 2; i++) {
      const phase = (time * 0.8 + hash(tx, ty, 30 + i)) % 1;
      if (phase > 0.35) continue;
      const x = tx * TILE + 2 + Math.floor(hash(tx, ty, 40 + i) * 11), y = ty * TILE + 3 + Math.floor(hash(tx, ty, 50 + i) * 10);
      ctx.fillRect(x, y, phase < 0.15 ? 3 : 2, 1);
    }
  }
}

// Portal da fenda cibernética (animado)
export function drawPortal(ctx, x, y, time) {
  ctx.save();
  ctx.translate(x, y - 22);
  for (let i = 0; i < 4; i++) {
    const r = 16 - i * 3, rot = time * (1.5 + i * 0.6) * (i % 2 ? -1 : 1);
    ctx.strokeStyle = i % 2 ? 'rgba(255,58,208,0.85)' : 'rgba(41,224,255,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.75, r, 0, rot, rot + Math.PI * 1.4); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(20,10,40,0.85)';
  ctx.beginPath(); ctx.ellipse(0, 0, 5, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}

// Cristal de save (animado): flutua e brilha
export function drawCrystal(ctx, x, y, time) {
  const bob = Math.round(Math.sin(time * 2.5) * 2);
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(x, y, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
  const g = ctx.createRadialGradient(x, y - 16 + bob, 2, x, y - 16 + bob, 18);
  g.addColorStop(0, 'rgba(140,220,255,0.55)'); g.addColorStop(1, 'rgba(140,220,255,0)');
  ctx.fillStyle = g; ctx.fillRect(x - 18, y - 34 + bob, 36, 36);
  const cy = y - 16 + bob, wob = Math.sin(time * 1.7) * 2;
  ctx.fillStyle = '#2a6ad0';
  ctx.beginPath(); ctx.moveTo(x, cy - 12); ctx.lineTo(x + 7 + wob * 0.3, cy); ctx.lineTo(x, cy + 10); ctx.lineTo(x - 7 - wob * 0.3, cy); ctx.fill();
  ctx.fillStyle = '#7ad0ff';
  ctx.beginPath(); ctx.moveTo(x, cy - 12); ctx.lineTo(x + 7 + wob * 0.3, cy); ctx.lineTo(x, cy); ctx.fill();
  ctx.fillStyle = '#e8f8ff';
  ctx.beginPath(); ctx.moveTo(x, cy - 12); ctx.lineTo(x - 3, cy - 3); ctx.lineTo(x, cy); ctx.fill();
  if (Math.floor(time * 3) % 4 === 0) { ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 3, cy - 6, 1, 1); }
  ctx.restore();
}
