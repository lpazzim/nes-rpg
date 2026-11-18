// =====================================================================
// TELA DA LOJA (comprar / vender)
// Passo 'list': escolhe o item (setas, J confirma, K sai).
// Passo 'qty':  escolhe a quantidade (cima/direita +1, baixo/esquerda -1),
//               J confirma a operação, K volta à lista.
// As contas ficam em src/shop.js; esta tela só lê o estado e desenha.
// Ao sair chama onClose() — quem abriu volta o jogo ao modo 'play'.
// =====================================================================
import { VIEW_W, VIEW_H } from '../data.js';
import { ITEMS, MAX_STACK } from '../items.js';
import { buy, sell, maxBuy, sellPrice, sellableItems } from '../shop.js';
import { win, text, cursor, navY, navX, confirm, back } from './ui.js';

const MSG_TIME = 1.4;
const ROW_H = 16;
const GRAY = '#6a7090';

export class ShopScreen {
  constructor(game, shop, kind, onClose) {
    this.game = game; this.shop = shop; this.kind = kind; this.onClose = onClose;
    this.step = 'list'; this.sel = 0; this.qty = 1; this.msg = null; this.msgT = 0; this.t = 0;
  }

  get items() { return this.kind === 'buy' ? this.shop.stock : sellableItems(this.game.inventory); }
  owned(id) { return this.game.inventory[id] || 0; }
  // limite do seletor: o que dá para comprar ou o que se tem para vender
  limit(id) { return this.kind === 'buy' ? maxBuy(this.game, id) : this.owned(id); }
  say(msg, ok = true) { this.msg = { text: msg, ok }; this.msgT = MSG_TIME; }

  update(dt, input) {
    this.t += dt;
    if (this.msgT > 0) this.msgT -= dt;
    if (this.step === 'list') this.updateList(input); else this.updateQty(input);
  }

  updateList(input) {
    const list = this.items;
    if (back(input)) { this.onClose(); return; }
    const d = navY(input);
    if (d && list.length) this.sel = (this.sel + d + list.length) % list.length;
    if (!confirm(input) || !list.length) return;
    const id = list[this.sel];
    if (this.limit(id) > 0) { this.step = 'qty'; this.qty = 1; return; }
    this.say(this.owned(id) >= MAX_STACK ? 'Bolsa cheia' : 'Ouro insuficiente', false);
  }

  updateQty(input) {
    const id = this.items[this.sel], max = this.limit(id);
    if (back(input)) { this.step = 'list'; return; }
    const d = navX(input) - navY(input);
    if (d) this.qty = Math.max(1, Math.min(max, this.qty + d));
    if (!confirm(input)) return;
    const name = ITEMS[id].name, n = this.qty;
    const r = this.kind === 'buy' ? buy(this.game, id, n) : sell(this.game, id, n);
    if (r.ok) this.say(this.kind === 'buy' ? `Comprou ${n} ${name}!` : `Vendeu ${n} ${name} (+${r.gain} G)`);
    else this.say(r.reason === 'gold' ? 'Ouro insuficiente' : 'Nao foi possivel', false);
    this.step = 'list';
    this.sel = Math.min(this.sel, Math.max(0, this.items.length - 1));
  }

  // ------------------------------------------------------------------ desenho
  draw(ctx) {
    ctx.fillStyle = 'rgba(0,0,10,0.55)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    const title = this.kind === 'buy' ? this.shop.name.toUpperCase() : 'VENDER';
    win(ctx, 10, 8, 460, 22);
    text(ctx, title, 20, 23, '#ffd84a', 9);
    text(ctx, `Ouro: ${this.game.gold} G`, 460, 23, '#ffd84a', 9, 'right');
    win(ctx, 10, 34, 460, 150);
    this.drawList(ctx);
    win(ctx, 10, 190, 460, 70);
    this.drawFooter(ctx);
  }

  drawList(ctx) {
    const list = this.items;
    if (!list.length) { text(ctx, 'Nada para vender', 240, 112, '#aab0d8', 9, 'center'); return; }
    list.forEach((id, i) => {
      const y = 54 + i * ROW_H;
      const enabled = this.kind === 'sell' || this.limit(id) > 0;
      const color = enabled ? '#ffffff' : GRAY;
      const price = this.kind === 'buy' ? ITEMS[id].price : sellPrice(id);
      text(ctx, ITEMS[id].name, 32, y, color, 8);
      text(ctx, `${price} G`, 250, y, enabled ? '#ffd84a' : GRAY, 8, 'right');
      text(ctx, `Tem: ${this.owned(id)}`, 360, y, color, 8);
      if (i === this.sel) cursor(ctx, 20, y - 3, this.t);
    });
  }

  drawFooter(ctx) {
    const id = this.items[this.sel];
    if (id) text(ctx, ITEMS[id].desc, 22, 208, '#e8ecff', 8);
    if (this.step === 'qty' && id) {
      const unit = this.kind === 'buy' ? ITEMS[id].price : sellPrice(id);
      text(ctx, `Quantidade: < ${this.qty} >   Total: ${unit * this.qty} G`, 22, 228, '#ffffff', 8);
      text(ctx, this.kind === 'buy' ? 'J: comprar   K: voltar' : 'J: vender   K: voltar', 458, 228, '#aab0d8', 7, 'right');
    } else {
      text(ctx, 'J: escolher item   K: sair', 22, 228, '#aab0d8', 7);
    }
    if (this.msgT > 0 && this.msg) text(ctx, this.msg.text, 22, 246, this.msg.ok ? '#7dff8a' : '#ff9a8a', 8);
  }
}
