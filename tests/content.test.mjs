// Integridade do conteúdo: sprites gerados x dados do jogo, itens e skills.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { HEROES, ENEMIES } from '../src/data.js';
import { ITEMS, ITEM_ORDER, START_INVENTORY } from '../src/items.js';
import { DIALOGUES } from '../src/dialogues.js';

const sprites = JSON.parse(readFileSync(new URL('../assets/sprites/sprites.json', import.meta.url)));

const HERO_ANIMS = ['idle_down', 'walk_down', 'idle_up', 'walk_up', 'idle_side', 'walk_side',
  'attack', 'skill', 'special', 'hurt', 'death'];
const ENEMY_ANIMS = ['idle', 'walk', 'attack', 'hurt', 'death'];
// animações exigidas por comportamentos específicos (ver src/enemies.js)
const behaviorAnims = (d) => [
  ...(d.ambush ? ['hidden', 'emerge'] : []),
  ...(d.blocks ? ['block'] : []),
  ...(d.ranged ? ['bolt', 'shield'] : []),
  ...(d.sheet === 'treant' ? ['roots'] : []),
];

const checkSheet = (name, required) => {
  const s = sprites[name];
  assert.ok(s, `folha "${name}" não está em assets/sprites/sprites.json (rode npm run sprites)`);
  for (const a of required) assert.ok(s.anims[a], `"${name}" sem a animação "${a}"`);
  for (const [a, def] of Object.entries(s.anims)) {
    for (const f of def.frames) assert.ok(s.frames[f], `"${name}.${a}" aponta para quadro inexistente ${f}`);
    if (def.hit !== undefined) assert.ok(def.hit < def.frames.length, `"${name}.${a}" tem hit fora da animação`);
  }
};

test('cada herói tem todas as animações obrigatórias', () => {
  for (const h of HEROES) checkSheet(h.id, HERO_ANIMS);
});

test('cada inimigo tem as animações do seu comportamento', () => {
  for (const d of Object.values(ENEMIES)) checkSheet(d.sheet, [...ENEMY_ANIMS, ...behaviorAnims(d)]);
});

test('cada NPC da folha "npcs" tem as 6 animações de movimento', () => {
  const NPC_ANIMS = ['idle_down', 'walk_down', 'idle_up', 'walk_up', 'idle_side', 'walk_side'];
  const ids = new Set(Object.keys(sprites.npcs.anims).map((k) => k.split('.')[0]));
  assert.ok(ids.size >= 12, `esperava 12 NPCs, achei ${ids.size}`);
  for (const id of ids) checkSheet('npcs', NPC_ANIMS.map((a) => `${id}.${a}`));
});

const VILLAGE_NPCS = ['mercador_fazenda', 'estalajadeira', 'velho_agricultor', 'aprendiz'];
const allSays = (v) => [...(v.say || []), ...(v.ask?.options || []).flatMap((o) => o.say || [])];

test('TI-03: falas válidas (texto, 2 a 4 opções, rótulos curtos, sem acentos)', () => {
  for (const [id, d] of Object.entries(DIALOGUES)) {
    assert.ok(d.name && d.talk.length, `${id} sem nome ou falas`);
    assert.ok(!d.talk[d.talk.length - 1].if, `${id}: a última versão deve ser a padrão (sem "if")`);
    for (const v of d.talk) {
      assert.ok(v.say?.length, `${id}: versão sem falas`);
      for (const s of allSays(v)) assert.ok(/^[\x20-\x7E]+$/.test(s), `${id}: fala com acento ou caractere especial: "${s}"`);
      if (!v.ask) continue;
      assert.ok(v.ask.options.length >= 2 && v.ask.options.length <= 4, `${id}: precisa de 2 a 4 opções`);
      for (const o of v.ask.options) assert.ok(o.label.length <= 12, `${id}: rótulo longo "${o.label}"`);
    }
  }
});

test('TI-04: cada NPC da vila fala diferente depois de vencer o chefe (bosque)', () => {
  for (const id of VILLAGE_NPCS) {
    const after = DIALOGUES[id].talk.find((v) => v.if === 'bosque');
    const before = DIALOGUES[id].talk.find((v) => !v.if);
    assert.ok(after, `${id} sem versão "bosque"`);
    assert.notDeepEqual(after.say, before.say);
  }
});

test('TI-05: Velho Agricultor e Jovem Aprendiz dão dicas sobre floresta, caverna ou cristal', () => {
  for (const id of ['velho_agricultor', 'aprendiz']) {
    const text = DIALOGUES[id].talk.flatMap(allSays).join(' ').toLowerCase();
    assert.ok(/floresta|caverna|cristal/.test(text), `${id} sem dica`);
  }
});

