// =====================================================================
// CAIXA DE DIÁLOGO (estilo SNES)
// Desenha o estado de um DialogRunner (src/dialog-runner.js) e repassa
// as teclas: confirmar completa/avança/escolhe, setas escolhem, voltar
// escolhe a última opção (só quando há escolhas na tela).
// Ao terminar, chama onClose(action) — quem abriu decide o que fazer.
// =====================================================================
import { VIEW_W } from '../data.js';
import { win, text, cursor, navY, confirm, back } from './ui.js';

const BOX = { x: 10, y: 196, w: VIEW_W - 20, h: 64 };
const LINE_Y = [216, 230, 244];
const OPTION_H = 16;

export class DialogBox {
  constructor(runner, onClose) {
    this.runner = runner; this.onClose = onClose; this.t = 0;
  }

  update(dt, input) {
    this.t += dt;
    const r = this.runner;
    r.tick(dt);
    if (r.choosing) {
      const d = navY(input);
      if (d) r.move(d);
      if (confirm(input)) r.confirm();
      else if (back(input)) r.cancel();
    } else if (confirm(input)) r.confirm();
    if (r.done) this.onClose(r.action);
  }

  draw(ctx) {
    const r = this.runner;
    win(ctx, BOX.x, BOX.y, BOX.w, BOX.h);
    // aba com o nome
    ctx.font = 'bold 8px monospace';
    const nameW = Math.ceil(ctx.measureText(r.name).width) + 16;
    win(ctx, BOX.x + 8, BOX.y - 10, nameW, 16);
    text(ctx, r.name, BOX.x + 16, BOX.y + 1, '#ffd84a', 8);
    // texto da página
    r.visibleLines().forEach((line, i) => text(ctx, line, BOX.x + 14, LINE_Y[i], '#ffffff', 8));
    // seta piscando: há mais texto
    if (r.pageComplete && !r.choosing && r.hasMore && Math.floor(this.t * 3) % 2 === 0) {
      const ax = BOX.x + BOX.w - 14, ay = BOX.y + BOX.h - 12;
      ctx.fillStyle = '#ffd84a';
      ctx.beginPath(); ctx.moveTo(ax - 4, ay - 2); ctx.lineTo(ax + 4, ay - 2); ctx.lineTo(ax, ay + 3); ctx.fill();
    }
    if (r.choosing) this.drawChoices(ctx, r);
  }

  drawChoices(ctx, r) {
    const n = r.choices.length, w = 110, h = n * OPTION_H + 8;
    const x = BOX.x + BOX.w - w, y = BOX.y - h - 8;
    win(ctx, x, y, w, h);
    r.choices.forEach((o, i) => {
      const oy = y + 15 + i * OPTION_H;
      text(ctx, o.label, x + 20, oy, i === r.sel ? '#ffffff' : '#aab0d8', 8);
      if (i === r.sel) cursor(ctx, x + 8, oy - 3, this.t);
    });
  }
}
