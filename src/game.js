// =====================================================================
// JOGO: estado da campanha, troca de mapas, combate e telas
//   modos: title | play | menu | shop | save | dialog | over
// =====================================================================
import { TILE, VIEW_W, VIEW_H, HEROES } from './data.js';
import { Input } from './input.js';
import { World } from './world.js';
import { Hero } from './heroes.js';
import { Hitbox, fx, floatText, updateFx, drawFx, drawHitbox } from './combat.js';
import { applyDamage, explode, updateHitboxes, spawnZone, updateZones, updatePickups, drawPickups, restoreBossPrizes } from './combat-system.js';
import { nearInteractable, interact, separateFromNpcs } from './interaction.js';
import { drawHud } from './hud.js';
import { MAPS, NEW_GAME } from './maps/index.js';
import { ITEMS, SHOPS, START_INVENTORY, START_GOLD } from './items.js';
import { readSave, writeSave, latestSave } from './save.js';
import { TitleScreen } from './ui/title.js';
import { Menu } from './ui/menu.js';
import { ShopScreen } from './ui/shop.js';
import { win, text, cursor, navY, confirm } from './ui/ui.js';
import { Npc } from './npcs.js';

const FADE = 0.3;

export class Game {
  constructor(canvas) {
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.input = new Input();
    this.worlds = new Map();              // mapas já montados (pintados uma vez)
    this.showHelp = true;
    this.time = 0;
    this.toTitle();
  }

  // ======================================================== campanha / save
  getWorld(id) {
    if (!this.worlds.has(id)) this.worlds.set(id, new World(id, MAPS[id]));
    return this.worlds.get(id);
  }

  toTitle() {
    this.mode = 'title'; this.title = new TitleScreen(this);
    this.fade = null; this.paused = false;
  }

  newGame() {
    this.flags = {}; this.gold = START_GOLD; this.inventory = { ...START_INVENTORY }; this.playTime = 0;
    this.heroes = HEROES.map((d) => new Hero(d, 0, 0));
    this.leaderIdx = 0;
    this.startFade(NEW_GAME.map, NEW_GAME.entry, true);
    this.showHelp = true;
  }

  loadGame(slot) {
    const d = readSave(slot);
    if (!d) return false;
    this.flags = { ...d.flags }; this.gold = d.gold; this.inventory = { ...d.inventory }; this.playTime = d.playTime || 0;
    this.heroes = HEROES.map((def) => {
      const h = new Hero(def, 0, 0);
      const s = d.heroes.find((x) => x.id === def.id);
      if (s) h.loadSave(s);
      return h;
    });
    this.leaderIdx = Math.max(0, this.heroes.findIndex((h) => h.alive));
    this.startFade(d.map, d.entry, true);
    return true;
  }

  saveGame(slot) {
    return writeSave(slot, {
      map: this.world.id, entry: this.saveEntry || 'inicio',
      flags: this.flags, gold: this.gold, inventory: this.inventory, playTime: this.playTime,
      heroes: this.heroes.map((h) => h.toSave()),
    });
  }

  useItem(id, hero) {
    if (!this.inventory[id]) return false;
    const wasAlive = hero.alive;
    const res = ITEMS[id].use(hero);
    if (!res) return false;
    if (!wasAlive && hero.alive && this.leader) hero.placeAt(this.leader.x, this.leader.y, 'down');
    if (--this.inventory[id] <= 0) delete this.inventory[id];
    return res;
  }

  // ============================================================ troca de mapa
  startFade(map, entry, fromTitle = false) {
    this.startTransition({
      onMid: () => {
        this.enterMap(map, entry);
        if (fromTitle) { this.mode = 'play'; this.title = null; }
      },
    });
  }

  // escurece (dur s), roda onMid com a tela preta, clareia (dur s) e roda onEnd.
  // Durante o fade o mundo fica congelado.
  startTransition({ dur = FADE, onMid, onEnd } = {}) {
    this.fade = { phase: 'out', t: 0, dur, onMid, onEnd };
  }

  enterMap(id, entryName) {
    const W = this.world = this.getWorld(id);
    const e = W.entries[entryName] || Object.values(W.entries)[0];
    const lx = (e.x + 0.5) * TILE, ly = (e.y + 0.5) * TILE;
    const back = { down: [0, -1], up: [0, 1], left: [1, 0], right: [-1, 0] }[e.dir] || [0, -1];
    const side = [back[1], back[0]];
    if (!this.leader.alive) this.switchLeader();
    let k = 0;
    for (const h of this.heroes) {
      if (h === this.leader) { h.placeAt(lx, ly, e.dir); continue; }
      const s = k++ === 0 ? -1 : 1;
      let x = lx + back[0] * 18 + side[0] * 12 * s, y = ly + back[1] * 18 + side[1] * 12 * s;
      if (W.collides(x, y, h.r)) { x = lx; y = ly; }
      h.placeAt(x, y, e.dir);
    }
    this.enemies = []; this.hitboxes = []; this.pickups = []; this.timers = [];
    this.npcs = W.npcs.map((d) => new Npc(d)); this.dialog = null;
    fx.texts.length = 0; fx.particles.length = 0;
    this.zones = W.zones.filter((z) => !(z.boss && this.flags[z.boss])).map((z) => ({ ...z, alive: 0, timer: 0 }));
    this.zones.forEach((z) => spawnZone(this, z));
    restoreBossPrizes(this);
    this.exitCooldown = 0.6; this.sealedMsgT = 0;
    this.snapCamera();
    this.shakeT = 0; this.shakeMag = 0;
    this.banner = { text: W.name, t: 2.2 };
  }

