// =====================================================================
// HERÓIS: movimento, IA dos aliados e os 3 estilos de combate
//   katana  -> golpes largos e fortes, mais lento
//   daggers -> combo rápido de 3 golpes, muitos críticos
//   mage    -> ataque à distância: orbe AZUL (rápido, deixa lento)
//              e orbe VERMELHO (gasta MP, explode em área)
// =====================================================================
import { MAGE } from './data.js';
import { burst, floatText, dot } from './combat.js';
import { Animator, drawFrame } from './sprites.js';
import { STARTER, equipBonus, statValue } from './equipment.js';

const TIMERS = ['atkCd', 'skillCd', 'dashCd', 'dashT', 'invT', 'flashT', 'animT', 'comboT', 'actionT', 'hurtT'];

export class Hero {
  constructor(data, x, y) {
    this.data = data;
    this.type = data.type;
    this.name = data.name;
    this.isHero = true;
    this.x = x; this.y = y; this.r = 5;
    this.fx = 0; this.fy = 1;                 // direção para onde olha
    this.level = 1; this.xp = 0;
    this.maxHp = data.maxHp; this.hp = data.maxHp;
    // atributos PROPRIOS do heroi (base + ganhos de nivel). O que o jogo le
    // (this.atk, this.speed...) e isto somado ao equipamento, nos getters abaixo.
    this.baseMaxMp = data.maxMp;
    this.baseAtk = data.atk; this.baseDefense = data.def;
    this.baseSpeed = data.speed; this.baseCrit = data.crit;
    this.equipped = { weapon: STARTER[data.id] ?? null, armor: null, accessory: null };
    this.recalcEquip();
    this.mp = this.maxMp;
    this.power = 0;                           // barra de PODER (0..100)
    this.alive = true;
    this.kbx = 0; this.kby = 0;
    this.dashVx = 0; this.dashVy = 0;
    for (const k of TIMERS) this[k] = 0;
    this.anim = null; this.animDur = 1;      // efeito do golpe em andamento (hitbox/visual)
    this.sprite = new Animator(data.id);     // animações da folha do herói
    this.action = null;                      // animação de ação (attack, skill, special...)
    this.dir = 'down';                       // down | up | side
    this.faceX = 1;                          // 1 = direita, -1 = esquerda (espelha o sprite)
    this.trail = [];                         // rastro da esquiva
    this.stepT = 0;
    this.combo = 0; this.walkT = 0; this.moving = false; this.t = 0;
    this.updateSprite(0);                    // escolhe a animação já na criação (carregar save desenha antes do fade colocá-lo)
  }

  update(dt, game) {
    this.t += dt;
    for (const k of TIMERS) this[k] = Math.max(0, this[k] - dt);
    this.updateSprite(dt);
    if (!this.alive) return;
    if (this.maxMp > 0) this.mp = Math.min(this.maxMp, this.mp + MAGE.mpRegen * dt);
    if (this.comboT <= 0) this.combo = 0;

    let mx, my;
    if (this.dashT > 0) {
      mx = this.dashVx; my = this.dashVy;
    } else {
      const intent = game.leader === this ? this.playerIntent(game) : this.aiIntent(game);
      mx = intent.mx * this.speed; my = intent.my * this.speed;
    }
    this.moving = Math.hypot(mx, my) > 1;
    if (this.moving) {
      this.walkT += dt;
      this.stepT += dt;
      if (this.stepT > 0.3 && this.dashT <= 0) { this.stepT = 0; burst(this.x - this.faceX * 4, this.y + 4, '#cdbb8f', 2, 18); }
    }
    if (Math.abs(this.fx) > 0.15) this.faceX = Math.sign(this.fx);
    this.dir = Math.abs(this.fy) > Math.abs(this.fx) * 1.2 ? (this.fy > 0 ? 'down' : 'up') : 'side';
    for (const g of this.trail) g.t -= dt;
    this.trail = this.trail.filter((g) => g.t > 0);
    if (this.dashT > 0) this.trail.push({ x: this.x, y: this.y, frame: this.sprite.frame, flip: this.faceX < 0, t: 0.18 });
    game.world.move(this, (mx + this.kbx) * dt, (my + this.kby) * dt);
    const decay = Math.min(1, dt * 10);
    this.kbx -= this.kbx * decay; this.kby -= this.kby * decay;
  }

  moveMul() {
    if (this.animT <= 0 || this.anim === 'spin') return 1;
    return this.anim === 'heavy' ? 0.3 : 0.65;
  }

