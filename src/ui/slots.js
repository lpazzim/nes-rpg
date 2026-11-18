// =====================================================================
// TELA DE ESPAÇOS DE SAVE (usada para salvar no cristal e para carregar)
// =====================================================================
import { VIEW_W } from '../data.js';
import { MAPS } from '../maps/index.js';
import { listSaves, formatTime } from '../save.js';
import { win, text, cursor, navY, confirm, back } from './ui.js';

export class SlotScreen {
  // mode: 'save' | 'load'
  constructor(game, mode, onDone) {
    this.game = game; this.mode = mode; this.onDone = onDone;
    this.saves = listSaves(); this.sel = 0; this.confirming = false; this.msg = null; this.msgT = 0;
    if (mode === 'load') { const i = this.saves.findIndex((s) => s.data); this.sel = Math.max(0, i); }
  }

  update(dt, input) {
    if (this.msgT > 0) { this.msgT -= dt; if (this.msgT <= 0 && this.closeAfterMsg) this.onDone(null); return; }
    const slot = this.saves[this.sel];
    if (this.confirming) {
      if (confirm(input)) this.doSave(slot.slot);
      else if (back(input)) this.confirming = false;
      return;
    }
    const d = navY(input);
    if (d) this.sel = (this.sel + d + this.saves.length) % this.saves.length;
    if (back(input)) { this.onDone(null); return; }
    if (confirm(input)) {
      if (this.mode === 'save') {
        if (slot.data) this.confirming = true; else this.doSave(slot.slot);
      } else if (slot.data) this.onDone(slot.slot);
      else this.flash('Espaco vazio');
    }
  }

  doSave(slot) {
    this.confirming = false;
    const ok = this.game.saveGame(slot);
    this.saves = listSaves();
    this.flash(ok ? 'Jogo salvo!' : 'Nao foi possivel salvar', ok);
  }
  flash(msg, close = false) { this.msg = msg; this.msgT = close ? 1.1 : 0.9; this.closeAfterMsg = close; }

  draw(ctx, time) {
    const x = 60, w = VIEW_W - 120;
    win(ctx, x, 22, w, 22);
    text(ctx, this.mode === 'save' ? 'Salvar o jogo' : 'Continuar a campanha', VIEW_W / 2, 37, '#ffffff', 9, 'center');
    this.saves.forEach((s, i) => {
      const y = 52 + i * 58;
      win(ctx, x, y, w, 52, i === this.sel);
      text(ctx, `Espaco ${s.slot}`, x + 18, y + 14, '#ffd84a', 8);
      if (!s.data) { text(ctx, '- vazio -', x + w / 2, y + 30, '#8890b8', 8, 'center'); }
      else {
        const d = s.data, map = MAPS[d.map]?.name || d.map;
        text(ctx, map, x + 80, y + 14, '#ffffff', 8);
        text(ctx, `Tempo ${formatTime(d.playTime || 0)}`, x + w - 10, y + 14, '#cfd6ff', 7, 'right');
        d.heroes.forEach((h, k) => text(ctx, `${h.name} Lv${h.level}`, x + 18 + k * 110, y + 30, '#ffffff', 8));
        const dt = new Date(d.savedAt);
        text(ctx, `Ouro ${d.gold} G    salvo em ${dt.toLocaleDateString('pt-BR')} ${dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
          x + 18, y + 44, '#aab0d8', 7);
      }
      if (i === this.sel) cursor(ctx, x - 10, y + 26, time);
    });
    if (this.confirming) {
      win(ctx, VIEW_W / 2 - 90, 116, 180, 38);
      text(ctx, 'Sobrescrever este espaco?', VIEW_W / 2, 131, '#ffffff', 8, 'center');
      text(ctx, 'J: sim     K: nao', VIEW_W / 2, 145, '#ffd84a', 8, 'center');
    }
    if (this.msgT > 0) {
      win(ctx, VIEW_W / 2 - 80, 120, 160, 26);
      text(ctx, this.msg, VIEW_W / 2, 137, '#ffffff', 9, 'center');
    }
    text(ctx, 'J: confirmar    K: voltar', VIEW_W / 2, 262, '#cfd6ff', 7, 'center');
  }
}