  checkExits(dt) {
    this.exitCooldown -= dt; this.sealedMsgT -= dt;
    const L = this.leader;
    if (this.exitCooldown > 0 || !L) return;
    const ex = this.world.exitAt(L.x, L.y);
    if (!ex || (ex.requires && !this.flags[ex.requires])) return;
    if (ex.sealedByBoss && this.enemies.some((e) => e.boss && e.alive)) {
      if (this.sealedMsgT <= 0) { floatText(L.x, L.y - 48, 'A saida esta selada!', '#ff9a8a', 8); this.sealedMsgT = 1.5; }
      return;
    }
    this.startFade(ex.to, ex.entry);
  }

  updateFade(dt) {
    const f = this.fade;
    f.t += dt;
    if (f.phase === 'out' && f.t >= f.dur) {
      f.onMid?.();
      f.phase = 'in'; f.t = 0;
    } else if (f.phase === 'in' && f.t >= f.dur) {
      this.fade = null;
      f.onEnd?.();
    }
  }

  // ================================================================= grupo
  get leader() { return this.heroes?.[this.leaderIdx]; }
  switchLeader() {
    for (let i = 1; i <= this.heroes.length; i++) {
      const idx = (this.leaderIdx + i) % this.heroes.length;
      if (this.heroes[idx].alive) { this.leaderIdx = idx; return; }
    }
  }
  followerSlot(hero) { return this.heroes.filter((h) => h.alive && h !== this.leader).indexOf(hero); }
  nearestEnemy(x, y, maxD) { return nearest(this.enemies, x, y, maxD); }
  nearestHero(x, y, maxD) { return nearest(this.heroes, x, y, maxD); }

  addHitbox(o) { const h = new Hitbox(o); this.hitboxes.push(h); return h; }
  later(delay, fn) { this.timers.push({ t: delay, fn }); }
  explode(x, y, owner) { explode(this, x, y, owner); }
  shake(mag, t) { this.shakeMag = Math.max(this.shakeMag, mag); this.shakeT = Math.max(this.shakeT, t); }
  announce(text, t = 1.6) { this.banner = { text, t }; }

  // ================================================================= dano
  damage(target, src, h) { applyDamage(this, target, src, h); }

  // itens no chão: 'heal' cura o grupo; 'potion' vai para a bolsa
  dropPickup(x, y, kind, id) { this.pickups.push({ x, y, t: 0, kind, id }); }

  // ======================================================== interação
  nearInteractable() { return nearInteractable(this); }
  openMenu() { this.mode = 'menu'; this.menu = new Menu(this); }
  closeMenu() { this.mode = 'play'; this.menu = null; }
  // loja: o mundo congela (modo 'shop') até a tela fechar
  openShop(npcId, kind) {
    if (!SHOPS[npcId]) return;
    this.shop = new ShopScreen(this, SHOPS[npcId], kind, () => this.closeShop());
    this.mode = 'shop';
  }
  closeShop() { this.mode = 'play'; this.shop = null; }

  // ======================================================== atualização
  update(dt) {
    const i = this.input;
    this.time += dt;
    if (this.fade) { this.updateFade(dt); if (this.mode === 'title') this.title?.update(0, { wasPressed: () => false }); return; }
    switch (this.mode) {
      case 'title': this.title.update(dt, i); return;
      case 'menu': this.menu.update(dt, i); return;
      case 'shop': this.shop.update(dt, i); return;
      case 'save': this.slotScreen.update(dt, i); return;
      case 'dialog': this.dialog.update(dt, i); return;
      case 'over': this.updateGameOver(i); return;
    }

    if (i.wasPressed('KeyH')) this.showHelp = !this.showHelp;
    if (i.wasPressed('KeyP')) this.paused = !this.paused;
    if (this.paused) return;
    if (i.wasPressed('Enter', 'Escape')) { this.openMenu(); return; }
    const near = this.nearInteractable();
    if (near && i.wasPressed('KeyE')) { interact(this, near); return; }

    this.playTime += dt;
    if (i.wasPressed('Tab', 'KeyQ')) this.switchLeader();
    for (const h of this.heroes) h.update(dt, this);
    for (const n of this.npcs) n.update(dt, this);
    separateFromNpcs(this.heroes, this.npcs, this.world);
    for (const e of this.enemies) e.update(dt, this);
    updateHitboxes(this, dt);
    this.enemies = this.enemies.filter((e) => !e.gone);
    for (const t of this.timers) { t.t -= dt; if (t.t <= 0) t.fn(); }
    this.timers = this.timers.filter((t) => t.t > 0);
    updateZones(this, dt);
    updatePickups(this, dt);
    updateFx(dt);
    if (this.mode === 'play') this.checkExits(dt);

    this.followCamera();
    this.shakeT = Math.max(0, this.shakeT - dt);
    if (this.shakeT <= 0) this.shakeMag = 0;
    if (this.banner) this.banner.t -= dt;
  }