  // anim = efeito/tempo do golpe; action = animação do sprite (attack, skill...)
  play(anim, dur, action) {
    this.anim = anim; this.animT = dur; this.animDur = dur;
    if (action && this.sprite.has(action)) {
      const a = this.sprite.sheet.anims[action];
      this.action = action;
      this.actionT = a.loop ? dur : Math.max(dur, a.duration);
      this.sprite.play(action, true);
    }
  }

  // Escolhe a animação do momento: morte > ação > dano > andar/parado
  updateSprite(dt) {
    const s = this.sprite;
    if (!this.alive) s.play('death');
    else if (this.actionT > 0 && this.action) s.play(this.action);
    else if (this.hurtT > 0) s.play('hurt');
    else {
      const base = this.moving || this.dashT > 0 ? 'walk' : 'idle';
      s.play(`${base}_${this.dir}`);
    }
    // andar mais rápido = passos mais rápidos (esquiva acelera a animação)
    s.update(dt * (this.dashT > 0 ? 2 : 1));
  }

  // --- Equipamento ---------------------------------------------------------
  // O bonus e sempre recalculado a partir das pecas (nunca somado ao base),
  // entao equipar e tirar varias vezes nao "vaza" atributo. Chamado ao criar
  // o heroi, ao trocar de peca e ao carregar o save.
  recalcEquip() {
    this.bonus = equipBonus(this.equipped);
    if (this.mp > this.maxMp) this.mp = this.maxMp;   // tirou uma peca de MP
  }

  // atributos efetivos (proprios + equipamento), usados por todo o jogo
  get atk() { return statValue(this.baseAtk, this.bonus.atk, 'atk'); }
  get defense() { return statValue(this.baseDefense, this.bonus.defense, 'defense'); }
  get speed() { return statValue(this.baseSpeed, this.bonus.speed, 'speed'); }
  get crit() { return statValue(this.baseCrit, this.bonus.crit, 'crit'); }
  get maxMp() { return statValue(this.baseMaxMp, this.baseMaxMp > 0 ? this.bonus.maxMp : 0, 'maxMp'); }
  get powerGain() { return this.data.powerGain * (1 + this.bonus.power); }
  get damageReduction() { return this.bonus.dr; }

  lunge(force) { this.kbx += this.fx * force; this.kby += this.fy * force; }

  // --- Save ---------------------------------------------------------------
  // Salvamos os atributos PROPRIOS (base*), nunca os efetivos: o bonus do
  // equipamento e recalculado ao carregar, a partir das pecas.
  static SAVED = ['level', 'xp', 'hp', 'mp', 'maxHp', 'baseMaxMp', 'baseAtk', 'baseDefense',
    'baseSpeed', 'baseCrit', 'power', 'alive'];
  toSave() {
    const o = { id: this.data.id, name: this.name, equip: { ...this.equipped } };
    for (const k of Hero.SAVED) o[k] = this.alive || k !== 'hp' ? this[k] : 0;
    return o;
  }
  loadSave(o) {
    for (const k of Hero.SAVED) if (o[k] !== undefined) this[k] = o[k];
    if (o.equip) this.equipped = { weapon: null, armor: null, accessory: null, ...o.equip };
    this.recalcEquip();
  }

  // coloca o herói num ponto, parado e olhando para uma direção
  placeAt(x, y, dir) {
    this.x = x; this.y = y; this.kbx = this.kby = 0; this.dashT = 0; this.trail = [];
    const v = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[dir] || [0, 1];
    this.fx = v[0]; this.fy = v[1];
    if (v[0]) this.faceX = v[0];
    this.dir = v[1] ? (v[1] > 0 ? 'down' : 'up') : 'side';
    this.moving = false;
    this.updateSprite(0);   // já escolhe a animação (o fade desenha antes do primeiro update)
  }

  // --- Controle do jogador ---------------------------------------------
  playerIntent(game) {
    const i = game.input;
    let x = 0, y = 0;
    if (i.isDown('KeyA', 'ArrowLeft')) x -= 1;
    if (i.isDown('KeyD', 'ArrowRight')) x += 1;
    if (i.isDown('KeyW', 'ArrowUp')) y -= 1;
    if (i.isDown('KeyS', 'ArrowDown')) y += 1;
    const len = Math.hypot(x, y);
    if (len > 0) { x /= len; y /= len; this.fx = x; this.fy = y; }

    if (i.isDown('KeyJ', 'KeyZ')) this.attack(game);
    if (i.wasPressed('KeyK', 'KeyX')) this.skill(game);
    if (i.wasPressed('KeyL', 'KeyC')) this.special(game);
    if (i.wasPressed('Space', 'ShiftLeft', 'ShiftRight')) this.dash();

    const m = this.moveMul();
    return { mx: x * m, my: y * m };
  }

