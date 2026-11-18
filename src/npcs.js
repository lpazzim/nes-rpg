// =====================================================================
// NPCs (moradores com quem o grupo conversa)
//   - parados (wander = 0) ou passeando num raio pequeno em volta de casa
//   - ao conversar, param e se viram para o líder; depois voltam ao normal
//   - não lutam: ficam fora de heroes/enemies e as hitboxes os ignoram
// Sprites: folha "npcs", animações "<id>.idle_<dir>" e "<id>.walk_<dir>".
// A folha só tem um quadro de lado/costas: o passo ganha um balanço de 1 px.
// =====================================================================
import { TILE, NPC_TUNING } from './data.js';
import { Animator, drawFrame } from './sprites.js';

export class Npc {
  // def: { id, x, y, dir?, wander? (em blocos) } | rnd: sorteio (troca nos testes)
  constructor(def, rnd = Math.random) {
    this.id = def.id;
    this.isNpc = true;
    this.x = def.x; this.y = def.y;
    this.homeX = def.x; this.homeY = def.y;
    this.r = NPC_TUNING.radius;
    this.wander = (def.wander || 0) * TILE;
    this.rnd = rnd;
    this.faceX = 1;
    this.setDir(def.dir || 'down');
    this.state = 'idle';                 // idle | talk
    this.target = null;                  // destino do passeio
    this.pauseT = this.randomPause();
    this.stuckT = 0; this.walkT = 0; this.moving = false;
    this.sprite = new Animator('npcs');
    this.updateSprite(0);
  }

  setDir(dir) {
    if (dir === 'left' || dir === 'right') { this.faceX = dir === 'left' ? -1 : 1; this.dir = 'side'; }
    else this.dir = dir;
  }
  faceVector(dx, dy) {
    if (Math.abs(dy) > Math.abs(dx)) this.setDir(dy > 0 ? 'down' : 'up');
    else this.setDir(dx < 0 ? 'left' : 'right');
  }
  randomPause() {
    const [a, b] = NPC_TUNING.pause;
    return a + this.rnd() * (b - a);
  }

  update(dt, game) {
    this.moving = false;
    if (this.state === 'idle' && this.wander > 0) {
      if (!this.target) { this.pauseT -= dt; if (this.pauseT <= 0) this.pickTarget(); }
      else this.walk(dt, game);
    }
    this.updateSprite(dt);
  }

  pickTarget() {
    const a = this.rnd() * Math.PI * 2, d = this.rnd() * this.wander;
    this.target = { x: this.homeX + Math.cos(a) * d, y: this.homeY + Math.sin(a) * d };
    this.stuckT = 0;
  }

  walk(dt, game) {
    const dx = this.target.x - this.x, dy = this.target.y - this.y, dist = Math.hypot(dx, dy);
    if (dist < 2) { this.stop(); return; }
    const step = Math.min(dist, NPC_TUNING.speed * dt), nx = (dx / dist) * step, ny = (dy / dist) * step;
    // não começa um passo em cima de um herói
    const blocked = (game.heroes || []).some((h) => h.alive && Math.hypot(h.x - this.x - nx, h.y - this.y - ny) < this.r + h.r + 6);
    if (blocked) { this.stop(); return; }
    const ox = this.x, oy = this.y;
    game.world.move(this, nx, ny);
    this.keepInsideArea();
    if (Math.hypot(this.x - ox, this.y - oy) < step * 0.3) {
      this.stuckT += dt;                  // preso num obstáculo: desiste e escolhe outro destino
      if (this.stuckT > 1) this.stop();
      return;
    }
    this.stuckT = 0; this.moving = true; this.walkT += dt;
    this.faceVector(dx, dy);
  }

  keepInsideArea() {
    const hx = this.x - this.homeX, hy = this.y - this.homeY, hd = Math.hypot(hx, hy);
    if (hd <= this.wander) return;
    this.x = this.homeX + (hx / hd) * this.wander;
    this.y = this.homeY + (hy / hd) * this.wander;
  }

  stop() { this.target = null; this.pauseT = this.randomPause(); }

  // --- conversa -----------------------------------------------------------
  startTalk(leader) {
    this.state = 'talk'; this.target = null; this.moving = false;
    this.faceVector(leader.x - this.x, leader.y - this.y);
    this.updateSprite(0);
  }
  endTalk() { this.state = 'idle'; this.pauseT = this.randomPause(); }

  // --- desenho ------------------------------------------------------------
  updateSprite(dt) {
    this.sprite.play(`${this.id}.${this.moving ? 'walk' : 'idle'}_${this.dir}`);
    this.sprite.update(dt);
  }
  draw(ctx) {
    const bob = this.moving && Math.sin(this.walkT * 14) > 0 ? -1 : 0;
    drawFrame(ctx, this.sprite.frame, this.x, this.y + 4 + bob, { flip: this.faceX < 0 });
  }
}
