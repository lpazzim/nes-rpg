// =====================================================================
// TESTES DE EQUIPAMENTO (regras puras de src/equipment.js)
// =====================================================================
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EQUIPMENT, SLOTS, DR_CAP, STARTER,
  canEquip, equipBonus, piecesFor, equip, unequip, compareStats, isEquipment,
} from '../src/equipment.js';

// herói falso: só o que as regras puras precisam
const hero = (type = 'katana', equipped = {}) => ({
  type,
  equipped: { weapon: null, armor: null, accessory: null, ...equipped },
  baseAtk: 15, baseDefense: 7, baseSpeed: 72, baseCrit: 0.08, baseMaxMp: 0,
  recalcs: 0,
  recalcEquip() { this.recalcs++; },
});
const snap = (o) => JSON.stringify(o);

test('TU-02: equipBonus soma os atributos das tres pecas', () => {
  const b = equipBonus({ weapon: 'katana_aco', armor: 'gibao_couro', accessory: 'bracelete_cobre' });
  assert.equal(b.atk, 6 + 2);          // katana 6 + bracelete 2
  assert.equal(b.defense, 6 + 2);      // gibao 6 + bracelete 2
  assert.equal(b.speed, -2);           // gibao -2
  assert.equal(b.dr, 0.05);
  assert.equal(b.power, 0);
});

test('TU-02b: espacos vazios dao bonus zero', () => {
  const b = equipBonus({ weapon: null, armor: null, accessory: null });
  for (const k of ['atk', 'defense', 'speed', 'crit', 'maxMp', 'power', 'dr']) assert.equal(b[k], 0, k);
  assert.deepEqual(equipBonus(undefined), b);
});

test('TU-02c: armas iniciais nao dao bonus nenhum', () => {
  for (const id of Object.values(STARTER)) {
    const b = equipBonus({ weapon: id });
    for (const k of ['atk', 'defense', 'speed', 'crit', 'maxMp', 'power', 'dr']) assert.equal(b[k], 0, `${id}.${k}`);
  }
});

test('TU-03: canEquip respeita o estilo da arma; armadura e acessorio servem para todos', () => {
  assert.equal(canEquip('katana', 'katana_aco'), true);
  assert.equal(canEquip('daggers', 'katana_aco'), false);
  assert.equal(canEquip('mage', 'cajado_runico'), true);
  assert.equal(canEquip('katana', 'cajado_runico'), false);
  for (const type of ['katana', 'daggers', 'mage']) {
    assert.equal(canEquip(type, 'gibao_couro'), true);
    assert.equal(canEquip(type, 'anel_impeto'), true);
  }
  assert.equal(canEquip('katana', 'nao_existe'), false);
});

test('TU-04: piecesFor lista so as compativeis que estao na bolsa', () => {
  const bag = { katana_aco: 1, adagas_afiadas: 2, gibao_couro: 1, potion: 5, botas_leves: 0 };
  assert.deepEqual(piecesFor('katana', 'weapon', bag), ['katana_aco']);
  assert.deepEqual(piecesFor('daggers', 'weapon', bag), ['adagas_afiadas']);
  assert.deepEqual(piecesFor('mage', 'weapon', bag), []);
  assert.deepEqual(piecesFor('katana', 'armor', bag), ['gibao_couro']);
  assert.deepEqual(piecesFor('katana', 'accessory', bag), []);   // botas com 0 nao contam
  assert.deepEqual(piecesFor('katana', 'weapon', {}), []);
});

test('TU-05: equipar e tirar devolve os atributos e a bolsa ao estado original', () => {
  const h = hero('katana', { weapon: 'katana_gasta' });
  const bag = { gibao_couro: 1, potion: 2 };
  const bagBefore = snap(bag), bonusBefore = snap(equipBonus(h.equipped));

  equip(h, bag, 'armor', 'gibao_couro');
  assert.equal(h.equipped.armor, 'gibao_couro');
  assert.notEqual(snap(equipBonus(h.equipped)), bonusBefore);

  unequip(h, bag, 'armor');
  assert.equal(h.equipped.armor, null);
  assert.equal(snap(equipBonus(h.equipped)), bonusBefore, 'bonus vazou ao tirar a peca');
  assert.deepEqual(bag, JSON.parse(bagBefore), 'bolsa mudou depois de equipar e tirar');
  assert.equal(h.recalcs, 2, 'recalcEquip precisa ser chamado nas duas trocas');
});

