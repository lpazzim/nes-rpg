// =====================================================================
// MENU DO JOGO (Enter/Esc): Status | Itens | Equipamento
// =====================================================================
import { VIEW_W, xpToNext } from '../data.js';
import { ITEMS, ITEM_ORDER } from '../items.js';
import { formatTime } from '../save.js';
import { sheets, portraits } from '../sprites.js';
import { win, text, bar, cursor, navY, navX, confirm, back, hpColor } from './ui.js';
import { EquipTab } from './equip.js';
import { SLOTS, SLOT_NAMES, EQUIPMENT } from '../equipment.js';

const TABS = ['Status', 'Itens', 'Equip.'];

export class Menu {
  constructor(game) {
    this.game = game; this.tab = 0; this.hero = game.leaderIdx; this.item = 0;
    this.targeting = false; this.msg = null; this.msgT = 0; this.t = 0;
    this.equip = new EquipTab(game);
  }
  get items() { return ITEM_ORDER.filter((id) => this.game.inventory[id] > 0); }

  update(dt, input) {
    this.t += dt;
    if (this.msgT > 0) this.msgT -= dt;
    const g = this.game, heroes = g.heroes;
    if (input.wasPressed('KeyQ')) { this.tab = (this.tab + TABS.length - 1) % TABS.length; this.targeting = false; this.equip.reset(); }
    if (input.wasPressed('KeyE', 'Tab')) { this.tab = (this.tab + 1) % TABS.length; this.targeting = false; this.equip.reset(); }

    if (this.tab === 1 && !this.targeting) {
      const list = this.items;
      const d = navY(input);
      if (d && list.length) this.item = (this.item + d + list.length) % list.length;
      this.item = Math.min(this.item, Math.max(0, list.length - 1));
      if (confirm(input) && list.length) this.targeting = true;
      else if (back(input)) g.closeMenu();
      return;
    }
    // aba Equipamento: cima/baixo escolhem o espaco, esquerda/direita o heroi
    if (this.tab === 2) {
      const dx = navX(input);
      if (dx && this.equip.step === 'slot') this.hero = (this.hero + dx + heroes.length) % heroes.length;
      const usouTecla = this.equip.update(dt, input, this.hero);
      if (!usouTecla && (back(input) || input.wasPressed('Enter'))) g.closeMenu();
      return;
    }
    const d = navY(input);
    if (d) this.hero = (this.hero + d + heroes.length) % heroes.length;
    if (this.targeting) {
      if (confirm(input)) this.useItem();
      else if (back(input)) this.targeting = false;
      return;
    }
    if (back(input) || input.wasPressed('Enter')) g.closeMenu();
  }

  useItem() {
    const id = this.items[this.item], h = this.game.heroes[this.hero];
    const res = this.game.useItem(id, h);
    this.msg = res ? `${h.name}: ${res}` : 'Nao teve efeito'; this.msgT = 1.4;
    if (!this.items.length) this.targeting = false;
  }

  // ------------------------------------------------------------------ desenho
  draw(ctx) {
    const g = this.game;
    ctx.fillStyle = 'rgba(0,0,10,0.55)'; ctx.fillRect(0, 0, VIEW_W, 270);
    // abas
    TABS.forEach((t, i) => {
      win(ctx, 10 + i * 74, 6, 70, 18, i === this.tab);
      text(ctx, t, 45 + i * 74, 18, i === this.tab ? '#ffd84a' : '#9aa2cc', 8, 'center');
    });
    text(ctx, 'Q/E: trocar aba', 470, 18, '#aab0d8', 7, 'right');
    // lista de heróis (esquerda)
    g.heroes.forEach((h, i) => this.drawHeroCard(ctx, h, 10, 30 + i * 66, i === this.hero && (this.tab !== 1 || this.targeting)));
    // painel direito
    win(ctx, 160, 30, 310, 194);
    if (this.tab === 0) this.drawStatus(ctx, g.heroes[this.hero]);
    else if (this.tab === 1) this.drawItems(ctx);
    else this.drawEquip(ctx);
    // rodapé
    win(ctx, 10, 228, 460, 36);
    text(ctx, `Ouro: ${g.gold} G`, 20, 242, '#ffd84a', 8);
    text(ctx, `Tempo: ${formatTime(g.playTime)}`, 120, 242, '#ffffff', 8);
    text(ctx, g.world.name, 460, 242, '#cfd6ff', 8, 'right');
    const hint = this.equipHint() ?? (this.tab === 1
      ? (this.targeting ? 'Setas: escolher heroi   J: usar   K: voltar' : 'Setas: escolher item   J: selecionar   K: fechar')
      : 'Setas: escolher heroi   K/Enter: fechar');
    text(ctx, hint, 20, 256, '#aab0d8', 7);
    if (this.msgT > 0) { win(ctx, 200, 120, 230, 24); text(ctx, this.msg, 315, 136, '#ffffff', 8, 'center'); }
  }

