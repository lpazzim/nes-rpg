// =====================================================================
// MUNDO: um mapa carregado (chão, objetos, colisão, saídas)
// Os mapas são definidos em src/maps/ — aqui só se monta e desenha.
// =====================================================================
import { TILE } from './data.js';
import { paintGround, objectArt, drawWaterSparkles, drawPortal, drawCrystal } from './map/art.js';

const CELL = 8;                 // grade de colisão em meios-blocos (8 px)
const SOLID = 1, WATER = 2;     // água bloqueia andar, mas não projéteis
const DYNAMIC = { portal: drawPortal, crystal: drawCrystal };

export class World {
  constructor(id, def) {
    const L = def.build();
    this.id = id; this.name = def.name; this.adventure = def.adventure;
    this.w = L.w; this.h = L.h; this.tiles = L.tiles;
    this.zones = L.zones; this.exits = L.exits; this.entries = L.entries;
    this.npcs = L.npcs || [];       // só dados; o Game cria as entidades Npc ao entrar no mapa
    this.theme = L.theme; this.dark = !!L.dark; this.safe = !!L.safe;
    this.flowerAt = L.flowerAt; this.cropAt = L.cropAt;
    this.pxW = this.w * TILE; this.pxH = this.h * TILE;
    this.get = (x, y) => (x >= 0 && y >= 0 && x < this.w && y < this.h ? this.tiles[y][x] : undefined);

    // objetos com arte pronta
    this.objects = L.objects.map((o) => {
      if (DYNAMIC[o.type]) return { ...o, dynamic: true, foot: o.type === 'crystal' ? [10, 6] : null };
      const art = objectArt(o.type, o.variant || 0);
      return { ...o, art, foot: art.foot, solids: art.solids, flat: art.flat };
    });
    this.interactables = this.objects.filter((o) => o.interact);

    // grade de colisão
    this.cw = this.w * 2; this.ch = this.h * 2;
    this.col = new Uint8Array(this.cw * this.ch);
    for (let ty = 0; ty < this.h; ty++) for (let tx = 0; tx < this.w; tx++) {
      const t = this.tiles[ty][tx];
      const v = t === 'w' ? WATER : (t === 'x' || t === 'k' || t === 'v') ? SOLID : 0;
      if (v) for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) this.col[(ty * 2 + j) * this.cw + tx * 2 + i] = v;
    }
    const stamp = (x0, y0, w, h) => {
      for (let y = Math.floor(y0 / CELL); y <= Math.floor((y0 + h - 1) / CELL); y++)
        for (let x = Math.floor(x0 / CELL); x <= Math.floor((x0 + w - 1) / CELL); x++)
          if (x >= 0 && y >= 0 && x < this.cw && y < this.ch) this.col[y * this.cw + x] = SOLID;
    };
    for (const o of this.objects) {
      if (o.foot) stamp(o.x - o.foot[0] / 2, o.y - o.foot[1], o.foot[0], o.foot[1]);
      if (o.solids) for (const [dx, dy, w, h] of o.solids) stamp(o.x + dx, o.y + dy, w, h);
    }

    this.canvas = paintGround(this);
  }

  // --- Colisão ------------------------------------------------------------
  cellAt(px, py) {
    const x = Math.floor(px / CELL), y = Math.floor(py / CELL);
    if (x < 0 || y < 0 || x >= this.cw || y >= this.ch) return SOLID;
    return this.col[y * this.cw + x];
  }
  // projectile = true: só paredes/objetos bloqueiam (passa por cima da água)
  collides(x, y, r, projectile = false) {
    for (const [cx, cy] of [[x - r, y - r], [x + r, y - r], [x - r, y + r], [x + r, y + r]]) {
      const v = this.cellAt(cx, cy);
      if (v === SOLID || (v === WATER && !projectile)) return true;
    }
    return false;
  }
  move(e, dx, dy) {
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 4));
    const sx = dx / steps, sy = dy / steps;
    for (let i = 0; i < steps; i++) {
      if (!this.collides(e.x + sx, e.y, e.r)) e.x += sx;
      if (!this.collides(e.x, e.y + sy, e.r)) e.y += sy;
    }
  }
  freeSpot(tx, ty, radius) {
    for (let i = 0; i < 60; i++) {
      const x = (tx + 0.5 + (Math.random() * 2 - 1) * radius) * TILE;
      const y = (ty + 0.5 + (Math.random() * 2 - 1) * radius) * TILE;
      if (!this.collides(x, y, 9)) return { x, y };
    }
    return { x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE };
  }
  // saída em que o ponto (px) está, se houver
  exitAt(px, py) {
    const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    return this.exits.find((e) => tx >= e.x0 && tx <= e.x1 && ty >= e.y0 && ty <= e.y1);
  }

  // --- Desenho ------------------------------------------------------------
  drawGround(ctx, cam, viewW, viewH, time, flags) {
    ctx.drawImage(this.canvas, cam.x, cam.y, viewW, viewH, cam.x, cam.y, viewW, viewH);
    drawWaterSparkles(ctx, this, cam, viewW, viewH, time);
    for (const o of this.objects) if (o.flat && this.visible(o, cam, viewW, viewH) && this.shown(o, flags)) this.drawObject(ctx, o, time);
  }
  shown(o, flags) { return !o.requires || flags[o.requires]; }
  visible(o, cam, viewW, viewH) {
    const w = o.art ? o.art.img.width : 40, h = o.art ? o.art.img.height : 50;
    return !(o.x + w < cam.x || o.x - w > cam.x + viewW || o.y - h > cam.y + viewH || o.y + 16 < cam.y);
  }
  // objetos visíveis em pé, para a ordenação por profundidade
  visibleObjects(cam, viewW, viewH, flags) {
    return this.objects.filter((o) => !o.flat && this.visible(o, cam, viewW, viewH) && this.shown(o, flags));
  }
  drawObject(ctx, o, time) {
    if (o.dynamic) { DYNAMIC[o.type](ctx, o.x, o.y, time); return; }
    ctx.drawImage(o.art.img, Math.round(o.x - o.art.ax), Math.round(o.y - o.art.ay));
  }
}
