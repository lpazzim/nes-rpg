// =====================================================================
// TESTES DE LOJA E ESTALAGEM (regras puras de src/shop.js)
// =====================================================================
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buy, sell, maxBuy, sellPrice, sellableItems, needsRest, rest } from '../src/shop.js';
import { ITEMS, MAX_STACK } from '../src/items.js';

const wallet = (gold, inventory = {}) => ({ gold, inventory: { ...inventory } });
const snap = (w) => JSON.stringify(w);
const hero = (over = {}) => ({ alive: true, hp: 100, maxHp: 100, mp: 10, maxMp: 10, ...over });

test('TU-03: comprar 3 Poções com 100 G e 3 na bolsa', () => {
  const w = wallet(100, { potion: 3 });
  const r = buy(w, 'potion', 3);
  assert.deepEqual(r, { ok: true, cost: 90 });
  assert.equal(w.gold, 10);
  assert.equal(w.inventory.potion, 6);
});

test('TU-04: maxBuy respeita o ouro e o limite da bolsa', () => {
  assert.equal(maxBuy(wallet(100), 'potion'), 3);
  assert.equal(maxBuy(wallet(99999, { potion: 97 }), 'potion'), 2);
  assert.equal(maxBuy(wallet(10), 'potion'), 0);
  assert.equal(maxBuy(wallet(500), 'nada'), 0);
});

test('TU-05: compra sem ouro é recusada sem mexer em nada', () => {
  const w = wallet(20, { potion: 1 }), antes = snap(w);
  assert.deepEqual(buy(w, 'potion', 1), { ok: false, reason: 'gold' });
  assert.equal(snap(w), antes);
});

test('TU-06: bolsa cheia recusa a compra (99, e 98 + 3)', () => {
  for (const [tem, qtd] of [[99, 1], [98, 3]]) {
    const w = wallet(9999, { potion: tem }), antes = snap(w);
    assert.deepEqual(buy(w, 'potion', qtd), { ok: false, reason: 'full' });
    assert.equal(snap(w), antes);
  }
});

test('TU-07: vender 2 de 3 Poções; vender a última remove a chave', () => {
  const w = wallet(0, { potion: 3 });
  assert.deepEqual(sell(w, 'potion', 2), { ok: true, gain: 30 });
  assert.deepEqual([w.gold, w.inventory.potion], [30, 1]);
  sell(w, 'potion', 1);
  assert.equal('potion' in w.inventory, false);
  assert.equal(w.gold, 45);
});

test('TU-08: preço de venda = metade arredondada para baixo, para todos os itens', () => {
  for (const [id, it] of Object.entries(ITEMS)) {
    const p = sellPrice(id);
    assert.ok(Number.isInteger(p) && p === Math.floor(it.price / 2), `${id}: ${p}`);
  }
  assert.equal(sellPrice('nada'), 0);
});

test('TU-09: sellableItems ignora vazios e ids desconhecidos', () => {
  assert.deepEqual(sellableItems({}), []);
  assert.deepEqual(sellableItems({ fantasma: 5, potion: 0 }), []);
  assert.deepEqual(sellableItems({ phoenix: 1, potion: 2, fantasma: 5 }), ['potion', 'phoenix']);
});

test('TU-10: descansar cura, revive e cobra', () => {
  const w = wallet(50);
  const heroes = [hero({ hp: 10, mp: 2 }), hero({ alive: false, hp: 0 }), hero()];
  const r = rest(w, heroes, 20);
  assert.equal(r.ok, true);
  assert.equal(w.gold, 30);
  assert.deepEqual(r.revived, [heroes[1]]);
  for (const h of heroes) assert.deepEqual([h.alive, h.hp, h.mp], [true, 100, 10]);
});

test('TU-11: descansar sem ouro é recusado e nada muda', () => {
  const w = wallet(10), heroes = [hero({ hp: 5 })], antes = snap(heroes);
  assert.deepEqual(rest(w, heroes, 20), { ok: false, reason: 'gold' });
  assert.equal(w.gold, 10);
  assert.equal(snap(heroes), antes);
});

test('TU-12: grupo cheio não paga (e não é avisado de falta de ouro)', () => {
  const heroes = [hero(), hero()];
  assert.equal(needsRest(heroes), false);
  assert.deepEqual(rest(wallet(0), heroes, 20), { ok: false, reason: 'rested' });
  assert.deepEqual(rest(wallet(500), heroes, 20), { ok: false, reason: 'rested' });
});

test('TU-13: entradas inválidas são recusadas sem alterar a carteira', () => {
  const w = wallet(500, { potion: 2 }), antes = snap(w);
  const casos = [
    [buy(w, 'nada', 1), 'unknown'], [sell(w, 'nada', 1), 'unknown'],
    [buy(w, 'potion', 0), 'qty'], [buy(w, 'potion', -1), 'qty'], [buy(w, 'potion', 1.5), 'qty'],
    [buy(w, 'potion', NaN), 'qty'], [sell(w, 'potion', 0), 'qty'], [sell(w, 'potion', 2.5), 'qty'],
    [sell(w, 'potion', 3), 'none'], [sell(w, 'ether', 1), 'none'],
  ];
  for (const [r, reason] of casos) assert.deepEqual(r, { ok: false, reason });
  assert.equal(snap(w), antes);
});

test('TU-14: 500 operações aleatórias com semente nunca quebram os limites', () => {
  let seed = 12345;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const ids = Object.keys(ITEMS), w = wallet(300);
  for (let i = 0; i < 500; i++) {
    const id = ids[Math.floor(rnd() * ids.length)], qty = 1 + Math.floor(rnd() * 120);
    if (rnd() < 0.5) buy(w, id, qty); else sell(w, id, qty);
    if (rnd() < 0.1) w.gold += 200;
    assert.ok(w.gold >= 0, `ouro negativo na operação ${i}`);
    for (const [k, v] of Object.entries(w.inventory)) {
      assert.ok(ITEMS[k], `item desconhecido ${k}`);
      assert.ok(Number.isInteger(v) && v >= 1 && v <= MAX_STACK, `${k}=${v}`);
    }
  }
});

// --- regressão do QA: a lista da loja rola, o cursor nunca sai da janela -------
test('BUG-01 (QA): scrollTop mantém o cursor dentro das 9 linhas visíveis', async () => {
  const { scrollTop } = await import('../src/ui/shop.js');
  const V = 9, total = 12;
  assert.equal(scrollTop(0, 0, V, total), 0);
  assert.equal(scrollTop(8, 0, V, total), 0, 'a 9a linha ainda cabe sem rolar');
  assert.equal(scrollTop(9, 0, V, total), 1, 'a 10a linha empurra a janela');
  assert.equal(scrollTop(11, 1, V, total), 3, 'a ultima linha fecha a janela no fim');
  assert.equal(scrollTop(2, 3, V, total), 2, 'subir devolve a janela');
  assert.equal(scrollTop(0, 3, V, total), 0);
  // lista curta: nunca rola
  assert.equal(scrollTop(3, 0, V, 5), 0);
  // varredura: para qualquer posição o cursor fica visível
  let top = 0;
  for (let sel = 0; sel < total; sel++) {
    top = scrollTop(sel, top, V, total);
    assert.ok(sel >= top && sel < top + V, `sel ${sel} fora da janela (top ${top})`);
  }
  for (let sel = total - 1; sel >= 0; sel--) {
    top = scrollTop(sel, top, V, total);
    assert.ok(sel >= top && sel < top + V, `sel ${sel} fora da janela subindo (top ${top})`);
  }
});
