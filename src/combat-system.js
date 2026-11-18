// =====================================================================
// SISTEMA DE COMBATE (dano, mortes, XP, hitboxes, zonas, itens no chão)
// Funções que recebem a instância `game` por parâmetro (nunca importam
// game.js). O Game expõe métodos finos (damage, explode, dropPickup) que
// chamam estas funções, porque heróis e inimigos usam esses nomes.
// =====================================================================
import { TILE, RESPAWN_TIME, xpToNext } from './data.js';
import { Enemy } from './enemies.js';
import { calcDamage, floatText, burst, dot } from './combat.js';
import { latestSave } from './save.js';
import { MAX_STACK, findItem } from './items.js';
import { BOSS_DROP, prizeFlag, pendingBossPrizes } from './equipment.js';

// ---------------------------------------------------------------- dano
export function applyDamage(game, target, src, h) {
  if (!target.alive) return;
  if (target.isHero && (target.invT > 0 || target.dashT > 0)) return;
  const critChance = h.crit ?? src?.crit ?? 0;
  let { amount, crit } = calcDamage(src?.atk ?? 5, target.defense, h.mult ?? 1, critChance);
  if (!target.isHero && target.blocksFrom?.(src)) {
    amount = Math.max(1, Math.round(amount * 0.15)); crit = false;
    floatText(target.x, target.y - 46, 'BLOQUEIO', '#cfe8ff', 7);
    burst(target.x + target.faceX * 10, target.y - 16, '#ffe08a', 6, 60);
  }
  // equipamento do heroi desconta parte do dano (minimo de 1 preservado)
  if (target.isHero && target.damageReduction > 0) {
    amount = Math.max(1, Math.round(amount * (1 - target.damageReduction)));
  }
  target.hp -= amount;
  target.flashT = 0.12;
  let kx = target.x - h.x, ky = target.y - h.y;
  if (h.vx || h.vy) { kx = h.vx; ky = h.vy; }
  const d = Math.hypot(kx, ky) || 1, res = target.boss ? 0.25 : 1;
  target.kbx += (kx / d) * (h.kb ?? 90) * res;
  target.kby += (ky / d) * (h.kb ?? 90) * res;
  floatText(target.x, target.y - (target.isHero ? 40 : 22), crit ? `${amount}!` : `${amount}`,
    target.isHero ? '#ff7b7b' : crit ? '#ffd84a' : '#ffffff', crit ? 10 : 8);
  burst(target.x, target.y, target.isHero ? '#ff6b6b' : '#ffffff', 4, 50);
  if (target.isHero) { target.invT = 0.7; target.hurtT = 0.25; }
  else {
    target.onDamaged?.(src, amount);
    if (src?.isHero) src.power = Math.min(100, src.power + src.powerGain);
  }
  if (target.hp <= 0) target.isHero ? heroDown(game, target) : enemyDown(game, target);
}

function heroDown(game, h) {
  h.alive = false; h.hp = 0;
  floatText(h.x, h.y - 30, 'K.O.', '#ff6b6b', 10);
  if (!game.heroes.some((x) => x.alive)) { game.mode = 'over'; game.overSel = latestSave() ? 0 : 1; return; }
  if (h === game.leader) game.switchLeader();
}

function enemyDown(game, e) {
  e.alive = false;
  e.zone.alive--;
  burst(e.x, e.y - 10, '#ffffff', 10, 70);
  gainXp(game.heroes, e.d.xp);
  game.gold += e.d.gold || 0;
  floatText(e.x + 10, e.y - 30, `+${e.d.gold || 0} G`, '#ffd84a', 7);
  if (e.zone.boss) {
    game.flags[e.zone.boss] = true;
    game.announce(`${e.name} derrotado!`, 2.5);
    game.later(2.6, () => game.announce('Um portal se abriu...', 2.5));
    game.dropPickup(e.x, e.y, 'heal');
    // recompensa do chefe: a peca fica no chao, ao lado da cura
    const prize = BOSS_DROP[e.zone.boss];
    if (prize) game.dropPickup(e.x + 16, e.y, 'equip', prize);
  } else if (Math.random() < 0.12) game.dropPickup(e.x, e.y, 'heal');
  else if (Math.random() < 0.08) game.dropPickup(e.x, e.y, 'potion');
}

// XP para os heróis vivos; sobe de nível quantas vezes couber
export function gainXp(heroes, n) {
  for (const h of heroes) {
    if (!h.alive) continue;
    h.xp += n;
    while (h.xp >= xpToNext(h.level)) {
      h.xp -= xpToNext(h.level);
      h.level++;
      h.maxHp = Math.round(h.maxHp * 1.1); h.hp = h.maxHp;
      h.baseAtk += 2; h.baseDefense += 1;
      if (h.baseMaxMp > 0) { h.baseMaxMp += 4; h.mp = h.maxMp; }
      floatText(h.x, h.y - 50, 'LEVEL UP!', '#7fffd4', 9);
    }
  }
}

export function explode(game, x, y, owner) {
  game.addHitbox({ owner, x, y, r: 30, life: 0.18, mult: 1.3, kb: 200, look: 'explosion' });
  burst(x, y, '#ff6a3a', 10, 90); burst(x, y, '#ffd27a', 6, 60);
  game.shake(2, 0.12);
}

