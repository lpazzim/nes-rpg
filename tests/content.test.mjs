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
test('TI-03: estoques apontam para itens ou pecas validas; a vila vende os dois', async () => {
  const { SHOPS, INNS, ITEMS: I, findItem } = await import('../src/items.js');
  const { EQUIPMENT, isEquipment } = await import('../src/equipment.js');
  const { DIALOGUES } = await import('../src/dialogues.js');
  for (const [npc, shop] of Object.entries(SHOPS)) {
    assert.ok(DIALOGUES[npc], `loja "${npc}" sem NPC em DIALOGUES`);
    assert.ok(shop.name && !/[^ -~]/.test(shop.name), `nome da loja "${npc}" vazio ou com acento`);
    assert.ok(shop.stock.length > 0, `loja "${npc}" sem estoque`);
    for (const id of shop.stock) {
      const it = findItem(id);
      assert.ok(it, `item "${id}" nao existe`);
      assert.ok(Number.isInteger(it.price) && it.price > 0, `preco de "${id}" invalido`);
      // pecas marcadas shop:false (iniciais e recompensas) nao podem estar a venda
      if (isEquipment(id)) assert.notEqual(EQUIPMENT[id].shop, false, `"${id}" nao deveria estar a venda`);
    }
    assert.equal(new Set(shop.stock).size, shop.stock.length, `loja "${npc}" com item repetido`);
  }
  for (const [npc, inn] of Object.entries(INNS)) {
    assert.ok(DIALOGUES[npc], `estalagem "${npc}" sem NPC em DIALOGUES`);
    assert.ok(Number.isInteger(inn.price) && inn.price > 0, `preco da estalagem "${npc}" invalido`);
  }
  const vila = SHOPS.mercador_fazenda.stock;
  for (const id of ['potion', 'hipotion', 'ether', 'phoenix']) assert.ok(vila.includes(id), `vila sem "${id}"`);
  assert.ok(vila.some(isEquipment), 'a vila precisa vender ao menos uma peca de equipamento');
  assert.equal(INNS.estalajadeira.price, 20);
});

test('TI-04: a peca de recompensa do chefe existe e a flag e de uma zona de chefe', async () => {
  const { BOSS_DROP, EQUIPMENT } = await import('../src/equipment.js');
  const { MAPS } = await import('../src/maps/index.js');
  const flagsDeChefe = new Set();
  for (const def of Object.values(MAPS)) {
    for (const z of def.build().zones ?? []) if (z.boss) flagsDeChefe.add(z.boss);
  }
  for (const [flag, id] of Object.entries(BOSS_DROP)) {
    assert.ok(EQUIPMENT[id], `recompensa "${id}" nao existe`);
    assert.equal(EQUIPMENT[id].shop, false, `recompensa "${id}" nao deveria estar a venda`);
    assert.ok(flagsDeChefe.has(flag), `flag "${flag}" nao pertence a nenhuma zona de chefe`);
  }
});

// --- estalagem (TI-04 completo e TI-05 da loja-e-estalagem) -------------------
test('TI-06: nenhuma ação de conversa fora de shop/sell/inn (nem "soon")', () => {
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

// --- equipamentos (TI-01, TI-02, TI-05) --------------------------------------
test('TI-01: toda peca tem nome sem acentos, slot valido, preco inteiro e descricao', async () => {
  const { EQUIPMENT, SLOTS } = await import('../src/equipment.js');
  const STYLES = HEROES.map((h) => h.type);
  for (const [id, p] of Object.entries(EQUIPMENT)) {
    assert.ok(/^[a-z0-9_]+$/.test(id), `id "${id}" fora do padrao`);
    assert.ok(p.name && !/[^\x20-\x7e]/.test(p.name), `nome de "${id}" vazio ou com acento`);
    assert.ok(p.desc && !/[^\x20-\x7e]/.test(p.desc), `descricao de "${id}" vazia ou com acento`);
    assert.ok(SLOTS.includes(p.slot), `slot de "${id}" invalido`);
    assert.ok(Number.isInteger(p.price) && p.price > 0, `preco de "${id}" invalido`);
    if (p.slot === 'weapon') assert.ok(STYLES.includes(p.style), `arma "${id}" sem estilo valido`);
    else assert.equal(p.style, undefined, `"${id}" nao e arma e nao deveria ter estilo`);
    for (const k of Object.keys(p.stats ?? {})) {
      assert.ok(['atk', 'defense', 'speed', 'crit', 'maxMp'].includes(k), `"${id}" altera atributo desconhecido "${k}"`);
    }
  }
});

test('TI-02: todo heroi tem arma inicial propria, sem bonus', async () => {
  const { EQUIPMENT, STARTER, equipBonus, canEquip } = await import('../src/equipment.js');
  for (const h of HEROES) {
    const id = STARTER[h.id];
    assert.ok(id && EQUIPMENT[id], `heroi "${h.id}" sem arma inicial`);
    assert.equal(EQUIPMENT[id].slot, 'weapon');
    assert.ok(canEquip(h.type, id), `arma inicial de "${h.id}" nao e do estilo dele`);
    const b = equipBonus({ weapon: id });
    for (const k of ['atk', 'defense', 'speed', 'crit', 'maxMp', 'power', 'dr']) {
      assert.equal(b[k], 0, `arma inicial de "${h.id}" nao pode dar bonus (${k})`);
    }
  }
  // cada estilo de heroi tem pelo menos uma arma comprável
  for (const h of HEROES) {
    const compraveis = Object.values(EQUIPMENT).filter((p) => p.slot === 'weapon' && p.style === h.type && p.shop !== false);
    assert.ok(compraveis.length >= 1, `nenhuma arma a venda para "${h.id}"`);
  }
});

test('TI-05: nenhuma peca passa do teto de reducao nem zera um atributo do heroi', async () => {
  const { EQUIPMENT, DR_CAP } = await import('../src/equipment.js');
  for (const [id, p] of Object.entries(EQUIPMENT)) {
    assert.ok((p.dr ?? 0) <= DR_CAP, `"${id}" sozinha passa do teto de reducao`);
    assert.ok((p.power ?? 0) <= 1, `"${id}" dobra o PODER sozinha`);
    for (const h of HEROES) {
      const base = { atk: h.atk, defense: h.def, speed: h.speed, crit: h.crit, maxMp: h.maxMp };
      for (const [k, v] of Object.entries(p.stats ?? {})) {
        if (v >= 0) continue;
        assert.ok(base[k] + v >= 1 || k === 'maxMp' || k === 'crit',
          `"${id}" zera "${k}" do heroi "${h.id}" (${base[k]} ${v})`);
      }
    }
  }
});
