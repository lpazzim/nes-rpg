// Integridade dos mapas: monta cada mapa registrado (sem desenhar) e confere
// saídas, entradas, inimigos e se toda a área andável é alcançável.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, NEW_GAME } from '../src/maps/index.js';
import { ENEMIES } from '../src/data.js';
import { DIALOGUES } from '../src/dialogues.js';
import { readFileSync } from 'node:fs';

const sprites = JSON.parse(readFileSync(new URL('../assets/sprites/sprites.json', import.meta.url)));
const NPC_ANIMS = ['idle_down', 'walk_down', 'idle_up', 'walk_up', 'idle_side', 'walk_side'];

const WALKABLE = new Set(['g', 'f', 'd', 's', 'b', 'c', 'm', 'n']);
const layouts = Object.fromEntries(Object.entries(MAPS).map(([id, def]) => [id, def.build()]));
const inside = (e, x, y) => x >= e.x0 && x <= e.x1 && y >= e.y0 && y <= e.y1;

test('o novo jogo começa num mapa e entrada que existem', () => {
  assert.ok(layouts[NEW_GAME.map], `mapa ${NEW_GAME.map} não registrado`);
  assert.ok(layouts[NEW_GAME.map].entries[NEW_GAME.entry], `entrada ${NEW_GAME.entry} não existe`);
});

for (const [id, L] of Object.entries(layouts)) {
  test(`${id}: toda saída leva a um mapa e entrada existentes`, () => {
    for (const ex of L.exits) {
      assert.ok(layouts[ex.to], `saída para mapa inexistente "${ex.to}"`);
      assert.ok(layouts[ex.to].entries[ex.entry], `mapa "${ex.to}" não tem a entrada "${ex.entry}"`);
    }
  });

  test(`${id}: entradas ficam em chão andável e fora das saídas`, () => {
    for (const [name, e] of Object.entries(L.entries)) {
      assert.ok(WALKABLE.has(L.tiles[e.y]?.[e.x]), `entrada "${name}" em bloco "${L.tiles[e.y]?.[e.x]}"`);
      assert.ok(!L.exits.some((ex) => inside(ex, e.x, e.y)), `entrada "${name}" está dentro de uma saída (loop de troca de mapa)`);
    }
  });

  test(`${id}: inimigos das áreas existem em ENEMIES`, () => {
    for (const z of L.zones) assert.ok(ENEMIES[z.type], `tipo de inimigo desconhecido "${z.type}"`);
  });

  test(`TI-01 ${id}: todo NPC tem falas e as animações de movimento`, () => {
    for (const n of L.npcs || []) {
      assert.ok(DIALOGUES[n.id], `NPC "${n.id}" sem falas em src/dialogues.js`);
      for (const a of NPC_ANIMS) assert.ok(sprites.npcs?.anims[`${n.id}.${a}`], `NPC "${n.id}" sem a animação ${a}`);
    }
  });

  test(`TI-02 ${id}: NPCs em chão andável, fora das saídas e sem bloquear caminhos`, () => {
    for (const n of L.npcs || []) {
      assert.ok(WALKABLE.has(L.tiles[n.ty]?.[n.tx]), `NPC "${n.id}" em bloco "${L.tiles[n.ty]?.[n.tx]}"`);
      assert.ok(!L.exits.some((ex) => inside(ex, n.tx, n.ty)), `NPC "${n.id}" em cima de uma saída`);
      assert.ok(!Object.values(L.entries).some((e) => e.x === n.tx && e.y === n.ty), `NPC "${n.id}" em cima de uma entrada`);
    }
  });

  test(`${id}: toda área andável é alcançável a partir da primeira entrada (NPCs bloqueando)`, () => {
    const npcAt = new Set((L.npcs || []).map((n) => `${n.tx},${n.ty}`));
    const start = Object.values(L.entries)[0];
    const seen = new Set([`${start.x},${start.y}`]);
    const queue = [[start.x, start.y]];
    while (queue.length) {
      const [x, y] = queue.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
        if (seen.has(k) || npcAt.has(k) || !WALKABLE.has(L.tiles[ny]?.[nx])) continue;
        seen.add(k); queue.push([nx, ny]);
      }
    }
    for (const [name, e] of Object.entries(L.entries)) assert.ok(seen.has(`${e.x},${e.y}`), `entrada "${name}" isolada`);
    for (const ex of L.exits) {
      const reach = [];
      for (let y = ex.y0 - 1; y <= ex.y1 + 1; y++) for (let x = ex.x0 - 1; x <= ex.x1 + 1; x++) reach.push(seen.has(`${x},${y}`));
      assert.ok(reach.some(Boolean), `saída para "${ex.to}" inalcançável`);
    }
  });
}

test('mapas são determinísticos (mesma semente, mesmo layout)', () => {
  for (const [id, def] of Object.entries(MAPS)) {
    assert.deepEqual(def.build().tiles, layouts[id].tiles, `${id} mudou entre duas montagens`);
  }
});
