// =====================================================================
// INIMIGOS (sprites animados + IA)
//   Espantalho -> golpe de foice; às vezes salta sobre o herói
//   Treant     -> fica disfarçado de toco até você chegar perto;
//                 garra e raízes que saem do chão (área)
//   Cavaleiro  -> bloqueia golpes de frente com o escudo
//   Soldado    -> atira de longe; liga um escudo de energia
//   Treant Ancião (chefe) -> treant gigante com raízes enormes
// =====================================================================
import { ENEMIES } from './data.js';
import { burst, floatText } from './combat.js';
import { Animator, drawFrame, sheets } from './sprites.js';

const TIMERS = ['slowT', 'flashT', 'touchCd', 'wanderT', 'atkCd', 'hurtT', 'blockT', 'stateT'];

export class Enemy {
  constructor(type, x, y, zone) {
    const d = ENEMIES[type];
    this.type = type; this.d = d; this.name = d.name;
    this.isHero = false;
    this.x = x; this.y = y; this.r = d.r;
    this.homeX = x; this.homeY = y; this.zone = zone;
    this.maxHp = d.hp; this.hp = d.hp;
    this.atk = d.atk; this.defense = d.def; this.speed = d.speed; this.crit = 0;
    this.boss = !!d.boss; this.scale = d.scale || 1;
    this.alive = true; this.gone = false; this.deadT = 0;
    this.kbx = 0; this.kby = 0; this.vx = 0; this.vy = 0;
    for (const k of TIMERS) this[k] = 0;
    this.atkCd = 0.5 + Math.random();
    this.t = Math.random() * 5;
    this.faceX = Math.random() < 0.5 ? 1 : -1; this.fx = this.faceX; this.fy = 0;
    this.sprite = new Animator(d.sheet);
    this.state = d.ambush ? 'hidden' : 'idle';
    this.attackKind = 'attack';
    this.wanderA = 0; this.resting = true;
    this.sprite.play(this.state === 'hidden' ? 'hidden' : 'idle');
  }

  get blocking() { return this.state === 'block'; }

  update(dt, game) {
    this.t += dt;
    for (const k of TIMERS) this[k] = Math.max(0, this[k] - dt);
    this.sprite.update(dt * (this.slowT > 0 ? 0.5 : 1));

    if (!this.alive) {                       // animação de morte e depois some
      this.sprite.play('death');
      if (this.sprite.done) { this.deadT += dt; if (this.deadT > 0.8) this.gone = true; }
      this.applyKnockback(dt, game);
      return;
    }

    const target = game.nearestHero(this.x, this.y, this.d.aggro);
    const dx = target ? target.x - this.x : 0, dy = target ? target.y - this.y : 0;
    const dist = Math.hypot(dx, dy) || 1;
    let mx = 0, my = 0;

    switch (this.state) {
      case 'hidden':                          // treant disfarçado de toco
        this.sprite.play('hidden');
        if (target && dist < 56) { this.state = 'emerge'; this.sprite.play('emerge', true); burst(this.x, this.y, '#7a9a3a', 10, 50); }
        break;
      case 'emerge':
        if (this.sprite.done) { this.state = 'chase'; this.atkCd = 0.4; }
        break;
      case 'hurt':
        this.sprite.play('hurt');
        if (this.hurtT <= 0) this.state = 'chase';
        break;
      case 'attack':
        this.sprite.play(this.attackKind);
        if (this.attackKind === 'jump') { mx = this.vx; my = this.vy; }
        if (this.sprite.hitNow()) this.strike(game, target);
        if (this.sprite.done) { this.state = 'chase'; this.atkCd = this.d.atkCd * (0.8 + Math.random() * 0.4); this.vx = this.vy = 0; }
        break;
      case 'block':
        this.sprite.play(this.type === 'cyber' ? 'shield' : 'block');
        if (target) this.face(dx);
        if (this.blockT <= 0) this.state = 'chase';
        break;
      default: {                              // idle / chase
        if (target) {
          this.state = 'chase';
          this.face(dx);
          this.fx = dx / dist; this.fy = dy / dist;
          const d = this.d;
          if (d.ranged) {
            // mantém distância e atira
            if (dist < 60) { mx = -this.fx; my = -this.fy; }
            else if (dist > d.reach * 0.85) { mx = this.fx; my = this.fy; }
            if (dist <= d.reach && this.atkCd <= 0) this.startAttack('attack');
            else if (this.hp < this.maxHp * 0.5 && this.atkCd > 0.6 && Math.random() < 0.004) this.startBlock(1.2);
          } else {
            if (dist > d.reach - 4) { mx = this.fx; my = this.fy; }
            if (dist <= d.reach + target.r && this.atkCd <= 0) {
              const roots = (this.type === 'treant' || this.boss) && Math.random() < (this.boss ? 0.45 : 0.3);
              this.startAttack(roots ? 'roots' : 'attack');
            } else if (this.type === 'scarecrow' && dist > 40 && dist < 80 && this.atkCd <= 0 && Math.random() < 0.02) {
              this.startAttack('jump');
              this.vx = this.fx * 1.6; this.vy = this.fy * 1.6;
            } else if (d.blocks && dist < 50 && target.animT > 0 && Math.random() < 0.08) {
              this.startBlock(0.7);
            }
          }
        } else {
          this.state = 'idle';
          const hx = this.homeX - this.x, hy = this.homeY - this.y, hd = Math.hypot(hx, hy);
          if (hd > 90) { mx = hx / hd; my = hy / hd; this.face(hx); }
          else {
            if (this.wanderT <= 0) {
              this.wanderA = Math.random() * Math.PI * 2;
              this.wanderT = 1.5 + Math.random() * 2.5;
              this.resting = Math.random() < 0.55;
            }
            if (!this.resting) { mx = Math.cos(this.wanderA) * 0.45; my = Math.sin(this.wanderA) * 0.45; this.face(mx); }
          }
        }
        this.sprite.play(Math.hypot(mx, my) > 0.1 ? 'walk' : 'idle');
      }
    }

    const sp = this.speed * (this.slowT > 0 ? 0.45 : 1);
    game.world.move(this, mx * sp * dt, my * sp * dt);
    this.applyKnockback(dt, game);

    // dano por contato (só quando não está disfarçado)
    if (this.touchCd <= 0 && this.state !== 'hidden' && this.state !== 'emerge') {
      for (const h of game.heroes) {
        if (!h.alive) continue;
        if (Math.hypot(h.x - this.x, h.y - this.y) < this.r + h.r) {
          game.damage(h, this, { x: this.x, y: this.y, mult: 0.5, kb: 120 });
          this.touchCd = 1;
          break;
        }
      }
    }
  }