test('TI-04: opções do Mercador e da Estalajadeira têm ações conhecidas e dados de loja/estalagem', async () => {
  const { SHOPS, INNS } = await import('../src/items.js');
  const opts = (id) => DIALOGUES[id].talk.find((v) => !v.if).ask.options;
  assert.deepEqual(opts('mercador_fazenda').map((o) => o.label), ['Comprar', 'Vender', 'Sair']);
  assert.deepEqual(opts('estalajadeira').map((o) => o.label), ['Descansar', 'Sair']);
  assert.deepEqual(opts('mercador_fazenda').map((o) => o.action), ['shop', 'sell', undefined]);
  assert.deepEqual(opts('estalajadeira').map((o) => o.action), ['inn', undefined]);
  assert.ok(SHOPS.mercador_fazenda, 'Mercador sem loja em SHOPS');
  assert.ok(INNS.estalajadeira, 'Estalajadeira sem estalagem em INNS');
});

test('cada inimigo tem os atributos obrigatórios', () => {
  for (const [id, d] of Object.entries(ENEMIES)) {
    for (const k of ['name', 'sheet', 'hp', 'atk', 'def', 'speed', 'r', 'xp', 'gold', 'aggro', 'reach', 'atkCd']) {
      assert.ok(d[k] !== undefined, `inimigo "${id}" sem "${k}"`);
    }
  }
});

test('itens iniciais e a ordem do menu usam itens existentes', () => {
  for (const id of [...ITEM_ORDER, ...Object.keys(START_INVENTORY)]) assert.ok(ITEMS[id], `item "${id}" não existe`);
});

test('poção cura sem passar do máximo e não age em herói caído', () => {
  const hero = { alive: true, hp: 90, maxHp: 100, mp: 0, maxMp: 0 };
  assert.equal(ITEMS.potion.use(hero), '+60 HP');
  assert.equal(hero.hp, 100);
  assert.equal(ITEMS.potion.use({ ...hero, alive: false }), false);
});

test('pena de fênix só revive quem caiu', () => {
  const fallen = { alive: false, hp: 0, maxHp: 80 };
  assert.ok(ITEMS.phoenix.use(fallen));
  assert.deepEqual([fallen.alive, fallen.hp], [true, 40]);
  assert.equal(ITEMS.phoenix.use({ alive: true, hp: 10, maxHp: 80 }), false);
});

test('.claude/skills está sincronizado com .agents/skills (npm run skills:sync)', () => {
  const root = new URL('..', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
  const walk = (dir) => readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p).map((x) => join(f, x)) : [f];
  });
  const src = join(root, '.agents/skills'), dst = join(root, '.claude/skills');
  for (const f of walk(src)) {
    assert.ok(existsSync(join(dst, f)), `falta .claude/skills/${f}`);
    assert.equal(readFileSync(join(dst, f), 'utf8'), readFileSync(join(src, f), 'utf8'), `.claude/skills/${f} desatualizado`);
  }
});

// --- lojas e estalagens (TI-03) --------------------------------------------
test('TI-03: estoques apontam para itens válidos e a vila vende os 4 itens', async () => {
  const { SHOPS, INNS, ITEMS: I } = await import('../src/items.js');
  const { DIALOGUES } = await import('../src/dialogues.js');
  for (const [npc, shop] of Object.entries(SHOPS)) {
    assert.ok(DIALOGUES[npc], `loja "${npc}" sem NPC em DIALOGUES`);
    assert.ok(shop.name && !/[^\x20-\x7e]/.test(shop.name), `nome da loja "${npc}" vazio ou com acento`);
    assert.ok(shop.stock.length > 0 && shop.stock.length <= 8, `estoque de "${npc}" fora de 1..8 itens`);
    for (const id of shop.stock) {
      assert.ok(I[id], `item "${id}" não existe`);
      assert.ok(Number.isInteger(I[id].price) && I[id].price > 0, `preço de "${id}" inválido`);
    }
  }
  for (const [npc, inn] of Object.entries(INNS)) {
    assert.ok(DIALOGUES[npc], `estalagem "${npc}" sem NPC em DIALOGUES`);
    assert.ok(Number.isInteger(inn.price) && inn.price > 0, `preço da estalagem "${npc}" inválido`);
  }
  assert.deepEqual([...SHOPS.mercador_fazenda.stock].sort(), ['ether', 'hipotion', 'phoenix', 'potion']);
  assert.equal(INNS.estalajadeira.price, 20);
});

// --- estalagem (TI-04 completo e TI-05 da loja-e-estalagem) -------------------
test('TI-04: nenhuma ação de conversa fora de shop/sell/inn (nem "soon")', () => {
  const known = new Set(['shop', 'sell', 'inn']);
  for (const [id, def] of Object.entries(DIALOGUES)) {
    for (const v of def.talk) {
      for (const o of v.ask?.options ?? []) assert.ok(!o.action || known.has(o.action), `${id}: ação "${o.action}" desconhecida`);
    }
  }
});

test('TI-05 (loja): INN_LINES sem acentos e a oferta leva o preço', async () => {
  const { INN_LINES } = await import('../src/dialogues.js');
  for (const [k, v] of Object.entries(INN_LINES)) assert.ok(!/[^ -~]/.test(v), `INN_LINES.${k} tem acento`);
  assert.ok(INN_LINES.offer.includes('{price}'));
});