test('TU-06: trocar peca devolve a anterior para a bolsa', () => {
  const h = hero('katana', { weapon: 'katana_gasta' });
  const bag = { katana_aco: 1 };
  const r = equip(h, bag, 'weapon', 'katana_aco');
  assert.deepEqual(r, { ok: true, previous: 'katana_gasta' });
  assert.equal(h.equipped.weapon, 'katana_aco');
  assert.deepEqual(bag, { katana_gasta: 1 });
});

test('TU-06b: equipar num espaco vazio nao devolve nada', () => {
  const h = hero();
  const bag = { botas_leves: 2 };
  const r = equip(h, bag, 'accessory', 'botas_leves');
  assert.deepEqual(r, { ok: true, previous: null });
  assert.deepEqual(bag, { botas_leves: 1 });
});

test('TU-08: reducao de dano soma as pecas e respeita o teto', () => {
  assert.equal(equipBonus({ armor: 'gibao_couro' }).dr, 0.05);
  const soma = equipBonus({ armor: 'gibao_couro', accessory: 'coracao_bosque' }).dr;
  assert.ok(Math.abs(soma - 0.17) < 1e-9, `esperado 0,17 e veio ${soma}`);
  // teto: duas pecas fortes nao passam de DR_CAP
  const forte = equipBonus({ armor: 'cota_malha', accessory: 'coracao_bosque' });
  assert.ok(forte.dr <= DR_CAP);
  // nenhuma combinacao possivel passa do teto
  for (const a of Object.keys(EQUIPMENT)) {
    for (const b of Object.keys(EQUIPMENT)) {
      assert.ok(equipBonus({ armor: a, accessory: b }).dr <= DR_CAP);
    }
  }
});

test('TU-10: entradas invalidas sao recusadas sem alterar nada', () => {
  const h = hero('katana', { weapon: 'katana_gasta' });
  const bag = { katana_aco: 1, gibao_couro: 1 };
  const bagBefore = snap(bag), eqBefore = snap(h.equipped);
  const casos = [
    [equip(h, bag, 'weapon', 'nao_existe'), 'unknown'],
    [equip(h, bag, 'armor', 'katana_aco'), 'slot'],          // arma no espaco de armadura
    [equip(h, bag, 'weapon', 'adagas_afiadas'), 'style'],    // estilo errado (e nem esta na bolsa)
    [equip(h, bag, 'weapon', 'lamina_vento'), 'none'],       // compativel, mas fora da bolsa
    [unequip(h, bag, 'armor'), 'empty'],                     // espaco ja vazio
  ];
  for (const [r, reason] of casos) assert.deepEqual(r, { ok: false, reason });
  assert.equal(snap(bag), bagBefore);
  assert.equal(snap(h.equipped), eqBefore);
  assert.equal(h.recalcs, 0, 'recusa nao pode recalcular');
});

test('compareStats mostra so o que muda, com melhor/pior e os efeitos', () => {
  const h = hero('katana', { weapon: 'katana_gasta' });
  const { diffs, effects } = compareStats(h, 'armor', 'gibao_couro');
  const byKey = Object.fromEntries(diffs.map((d) => [d.key, d]));
  assert.deepEqual(Object.keys(byKey).sort(), ['defense', 'speed']);
  assert.deepEqual([byKey.defense.from, byKey.defense.to, byKey.defense.better], [7, 13, true]);
  assert.deepEqual([byKey.speed.from, byKey.speed.to, byKey.speed.better], [72, 70, false]);
  assert.deepEqual(effects, ['Reduz 5% do dano recebido']);
});

test('compareStats com id null mostra a perda ao tirar a peca', () => {
  const h = hero('katana', { weapon: 'katana_aco' });
  const { diffs } = compareStats(h, 'weapon', null);
  assert.deepEqual(diffs.map((d) => [d.key, d.from, d.to, d.better]), [['atk', 21, 15, false]]);
});

test('isEquipment separa peca de consumivel', () => {
  assert.equal(isEquipment('katana_aco'), true);
  assert.equal(isEquipment('potion'), false);
  assert.equal(isEquipment(undefined), false);
});

test('SLOTS cobre todos os espacos usados pelas pecas', () => {
  for (const [id, p] of Object.entries(EQUIPMENT)) assert.ok(SLOTS.includes(p.slot), `${id}: slot "${p.slot}"`);
});

