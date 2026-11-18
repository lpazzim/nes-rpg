// Regras de combate e progressão (lógica pura).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcDamage } from '../src/combat.js';
import { xpToNext, HEROES } from '../src/data.js';

// fixa os sorteios: um valor só, ou uma sequência (calcDamage sorteia variação e depois crítico)
const withRandom = (values, fn) => {
  const seq = [].concat(values), original = Math.random;
  let i = 0;
  Math.random = () => seq[Math.min(i++, seq.length - 1)];
  try { return fn(); } finally { Math.random = original; }
};

test('dano nunca é menor que 1, mesmo com defesa alta', () => {
  const { amount } = withRandom(0.5, () => calcDamage(1, 999, 1, 0));
  assert.equal(amount, 1);
});

test('crítico multiplica o dano por 1,8', () => {
  const normal = withRandom(0.5, () => calcDamage(20, 0, 1, 0)).amount;
  const crit = withRandom([0.5, 0], () => calcDamage(20, 0, 1, 1));
  assert.equal(crit.crit, true);
  assert.equal(crit.amount, Math.round(normal * 1.8));
});

test('XP para o próximo nível cresce a cada nível', () => {
  for (let lv = 1; lv < 50; lv++) assert.ok(xpToNext(lv + 1) > xpToNext(lv));
});

test('heróis têm id único e descrições dos 3 golpes', () => {
  assert.equal(new Set(HEROES.map((h) => h.id)).size, HEROES.length);
  for (const h of HEROES) assert.equal(h.skills.length, 3, `${h.id} precisa de 3 linhas em skills`);
});
