// =====================================================================
// ABA EQUIPAMENTO DO MENU
// Passo 'slot': escolhe arma / armadura / acessorio (setas, J abre).
// Passo 'list': escolhe a peca da bolsa (ou "Tirar"), com a comparacao
//               dos atributos: verde melhora, vermelho piora.
// As regras ficam em src/equipment.js; aqui so se le o estado e desenha.
// =====================================================================
import { SLOTS, SLOT_NAMES, EQUIPMENT, piecesFor, equip, unequip, compareStats } from '../equipment.js';
import { text, cursor, navY, confirm, back } from './ui.js';

const MSG_TIME = 1.4;
const ROW_H = 18;
const LIST_Y = 128;          // onde comeca a lista de pecas
const MAX_ROWS = 5;          // a aventura 1 nao chega a isso por espaco
const GREEN = '#7dff8a', RED = '#ff9a8a', BLUE = '#9fe4ff', GRAY = '#6a7090';

export class EquipTab {
  constructor(game) {
    this.game = game;
    this.step = 'slot'; this.slot = 0; this.sel = 0;
    this.msg = null; this.msgT = 0; this.t = 0;
  }

  get hero() { return this.game.heroes[this.heroIdx]; }
  get slotId() { return SLOTS[this.slot]; }
  // "Tirar" (null) entra na frente quando ha peca equipada
  get options() {
    const pieces = piecesFor(this.hero.type, this.slotId, this.game.inventory).slice(0, MAX_ROWS);
    return this.hero.equipped[this.slotId] ? [null, ...pieces] : pieces;
  }

  say(msg) { this.msg = msg; this.msgT = MSG_TIME; }
  reset() { this.step = 'slot'; this.sel = 0; }       // ao trocar de aba do menu

  // heroIdx vem do Menu (a aba usa o mesmo heroi selecionado nas outras)
  update(dt, input, heroIdx) {
    this.t += dt; this.heroIdx = heroIdx;
    if (this.msgT > 0) this.msgT -= dt;
    return this.step === 'slot' ? this.updateSlot(input) : this.updateList(input);
  }

  // devolve true quando a aba "consumiu" a tecla de voltar
  updateSlot(input) {
    const d = navY(input);
    if (d) this.slot = (this.slot + d + SLOTS.length) % SLOTS.length;
    if (confirm(input)) {               // Enter tambem confirma: nao pode fechar o menu
      if (!this.options.length) this.say('Nada compativel na bolsa');
      else { this.step = 'list'; this.sel = 0; }
      return true;
    }
    return false;                       // K/Esc no passo 'slot' fecha o menu
  }

  updateList(input) {
    const list = this.options;
    if (back(input)) { this.step = 'slot'; return true; }
    const d = navY(input);
    if (d && list.length) this.sel = (this.sel + d + list.length) % list.length;
    if (!confirm(input)) return true;
    const id = list[this.sel] ?? null;
    const r = id
      ? equip(this.hero, this.game.inventory, this.slotId, id)
      : unequip(this.hero, this.game.inventory, this.slotId);
    if (r.ok) this.say(id ? `${this.hero.name} equipou ${EQUIPMENT[id].name}` : `${this.hero.name} tirou a peca`);
    this.step = 'slot';
    return true;
  }

  // ------------------------------------------------------------------ desenho
  draw(ctx, heroIdx) {
    this.heroIdx = heroIdx;
    const h = this.hero;
    text(ctx, `Equipamento - ${h.name}`, 172, 46, '#ffd84a', 9);
    SLOTS.forEach((slot, i) => {
      const y = 70 + i * ROW_H, id = h.equipped[slot];
      const ativo = this.step === 'slot' && i === this.slot;
      text(ctx, SLOT_NAMES[slot], 190, y, '#aab0d8', 8);
      text(ctx, id ? EQUIPMENT[id].name : '(vazio)', 290, y, id ? '#ffffff' : GRAY, 8);
      if (ativo) cursor(ctx, 176, y - 3, this.t);
    });
    if (this.step === 'list') this.drawList(ctx);
    else this.drawEquippedInfo(ctx);
    if (this.msgT > 0 && this.msg) text(ctx, this.msg, 172, 216, '#7dff8a', 8);
  }

  // passo 'slot': descricao da peca que ja esta equipada
  drawEquippedInfo(ctx) {
    const id = this.hero.equipped[this.slotId];
    if (!id) { text(ctx, 'Espaco vazio.', 172, LIST_Y, GRAY, 8); return; }
    const p = EQUIPMENT[id];
    text(ctx, p.name, 172, LIST_Y, '#ffd84a', 8);
    text(ctx, p.desc, 172, LIST_Y + 14, '#e8ecff', 7);
    const { effects } = compareStats(this.hero, this.slotId, id);
    effects.forEach((e, i) => text(ctx, e, 172, LIST_Y + 28 + i * 11, BLUE, 7));
  }

  drawList(ctx) {
    const list = this.options;
    if (!list.length) { text(ctx, 'Nada compativel na bolsa.', 172, LIST_Y, GRAY, 8); return; }
    list.forEach((id, i) => {
      const y = LIST_Y + i * 14;
      const nome = id ? EQUIPMENT[id].name : 'Tirar';
      text(ctx, nome, 190, y, i === this.sel ? '#ffffff' : '#aab0d8', 8);
      if (i === this.sel) cursor(ctx, 176, y - 3, this.t);
    });
    this.drawCompare(ctx, list[this.sel] ?? null);
  }

  // comparacao da peca selecionada, na coluna da direita
  drawCompare(ctx, id) {
    const { diffs, effects } = compareStats(this.hero, this.slotId, id);
    const x = 320;
    let y = LIST_Y;
    if (!diffs.length && !effects.length) { text(ctx, 'Sem mudanca', x, y, GRAY, 7); return; }
    for (const d of diffs) {
      const cor = d.better ? GREEN : RED;
      text(ctx, d.label, x, y, '#aab0d8', 7);
      text(ctx, `${fmt(d.key, d.from)} > ${fmt(d.key, d.to)}`, 458, y, cor, 7, 'right');
      y += 11;
    }
    for (const e of effects) { text(ctx, e, x, y, BLUE, 7); y += 11; }
  }
}

// critico aparece em porcentagem; o resto, inteiro
const fmt = (key, v) => (key === 'crit' ? `${Math.round(v * 100)}%` : String(Math.round(v)));