  // --- IA dos aliados ----------------------------------------------------
  aiIntent(game) {
    const L = game.leader;
    if (!L) return { mx: 0, my: 0 };
    const dl = Math.hypot(L.x - this.x, L.y - this.y);

    // Ficou muito para trás (preso numa árvore)? Teleporta para perto do líder.
    if (dl > 220) {
      this.x = L.x; this.y = L.y; this.kbx = this.kby = 0;
      return { mx: 0, my: 0 };
    }

    const range = this.type === 'mage' ? 80 : this.type === 'daggers' ? 18 : 22;
    const target = dl < 120 ? game.nearestEnemy(this.x, this.y, 130) : null;
    if (target) {
      const dx = target.x - this.x, dy = target.y - this.y, d = Math.hypot(dx, dy) || 1;
      this.fx = dx / d; this.fy = dy / d;
      if (d <= range + target.r + 2) {
        if (this.type === 'mage' && this.mp >= MAGE.redCost + 10 && this.skillCd <= 0 && Math.random() < 0.02) {
          this.skill(game);
        } else {
          this.attack(game);
        }
        if (this.type === 'mage' && d < 40) return { mx: -this.fx * 0.7, my: -this.fy * 0.7 };
        return { mx: 0, my: 0 };
      }
      const m = 0.9 * this.moveMul();
      return { mx: this.fx * m, my: this.fy * m };
    }

    // Sem inimigos: segue o líder em formação
    const slot = game.followerSlot(this);
    const back = Math.atan2(-L.fy, -L.fx) + (slot === 0 ? -0.6 : 0.6);
    const tx = L.x + Math.cos(back) * 26, ty = L.y + Math.sin(back) * 26;
    const dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy);
    if (d < 4) return { mx: 0, my: 0 };
    const sp = d > 60 ? 1.15 : Math.min(1, d / 20);
    this.fx = dx / d; this.fy = dy / d;
    return { mx: this.fx * sp, my: this.fy * sp };
  }

  // --- J: ataque básico ----------------------------------------------------
  attack(game) {
    if (this.atkCd > 0 || this.dashT > 0) return false;
    const { fx, fy } = this;
    if (this.type === 'katana') {
      this.atkCd = 0.38; this.combo = (this.combo + 1) % 2; this.comboT = 0.6;
      this.play('slash', 0.16, 'attack'); this.lunge(45);
      game.addHitbox({ owner: this, follow: true, ox: fx * 16, oy: fy * 16, r: 15, life: 0.12, mult: 1, kb: 130 });
    } else if (this.type === 'daggers') {
      const third = this.combo === 2;      // 3º golpe do combo é mais forte
      this.atkCd = third ? 0.32 : 0.15;
      this.play(third ? 'stab3' : 'stab', 0.1, third ? 'attack3' : 'attack'); this.lunge(third ? 60 : 30);
      game.addHitbox({
        owner: this, follow: true, ox: fx * (third ? 15 : 13), oy: fy * (third ? 15 : 13),
        r: third ? 13 : 11, life: 0.09, mult: third ? 1.5 : 0.75, kb: third ? 150 : 50,
      });
      this.combo = (this.combo + 1) % 3; this.comboT = 0.5;
    } else {
      this.atkCd = 0.3; this.play('cast', 0.12, 'attack');
      game.addHitbox({
        owner: this, x: this.x + fx * 12, y: this.y + fy * 8, vx: fx * 210, vy: fy * 210,
        r: 5, life: 0.8, mult: 0.85, kb: 60, pierce: false, solidStop: true, look: 'orbBlue',
        onHit: (t) => { t.slowT = 1.8; },
      });
    }
    return true;
  }

  // --- K: habilidade -------------------------------------------------------
  skill(game) {
    if (this.skillCd > 0 || this.dashT > 0) return false;
    const { fx, fy } = this;
    if (this.type === 'katana') {
      // Corte Pesado: lento, grande e empurra longe
      this.skillCd = 1.4; this.atkCd = 0.4; this.play('heavy', 0.25, 'skill'); this.lunge(70);
      game.addHitbox({ owner: this, follow: true, ox: fx * 18, oy: fy * 18, r: 21, life: 0.2, mult: 2, kb: 240 });
    } else if (this.type === 'daggers') {
      // Arremesso: 3 adagas em leque
      this.skillCd = 0.9; this.play('throw', 0.12, 'skill');
      const base = Math.atan2(fy, fx);
      for (const a of [-0.22, 0, 0.22]) {
        game.addHitbox({
          owner: this, x: this.x, y: this.y, vx: Math.cos(base + a) * 270, vy: Math.sin(base + a) * 270,
          r: 3, life: 0.45, mult: 0.7, kb: 40, pierce: false, solidStop: true, look: 'dagger',
        });
      }
    } else {
      // Orbe Vermelho: gasta MP e explode
      if (this.mp < MAGE.redCost) {
        floatText(this.x, this.y - 44, 'Sem MP', '#9ecbff');
        this.skillCd = 0.3;
        return false;
      }
      this.mp -= MAGE.redCost; this.skillCd = 0.7; this.play('cast', 0.15, 'skill');
      game.addHitbox({
        owner: this, x: this.x + fx * 12, y: this.y + fy * 8, vx: fx * 150, vy: fy * 150,
        r: 5, life: 0.9, mult: 1.2, kb: 80, pierce: false, solidStop: true, look: 'orbRed',
        onEnd: (g, h) => g.explode(h.x, h.y, this),
      });
    }
    return true;
  }

  // --- L: especial (barra de PODER cheia) ---------------------------------
  special(game) {
    if (this.power < 100 || this.dashT > 0) return false;
    this.power = 0;
    game.announce(`${this.name}: ${this.data.special}!`);
    const { fx, fy } = this;
    if (this.type === 'katana') {
      // Iaido: avança cortando tudo no caminho
      this.dashT = 0.28; this.dashVx = fx * 330; this.dashVy = fy * 330; this.invT = 0.4;
      this.play('iaido', 0.28, 'special');
      game.addHitbox({ owner: this, follow: true, r: 14, life: 0.3, mult: 2.6, kb: 260 });
    } else if (this.type === 'daggers') {
      // Tempestade de Lâminas: redemoinho que acerta várias vezes
      this.play('spin', 1.2, 'special');
      game.addHitbox({ owner: this, follow: true, r: 36, life: 1.2, rehit: 0.15, mult: 0.6, kb: 60, look: 'spin' });
    } else {
      // Espiral Dupla: 16 orbes azuis e vermelhos em todas as direções
      this.play('cast', 0.3, 'special');
      this.invT = 0.5;
      game.later(0.42, () => { if (this.alive) this.releaseSpiral(game); });
    }
    return true;
  }

  releaseSpiral(game) {
    {
      game.shake(3, 0.2);
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2, blue = i % 2 === 0;
        game.addHitbox({
          owner: this, x: this.x, y: this.y, vx: Math.cos(a) * 170, vy: Math.sin(a) * 170,
          r: 5, life: 1, mult: 1.4, kb: 90, pierce: false, solidStop: true,
          look: blue ? 'orbBlue' : 'orbRed', onHit: blue ? (t) => { t.slowT = 2.5; } : null,
        });
      }
    }
    return true;
  }

  // --- Espaço: esquiva (invencível durante o avanço) -----------------------
  dash() {
    if (this.dashCd > 0 || this.dashT > 0) return;
    this.dashCd = 0.55; this.dashT = 0.16;
    this.dashVx = this.fx * 250; this.dashVy = this.fy * 250;
    burst(this.x, this.y + 6, '#d8c9a0', 5, 40);
  }

  // --- Desenho -------------------------------------------------------------
  draw(ctx, isLeader) {
    const x = Math.round(this.x), y = Math.round(this.y) + 4;   // y = linha dos pés
    const flip = this.faceX < 0;

    for (const g of this.trail) {                 // rastro da esquiva
      drawFrame(ctx, g.frame, g.x, g.y + 4, { flip: g.flip, alpha: 0.35 * (g.t / 0.18) });
    }
    const blink = this.alive && this.invT > 0 && this.hurtT <= 0 && Math.floor(this.invT * 20) % 2;
    drawFrame(ctx, this.sprite.frame, x, y, { flip, white: this.flashT > 0, alpha: blink ? 0.45 : 1 });
    this.drawAttack(ctx, x, y);

    if (isLeader && this.alive) {               // seta indicando o personagem controlado
      const top = y - 46;
      ctx.fillStyle = '#ffd84a';
      ctx.beginPath(); ctx.moveTo(x - 3, top - 4); ctx.lineTo(x + 3, top - 4); ctx.lineTo(x, top); ctx.fill();
    }
  }

  // Efeitos extras por cima do sprite
  drawAttack(ctx, x, y) {
    if (this.animT <= 0) return;
    const p = 1 - this.animT / this.animDur;
    if (this.anim === 'iaido') {
      ctx.strokeStyle = `rgba(200,235,255,${0.8 * (1 - p)})`; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - this.fx * 48, y - 16 - this.fy * 48); ctx.lineTo(x, y - 16); ctx.stroke();
    }
  }
}