  drawHeroCard(ctx, h, x, y, selected) {
    win(ctx, x, y, 146, 62, selected);
    const f = sheets[h.data.id].anims.idle_down.frames[0];
    ctx.save(); if (!h.alive) ctx.globalAlpha = 0.45;
    ctx.drawImage(f.img, x + 22 - f.ox, y + 52 - f.oy);
    ctx.restore();
    text(ctx, h.name, x + 44, y + 14, '#ffffff', 9);
    text(ctx, `Lv ${h.level}`, x + 138, y + 14, '#ffd84a', 8, 'right');
    text(ctx, 'HP', x + 44, y + 28, '#aab0d8', 7);
    bar(ctx, x + 58, y + 23, 80, 4, h.hp / h.maxHp, hpColor(h.hp / h.maxHp));
    text(ctx, h.alive ? `${Math.ceil(h.hp)}/${h.maxHp}` : 'K.O.', x + 138, y + 38, h.alive ? '#ffffff' : '#ff6b6b', 7, 'right');
    if (h.maxMp > 0) {
      text(ctx, 'MP', x + 44, y + 50, '#aab0d8', 7);
      bar(ctx, x + 58, y + 45, 80, 3, h.mp / h.maxMp, '#4fa3ff');
    }
    if (selected) cursor(ctx, x - 7, y + 31, this.t);
  }

  drawStatus(ctx, h) {
    const px = 172, py = 42;
    // retrato
    ctx.fillStyle = '#0a0f2c'; ctx.fillRect(px, py, 104, 104);
    ctx.strokeStyle = '#6a7ad0'; ctx.strokeRect(px + 0.5, py + 0.5, 103, 103);
    const p = portraits[h.data.id];
    if (p) {
      const s = Math.min(102 / p.width, 102 / p.height);
      ctx.drawImage(p, px + 52 - (p.width * s) / 2, py + 52 - (p.height * s) / 2, p.width * s, p.height * s);
    } else {
      const f = sheets[h.data.id].anims.idle_side.frames[0];
      ctx.save(); ctx.translate(px + 52, py + 98); ctx.scale(2, 2);
      ctx.drawImage(f.img, -f.ox, -f.oy); ctx.restore();
    }
    text(ctx, h.data.role, px + 52, py + 118, '#cfd6ff', 8, 'center');

    // atributos
    const sx = 290;
    text(ctx, h.name, sx, 50, '#ffffff', 12);
    text(ctx, `Nivel ${h.level}`, 460, 50, '#ffd84a', 9, 'right');
    const need = xpToNext(h.level);
    text(ctx, `XP ${h.xp} / ${need}`, sx, 64, '#aab0d8', 7);
    bar(ctx, sx + 70, 60, 100, 3, h.xp / need, '#7fffd4');
    const rows = [
      ['HP', `${Math.ceil(h.hp)} / ${h.maxHp}`], ['MP', h.maxMp ? `${Math.floor(h.mp)} / ${h.maxMp}` : '-'],
      ['Ataque', h.atk], ['Defesa', h.defense], ['Velocidade', h.speed], ['Critico', `${Math.round(h.crit * 100)}%`],
      ['Poder', `${Math.floor(h.power)}%`],
    ];
    rows.forEach(([k, v], i) => {
      const y = 80 + i * 12;
      text(ctx, k, sx, y, '#aab0d8', 8);
      text(ctx, String(v), 400, y, '#ffffff', 8, 'right');
    });
    text(ctx, 'Golpes', px, 172, '#ffd84a', 8);
    h.data.skills.forEach((s, i) => text(ctx, s, px, 185 + i * 11, '#e8ecff', 7));
    // pecas equipadas numa linha so (os atributos acima ja as somam)
    const pecas = SLOTS.map((slot) => {
      const id = h.equipped[slot];
      return id ? EQUIPMENT[id].name : `${SLOT_NAMES[slot]}: -`;
    }).join('  /  ');
    text(ctx, pecas, px, 220, '#cfd6ff', 7);
  }

  drawItems(ctx) {
    const list = this.items;
    text(ctx, 'Itens', 172, 46, '#ffd84a', 9);
    if (!list.length) { text(ctx, 'Nenhum item na bolsa.', 315, 120, '#8890b8', 8, 'center'); return; }
    list.forEach((id, i) => {
      const y = 64 + i * 16;
      if (i === this.item) {
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(176, y - 10, 284, 14);
        if (!this.targeting) cursor(ctx, 168, y - 3, this.t);
      }
      text(ctx, ITEMS[id].name, 184, y, '#ffffff', 8);
      text(ctx, `x${this.game.inventory[id]}`, 456, y, '#ffd84a', 8, 'right');
    });
    const sel = ITEMS[list[this.item]];
    if (sel) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(170, 186, 292, 30);
      text(ctx, sel.desc, 176, 199, '#e8ecff', 8);
      text(ctx, this.targeting ? 'Em quem usar? (setas + J)' : 'J: usar', 176, 211, '#ffd84a', 7);
    }
  }

  drawEquip(ctx) { this.equip.draw(ctx, this.hero); }
  // dica do rodape quando a aba Equipamento esta aberta
  equipHint() {
    if (this.tab !== 2) return null;
    return this.equip.step === 'list'
      ? 'Cima/baixo: peca   J: equipar   K: voltar'
      : 'Cima/baixo: espaco   Esq/dir: heroi   J: abrir   K: fechar';
  }
}