// --- herói de verdade: atributos próprios + equipamento ----------------------
// Folhas de sprite simuladas: o teste não desenha nada, mas o Hero cria um
// Animator no construtor (mesmo truque de dialog.test.mjs).
const { sheets } = await import('../src/sprites.js');
const { HEROES } = await import('../src/data.js');
const fakeAnim = { frames: [{}], fps: 8, loop: true, duration: 1 };
for (const h of HEROES) sheets[h.id] = { anims: new Proxy({}, { get: () => fakeAnim, has: () => true }) };
const { Hero } = await import('../src/heroes.js');
const makeHero = (id) => new Hero(HEROES.find((h) => h.id === id), 0, 0);

test('TU-01: herói novo nasce com a arma inicial e com a força de sempre', () => {
  for (const d of HEROES) {
    const h = makeHero(d.id);
    assert.equal(h.equipped.weapon, STARTER[d.id], `${d.id} sem arma inicial`);
    assert.deepEqual([h.equipped.armor, h.equipped.accessory], [null, null]);
    // os atributos continuam exatamente os da tabela de dados
    assert.deepEqual(
      [h.atk, h.defense, h.speed, h.crit, h.maxMp, h.maxHp],
      [d.atk, d.def, d.speed, d.crit, d.maxMp, d.maxHp],
      `${d.id} mudou de força com a arma inicial`);
    assert.equal(h.mp, d.maxMp);
    assert.equal(h.powerGain, d.powerGain);
    assert.equal(h.damageReduction, 0);
  }
});

test('TU-01b: equipar soma no atributo efetivo sem mexer no próprio', () => {
  const h = makeHero('kaito');
  const bag = { katana_aco: 1 };
  equip(h, bag, 'weapon', 'katana_aco');
  assert.equal(h.baseAtk, 15, 'o atributo próprio não pode mudar ao equipar');
  assert.equal(h.atk, 21);
  unequip(h, bag, 'weapon');
  assert.equal(h.atk, 15);
});

test('TU-07: peça pesada não deixa o atributo cair abaixo de 1', () => {
  const h = makeHero('aster');       // velocidade 68
  h.baseSpeed = 4;                   // herói muito lento, para forçar a borda
  const bag = { cota_malha: 1 };     // -6 de velocidade
  equip(h, bag, 'armor', 'cota_malha');
  assert.equal(h.speed, 1, 'velocidade deveria parar em 1');
  assert.ok(h.speed > 0);
});

test('TU-09: o Anel do Ímpeto acelera o PODER em 30%', () => {
  const h = makeHero('kaito');
  const antes = h.powerGain;
  equip(h, { anel_impeto: 1 }, 'accessory', 'anel_impeto');
  assert.ok(Math.abs(h.powerGain - antes * 1.3) < 1e-9, `${h.powerGain} != ${antes * 1.3}`);
});

test('TU-09b: peça de MP sobe o máximo; ao tirar, o MP atual é limitado', () => {
  const h = makeHero('aster');       // 40 de MP
  const bag = { cajado_runico: 1 };
  equip(h, bag, 'weapon', 'cajado_runico');
  assert.equal(h.maxMp, 60);
  h.mp = 60;
  unequip(h, bag, 'weapon');
  assert.equal(h.maxMp, 40);
  assert.equal(h.mp, 40, 'MP atual não pode passar do novo máximo');
});

test('TU-09c: herói sem magia continua sem MP, mesmo com peça de MP', () => {
  const h = makeHero('kaito');       // maxMp 0
  equip(h, { bastao_cristal: 1 }, 'weapon', 'bastao_cristal');   // recusado: estilo errado
  assert.equal(h.maxMp, 0);
});