  updateGameOver(input) {
    const d = navY(input);
    if (d) this.overSel = (this.overSel + d + 2) % 2;
    if (confirm(input)) {
      const s = latestSave();
      if (this.overSel === 0 && s) this.loadGame(s.slot);
      else this.toTitle();
      if (this.overSel === 0 && s) this.mode = 'play';
    }
  }

  snapCamera() { this.cam = { x: 0, y: 0 }; this.followCamera(); }
  followCamera() {
    const L = this.leader, W = this.world;
    this.cam.x = clamp(L.x - VIEW_W / 2, 0, Math.max(0, W.pxW - VIEW_W));
    this.cam.y = clamp(L.y - VIEW_H / 2 + 10, 0, Math.max(0, W.pxH - VIEW_H));
  }

  // ======================================================== desenho
  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    if (this.mode === 'title') { this.title.draw(ctx); this.drawFade(ctx); return; }
    if (!this.world || !this.cam) { this.drawFade(ctx); return; }   // ainda entrando no mapa

    const W = this.world, s = this.shakeMag;
    const cx = Math.round(clamp(this.cam.x + (Math.random() * 2 - 1) * s, 0, Math.max(0, W.pxW - VIEW_W)));
    const cy = Math.round(clamp(this.cam.y + (Math.random() * 2 - 1) * s, 0, Math.max(0, W.pxH - VIEW_H)));
    const view = { x: cx, y: cy };

    ctx.save();
    ctx.translate(-cx, -cy);
    W.drawGround(ctx, view, VIEW_W, VIEW_H, this.time, this.flags);
    drawPickups(ctx, this.pickups);
    const list = [
      ...this.heroes.map((e) => ({ y: e.y + 4, draw: () => e.draw(ctx, e === this.leader) })),
      ...this.enemies.map((e) => ({ y: e.y + 4 - (e.alive ? 0 : 6), draw: () => e.draw(ctx) })),
      ...this.npcs.map((n) => ({ y: n.y + 4, draw: () => n.draw(ctx) })),
      ...W.visibleObjects(view, VIEW_W, VIEW_H, this.flags).map((o) => ({ y: o.y, draw: () => W.drawObject(ctx, o, this.time) })),
    ].sort((a, b) => a.y - b.y);
    for (const it of list) it.draw();
    for (const h of this.hitboxes) drawHitbox(ctx, h);
    drawFx(ctx);
    const near = this.mode === 'play' && this.nearInteractable();
    if (near) text(ctx, near.kind === 'npc' ? 'E: Falar' : 'E: Salvar', near.x, near.y - (near.kind === 'npc' ? 52 : 40), '#ffffff', 8, 'center');
    ctx.restore();

    if (W.dark) this.drawDarkness(ctx, cx, cy);
    // o HUD so aparece quando o mundo esta em foco; as telas tem rodape proprio
    if (this.mode === 'play' || this.mode === 'dialog') drawHud(ctx, this);
    if (this.mode === 'menu') this.menu.draw(ctx);
    if (this.mode === 'shop') this.shop.draw(ctx);
    if (this.mode === 'dialog') this.dialog.draw(ctx);
    if (this.mode === 'save') { ctx.fillStyle = 'rgba(0,0,10,0.5)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H); this.slotScreen.draw(ctx, this.time); }
    if (this.mode === 'over') this.drawGameOver(ctx);
    this.drawFade(ctx);
  }

  // dungeons: tudo escuro, menos em volta do grupo
  drawDarkness(ctx, cx, cy) {
    const L = this.leader, x = L.x - cx, y = L.y - cy - 14;
    const g = ctx.createRadialGradient(x, y, 50, x, y, 230);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.78)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  drawGameOver(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    text(ctx, 'GAME OVER', VIEW_W / 2, 100, '#ff6b6b', 16, 'center');
    const hasSave = !!latestSave();
    win(ctx, VIEW_W / 2 - 90, 122, 180, 48);
    ['Carregar ultimo save', 'Voltar ao titulo'].forEach((o, i) => {
      text(ctx, o, VIEW_W / 2 - 60, 142 + i * 16, i === 0 && !hasSave ? '#6a7090' : '#ffffff', 8);
      if (i === this.overSel) cursor(ctx, VIEW_W / 2 - 76, 139 + i * 16, this.time);
    });
  }

  drawFade(ctx) {
    if (!this.fade) return;
    const p = Math.min(1, this.fade.t / this.fade.dur);
    ctx.fillStyle = `rgba(0,0,0,${this.fade.phase === 'out' ? p : 1 - p})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}

function nearest(list, x, y, maxD) {
  let best = null, bd = maxD;
  for (const e of list) {
    if (!e.alive) continue;
    const d = Math.hypot(e.x - x, e.y - y);
    if (d < bd) { bd = d; best = e; }
  }
  return best;
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));