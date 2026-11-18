// =====================================================================
// REGRAS DE LOJA E ESTALAGEM (lógica pura, sem tela)
// Operam sobre uma "carteira": qualquer objeto com { gold, inventory }
// (o próprio Game serve). Só alteram a carteira quando devolvem ok: true;
// a quantidade na bolsa fica sempre entre 1 e MAX_STACK (0 remove a chave).
// =====================================================================
import { ITEM_ORDER, MAX_STACK, SELL_RATE, findItem } from './items.js';

/**
 * @typedef {Object} Wallet
 * @property {number} gold
 * @property {Object<string, number>} inventory
 *
 * @typedef {{ ok: true, cost?: number, gain?: number, revived?: Object[] }
 *   | { ok: false, reason: 'unknown'|'qty'|'gold'|'full'|'none'|'rested' }} ShopResult
 */

const isQty = (n) => Number.isInteger(n) && n >= 1;
const owned = (w, id) => w.inventory[id] || 0;

export function sellPrice(id) {
  const it = findItem(id);
  return it ? Math.floor(it.price * SELL_RATE) : 0;
}

// quantas unidades ainda dá para comprar (ouro e limite da bolsa)
export function maxBuy(w, id) {
  const it = findItem(id);
  if (!it) return 0;
  return Math.max(0, Math.min(Math.floor(w.gold / it.price), MAX_STACK - owned(w, id)));
}

/** @returns {ShopResult} */
export function buy(w, id, qty) {
  if (!findItem(id)) return { ok: false, reason: 'unknown' };
  if (!isQty(qty)) return { ok: false, reason: 'qty' };
  if (owned(w, id) + qty > MAX_STACK) return { ok: false, reason: 'full' };
  const cost = findItem(id).price * qty;
  if (cost > w.gold) return { ok: false, reason: 'gold' };
  w.gold -= cost;
  w.inventory[id] = owned(w, id) + qty;
  return { ok: true, cost };
}

/** @returns {ShopResult} */
export function sell(w, id, qty) {
  if (!findItem(id)) return { ok: false, reason: 'unknown' };
  if (!isQty(qty)) return { ok: false, reason: 'qty' };
  if (qty > owned(w, id)) return { ok: false, reason: 'none' };
  const gain = sellPrice(id) * qty;
  w.gold += gain;
  w.inventory[id] = owned(w, id) - qty;
  if (w.inventory[id] <= 0) delete w.inventory[id];
  return { ok: true, gain };
}

// itens da bolsa que podem ser vendidos (ordem do menu, depois o resto)
export function sellableItems(inventory) {
  const has = (id) => findItem(id) && inventory[id] > 0;
  const rest = Object.keys(inventory).filter((id) => has(id) && !ITEM_ORDER.includes(id));
  return [...ITEM_ORDER.filter(has), ...rest];
}

export function needsRest(heroes) {
  return heroes.some((h) => !h.alive || h.hp < h.maxHp || h.mp < h.maxMp);
}

// descansar: cura e revive todos; "rested" vem antes de "gold" (quem não precisa não é avisado de falta de ouro)
/** @returns {ShopResult} */
export function rest(w, heroes, price) {
  if (!needsRest(heroes)) return { ok: false, reason: 'rested' };
  if (price > w.gold) return { ok: false, reason: 'gold' };
  w.gold -= price;
  const revived = [];
  for (const h of heroes) {
    if (!h.alive) { h.alive = true; revived.push(h); }
    h.hp = h.maxHp; h.mp = h.maxMp;
  }
  return { ok: true, cost: price, revived };
}
