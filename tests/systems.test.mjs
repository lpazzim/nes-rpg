// =====================================================================
// TESTES DOS SISTEMAS EXTRAÍDOS DO game.js (XP) e guarda de tamanho
// =====================================================================
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gainXp } from '../src/combat-system.js';
import { xpToNext } from '../src/data.js';

const hero = (over = {}) => ({
  alive: true, x: 0, y: 0, xp: 0, level: 1, maxHp: 100, hp: 40, atk: 10, defense: 5, maxMp: 20, mp: 3, ...over,
});

// TU-01
test('gainXp: sobe de nível com os mesmos ganhos de antes', () => {
  const h = hero();
  gainXp([h], xpToNext(1));
  assert.equal(h.level, 2);
  assert.equal(h.xp, 0);
  assert.deepEqual([h.maxHp, h.hp, h.atk, h.defense, h.maxMp, h.mp], [110, 110, 12, 6, 24, 24]);
});

test('gainXp: XP parcial não sobe de nível', () => {
  const h = hero();
  gainXp([h], 1);
  assert.deepEqual([h.level, h.xp, h.hp], [1, 1, 40]);
});

test('gainXp: herói caído não ganha XP', () => {
  const h = hero({ alive: false });
  gainXp([h], 9999);
  assert.deepEqual([h.level, h.xp], [1, 0]);
});

test('gainXp: herói sem MP não ganha MP ao subir', () => {
  const h = hero({ maxMp: 0, mp: 0 });
  gainXp([h], xpToNext(1));
  assert.deepEqual([h.maxMp, h.mp], [0, 0]);
});

// TI-02: arquivos do jogo respeitam o limite de 400 linhas
test('TI-02: nenhum arquivo de src/ passa de 400 linhas (exceto dívida conhecida)', () => {
  const DEBT = new Set(['map/art.js']); // registrada em AGENTS.md (dívida técnica)
  const walk = (dir) => readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') ? [p] : [];
  });
  const root = fileURLToPath(new URL('../src', import.meta.url));
  for (const f of walk(root)) {
    const rel = f.slice(root.length + 1).split(sep).join('/');
    if (DEBT.has(rel)) continue;
    const lines = readFileSync(f, 'utf8').split('\n').length;
    assert.ok(lines <= 400, `${rel} tem ${lines} linhas (limite 400)`);
  }
});
