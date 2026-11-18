// =====================================================================
// TELA TÍTULO: Novo jogo / Continuar
// =====================================================================
import { VIEW_W, VIEW_H, GAME_TITLE } from '../data.js';
import { latestSave } from '../save.js';
import { SlotScreen } from './slots.js';
import { win, text, cursor, navY, confirm } from './ui.js';

export class TitleScreen {
  constructor(game) {
    this.game = game; this.sel = latestSave() ? 1 : 0; this.slots = null; this.t = 0;
  }
  get options() { return [{ label: 'Novo Jogo', ok: true }, { label: 'Continuar', ok: !!latestSave() }]; }

  update(dt, input) {
    this.t += dt;
    if (this.slots) { this.slots.update(dt, input); return; }
    const d = navY(input);
    if (d) this.sel = (this.sel + d + 2) % 2;
    if (confirm(input)) {
      const opt = this.options[this.sel];
      if (!opt.ok) return;
      if (this.sel === 0) this.game.newGame();
      else this.slots = new SlotScreen(this.game, 'load', (slot) => {
        this.slots = null;
        if (slot) this.game.loadGame(slot);
      });
    }
  }

  draw(ctx) {
    // fundo: a vila passando devagar
    const W = this.game.getWorld('vila');
    const x = Math.round(((Math.sin(this.t * 0.05) + 1) / 2) * (W.pxW - VIEW_W)), y = Math.round(W.pxH / 2 - VIEW_H / 2);
    ctx.save(); ctx.translate(-x, -y);
    W.drawGround(ctx, { x, y }, VIEW_W, VIEW_H, this.t, {});
    for (const o of W.visibleObjects({ x, y }, VIEW_W, VIEW_H, {}).sort((a, b) => a.y - b.y)) W.drawObject(ctx, o, this.t);
    ctx.restore();
    ctx.fillStyle = 'rgba(8,10,30,0.55)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    if (this.slots) { this.slots.draw(ctx, this.t); return; }
    const pulse = 0.85 + Math.sin(this.t * 2) * 0.15;
    ctx.globalAlpha = pulse;
    text(ctx, GAME_TITLE.toUpperCase(), VIEW_W / 2, 92, '#ffe9a8', 24, 'center');
    ctx.globalAlpha = 1;
    text(ctx, 'um RPG de acao', VIEW_W / 2, 110, '#cfd6ff', 8, 'center');
    win(ctx, VIEW_W / 2 - 60, 150, 120, 48);
    this.options.forEach((o, i) => {
      text(ctx, o.label, VIEW_W / 2 - 30, 170 + i * 16, o.ok ? '#ffffff' : '#6a7090', 9);
      if (i === this.sel) cursor(ctx, VIEW_W / 2 - 44, 167 + i * 16, this.t);
    });
    text(ctx, 'Setas: escolher    J/Enter: confirmar', VIEW_W / 2, 250, '#aab0d8', 7, 'center');
  }
}