  applyKnockback(dt, game) {
    game.world.move(this, this.kbx * dt, this.kby * dt);
    const decay = Math.min(1, dt * (this.boss ? 14 : 9));
    this.kbx -= this.kbx * decay; this.kby -= this.kby * decay;
  }

  face(dx) { if (Math.abs(dx) > 0.5) this.faceX = Math.sign(dx); }

  startAttack(kind) {
    this.state = 'attack'; this.attackKind = kind;
    this.sprite.play(kind, true);
  }
  startBlock(t) { this.state = 'block'; this.blockT = t; }

  // Momento do impacto do golpe (quadro "hit" da animação)
  strike(game, target) {
    const fx = this.faceX, s = this.scale;
    if (this.d.ranged) {
      // tiro: projétil azul na direção do herói
      const ang = target ? Math.atan2(target.y - this.y, target.x - this.x) : (fx > 0 ? 0 : Math.PI);
      game.addHitbox({
        owner: this, team: 'enemy', x: this.x + fx * 14, y: this.y, vx: Math.cos(ang) * 190, vy: Math.sin(ang) * 190,
        r: 4, life: 1.2, mult: 1, kb: 90, pierce: false, solidStop: true, look: 'bolt', frame: boltFrame(),
      });
      burst(this.x + fx * 18, this.y - 18, '#7fd8ff', 4, 40);
    } else if (this.attackKind === 'roots') {
      const r = this.boss ? 64 : 36;
      game.addHitbox({ owner: this, team: 'enemy', x: this.x, y: this.y, r, life: 0.3, mult: 1.2, kb: 200, look: 'roots' });
      burst(this.x, this.y + 2, '#6b4a2a', this.boss ? 24 : 12, 90);
      game.shake(this.boss ? 5 : 2, 0.25);
    } else {
      const reach = this.d.reach * 0.6;
      game.addHitbox({
        owner: this, team: 'enemy', x: this.x + fx * reach, y: this.y, r: this.d.reach * 0.75,
        life: 0.12, mult: this.attackKind === 'jump' ? 1.3 : 1, kb: 180,
      });
      if (this.attackKind === 'jump') { burst(this.x, this.y + 2, '#c8a165', 10, 70); game.shake(2, 0.15); }
    }
  }

  // Reação a dano: bloqueio de frente e "tranco"
  onDamaged(src, amount) {
    if (this.state === 'hidden' || this.state === 'emerge') { this.state = 'chase'; }
    if (!this.boss && this.state !== 'attack' && this.state !== 'block') {
      this.state = 'hurt'; this.hurtT = 0.25; this.sprite.play('hurt', true);
    }
  }

  // Bloqueio só funciona contra golpes vindos da frente
  blocksFrom(src) {
    if (!this.blocking || !src) return false;
    return Math.sign(src.x - this.x) === this.faceX;
  }

  draw(ctx) {
    const x = Math.round(this.x), y = Math.round(this.y) + 4;
    const a = this.gone ? 0 : this.deadT > 0 ? Math.max(0, 1 - this.deadT / 0.8) : 1;
    drawFrame(ctx, this.sprite.frame, x, y, { flip: this.faceX < 0, white: this.flashT > 0, scale: this.scale, alpha: a });
    if (this.slowT > 0 && this.alive && Math.floor(this.t * 6) % 2) {
      ctx.fillStyle = '#9fdcff';
      ctx.fillRect(x - 6 + Math.round(Math.sin(this.t * 9) * 5), y - 28 * this.scale, 2, 2);
    }
    if (this.alive && this.hp < this.maxHp && !this.boss && this.state !== 'hidden') {
      const w = 18, top = y - 44;
      ctx.fillStyle = '#000'; ctx.fillRect(x - w / 2 - 1, top - 1, w + 2, 4);
      ctx.fillStyle = '#e04b4b'; ctx.fillRect(x - w / 2, top, w * (this.hp / this.maxHp), 2);
    }
  }
}

// Quadro do projétil do soldado (usado pelo desenho das hitboxes)
export function boltFrame() { return sheets.cyber?.anims.bolt.frames[0]; }