test('TU-14: a redução de dano desconta do golpe recebido e nunca zera', async () => {
  const { applyDamage } = await import('../src/combat-system.js');
  const game = { heroes: [], leader: null, switchLeader() {}, mode: 'play' };
  const golpe = { x: 0, y: 0, mult: 1, kb: 0, crit: 0 };
  const inimigo = { atk: 100, isHero: false };

  const semPecas = makeHero('kaito'); semPecas.invT = 0; semPecas.dashT = 0;
  game.heroes = [semPecas];
  applyDamage(game, semPecas, inimigo, golpe);
  const danoSem = semPecas.maxHp - semPecas.hp;

  const comPecas = makeHero('kaito'); comPecas.invT = 0; comPecas.dashT = 0;
  equip(comPecas, { gibao_couro: 1 }, 'armor', 'gibao_couro');
  equip(comPecas, { coracao_bosque: 1 }, 'accessory', 'coracao_bosque');
  assert.ok(Math.abs(comPecas.damageReduction - 0.17) < 1e-9);
  game.heroes = [comPecas];
  applyDamage(game, comPecas, inimigo, golpe);
  const danoCom = comPecas.maxHp - comPecas.hp;

  assert.ok(danoCom < danoSem, `com peças (${danoCom}) deveria doer menos que sem (${danoSem})`);
  assert.ok(danoCom >= 1, 'o dano nunca pode ser zero');
});

test('TU-14b: dano mínimo de 1 mesmo com redução máxima', async () => {
  const { applyDamage } = await import('../src/combat-system.js');
  const h = makeHero('kaito'); h.invT = 0; h.dashT = 0;
  equip(h, { cota_malha: 1 }, 'armor', 'cota_malha');
  equip(h, { coracao_bosque: 1 }, 'accessory', 'coracao_bosque');
  const game = { heroes: [h], leader: h, switchLeader() {}, mode: 'play' };
  applyDamage(game, h, { atk: 1, isHero: false }, { x: 0, y: 0, mult: 0.01, kb: 0, crit: 0 });
  assert.ok(h.maxHp - h.hp >= 1);
});

// --- regressão do review: recompensa de chefe não pode se perder --------------
const { pendingBossPrizes, prizeFlag, BOSS_DROP } = await import('../src/equipment.js');

test('BUG-01: a peça do chefe volta ao chão até ser pega', () => {
  const zonas = [{ boss: 'bosque', x: 20, y: 17 }, { x: 5, y: 5 }];     // chefe + zona comum
  // chefe ainda vivo: nada a restaurar
  assert.deepEqual(pendingBossPrizes({}, zonas), []);
  // chefe derrotado e peça não pega: reaparece no lugar do chefe
  assert.deepEqual(pendingBossPrizes({ bosque: true }, zonas), [{ id: BOSS_DROP.bosque, flag: 'bosque', x: 20, y: 17 }]);
  // peça já pega (ou vendida depois): não reaparece nunca mais
  assert.deepEqual(pendingBossPrizes({ bosque: true, [prizeFlag('bosque')]: true }, zonas), []);
});

test('BUG-01b: mapas sem chefe e saves antigos (chefe vencido, sem a flag nova) funcionam', () => {
  assert.deepEqual(pendingBossPrizes({ bosque: true }, [{ x: 1, y: 1 }]), []);
  // save v1 da campanha atual: bosque: true e nenhuma flag de prêmio -> ganha a peça ao reentrar
  assert.equal(pendingBossPrizes({ bosque: true }, [{ boss: 'bosque', x: 3, y: 4 }]).length, 1);
});

test('BUG-01c: a peça do chefe não expira como as curas do chão', async () => {
  const { updatePickups } = await import('../src/combat-system.js');
  const game = {
    leader: { x: 9999, y: 9999 }, heroes: [], inventory: {}, flags: {},
    pickups: [{ x: 0, y: 0, t: 0, kind: 'equip', id: 'coracao_bosque' }, { x: 0, y: 0, t: 0, kind: 'heal' }],
  };
  updatePickups(game, 60);                                  // 60 s se passam
  assert.deepEqual(game.pickups.map((p) => p.kind), ['equip']);
});

test('BUG-01d: pegar a peça a coloca na bolsa e marca a flag de prêmio', async () => {
  const { updatePickups } = await import('../src/combat-system.js');
  const game = {
    leader: { x: 0, y: 0 }, heroes: [], inventory: {}, flags: { bosque: true },
    pickups: [{ x: 0, y: 0, t: 0, kind: 'equip', id: 'coracao_bosque' }],
  };
  updatePickups(game, 0.016);
  assert.equal(game.inventory.coracao_bosque, 1);
  assert.equal(game.flags[prizeFlag('bosque')], true);
  assert.deepEqual(pendingBossPrizes(game.flags, [{ boss: 'bosque', x: 1, y: 1 }]), [], 'não pode reaparecer depois de pega');
});