// ------------------------------------------------------- itens no chão
// 'heal' cura o grupo; 'potion' vai para a bolsa
export function updatePickups(game, dt) {
  const L = game.leader;
  for (const p of game.pickups) {
    p.t += dt;
    if (!L || Math.hypot(L.x - p.x, L.y - p.y) >= 12) continue;
    p.taken = true;
    if (p.kind === 'equip') {
      // recompensa de chefe: vai para a bolsa e nunca mais reaparece
      game.inventory[p.id] = (game.inventory[p.id] || 0) + 1;
      const boss = Object.keys(BOSS_DROP).find((k) => BOSS_DROP[k] === p.id);
      if (boss) game.flags[prizeFlag(boss)] = true;
      floatText(p.x, p.y - 30, `+${findItem(p.id)?.name ?? 'Equipamento'}`, '#9fe4ff', 8);
    } else if (p.kind === 'potion') {
      // bolsa cheia: o item some sem entrar (limite da loja também vale no chão)
      if ((game.inventory.potion || 0) < MAX_STACK) {
        game.inventory.potion = (game.inventory.potion || 0) + 1;
        floatText(p.x, p.y - 30, '+1 Pocao', '#ffd84a', 8);
      }
    } else {
      for (const h of game.heroes) {
        if (!h.alive) { h.alive = true; h.hp = Math.round(h.maxHp * 0.3); h.placeAt(L.x, L.y, 'down'); }
        else h.hp = Math.min(h.maxHp, h.hp + Math.round(h.maxHp * 0.35));
        floatText(h.x, h.y - 44, '+HP', '#7dff8a', 8);
      }
    }
    burst(p.x, p.y, p.kind === 'equip' ? '#9fe4ff' : '#7dff8a', 10, 70);
  }
  // curas e pocoes somem em 30 s; a peca do chefe fica ate ser pega
  game.pickups = game.pickups.filter((p) => !p.taken && (p.kind === 'equip' || p.t < 30));
}

export function drawPickups(ctx, pickups) {
  for (const p of pickups) {
    const y = p.y - 6 + Math.sin(p.t * 4) * 2;
    if (p.kind !== 'equip' && p.t > 25 && Math.floor(p.t * 8) % 2) continue;
    ctx.fillStyle = p.kind === 'equip' ? '#9fe4ff' : p.kind === 'potion' ? '#ff6ab0' : '#7dff8a';
    ctx.beginPath(); ctx.moveTo(p.x, y - 5); ctx.lineTo(p.x + 4, y); ctx.lineTo(p.x, y + 5); ctx.lineTo(p.x - 4, y); ctx.fill();
    ctx.fillStyle = '#ffffff'; dot(ctx, p.x - 1, y - 1, 1);
  }
}

// -------------------------------------------------------------- inimigos
export function spawnZone(game, z) {
  for (let i = 0; i < z.count; i++) {
    const p = game.world.freeSpot(z.x, z.y, z.radius ?? 3);
    game.enemies.push(new Enemy(z.type, p.x, p.y, z));
  }
  z.alive = z.count; z.timer = 0;
}

// ao entrar num mapa: recoloca no chao a recompensa de chefe que ainda nao foi pega
export function restoreBossPrizes(game) {
  for (const p of pendingBossPrizes(game.flags, game.world.zones)) {
    const spot = game.world.freeSpot(p.x, p.y, 1);
    game.dropPickup(spot.x, spot.y, 'equip', p.id);
  }
}

export function updateZones(game, dt) {
  const L = game.leader;
  for (const z of game.zones) {
    if (z.alive > 0 || (z.boss && game.flags[z.boss])) continue;
    z.timer += dt;
    const far = !L || Math.hypot((z.x + 0.5) * TILE - L.x, (z.y + 0.5) * TILE - L.y) > 200;
    if (z.timer >= (z.respawn ?? RESPAWN_TIME) && far) spawnZone(game, z);
  }
}

export function updateHitboxes(game, dt) {
  for (const h of game.hitboxes) {
    h.age += dt; h.life -= dt;
    if (h.follow && h.owner) { h.x = h.owner.x + h.ox; h.y = h.owner.y + h.oy; }
    else { h.x += h.vx * dt; h.y += h.vy * dt; }
    if (h.solidStop && game.world.collides(h.x, h.y, 2, true)) h.life = 0;
    if (h.life > 0) {
      const targets = h.team === 'hero' ? game.enemies : game.heroes;
      for (const t of targets) {
        if (!t.alive) continue;
        const last = h.hitTimes.get(t);
        if (last !== undefined && (h.rehit <= 0 || h.age - last < h.rehit)) continue;
        if (Math.hypot(t.x - h.x, t.y - h.y) < h.r + t.r) {
          h.hitTimes.set(t, h.age);
          game.damage(t, h.owner, h);
          h.onHit?.(t, game);
          if (!h.pierce) { h.life = 0; break; }
        }
      }
    }
    if (h.life <= 0 && !h.dead) { h.dead = true; h.onEnd?.(game, h); }
  }
  game.hitboxes = game.hitboxes.filter((h) => !h.dead);
}
