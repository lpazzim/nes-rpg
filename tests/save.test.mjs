// =====================================================================
// TESTES DO SAVE: conversão dos saves antigos (v1 -> v2)
// O dono do projeto tem uma campanha em andamento: esta conversão é o
// que impede a campanha de sumir da tela título.
// =====================================================================
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { migrateSave, SAVE_VERSION } from '../src/save.js';
import { STARTER, equipBonus } from '../src/equipment.js';
import { HEROES } from '../src/data.js';

// Save v1 realista, no formato que o jogo gravava antes desta entrega
const saveV1 = () => ({
  map: 'vila', entry: 'cristal', flags: { bosque: true },
  gold: 564, inventory: { potion: 3, ether: 1, phoenix: 1 }, playTime: 228.06,
  heroes: [
    { id: 'kaito', name: 'Kaito', level: 6, xp: 104, hp: 209, mp: 0, maxHp: 209, maxMp: 0,
      atk: 25, defense: 12, speed: 72, crit: 0.08, power: 9, alive: true },
    { id: 'rin', name: 'Rin', level: 6, xp: 104, hp: 161, mp: 0, maxHp: 161, maxMp: 0,
      atk: 19, defense: 10, speed: 90, crit: 0.22, power: 100, alive: true },
    { id: 'aster', name: 'Aster', level: 6, xp: 104, hp: 136, mp: 60, maxHp: 136, maxMp: 60,
      atk: 22, defense: 9, speed: 68, crit: 0.05, power: 100, alive: true },
  ],
  v: 1, savedAt: 1794964375676,
});

test('TU-11: a campanha é preservada na conversão', () => {
  const antes = saveV1();
  const depois = migrateSave(saveV1());
  assert.equal(depois.v, SAVE_VERSION);
  // nada fora dos heróis pode mudar
  for (const k of ['map', 'entry', 'gold', 'playTime', 'savedAt']) {
    assert.deepEqual(depois[k], antes[k], `"${k}" mudou na conversão`);
  }
  assert.deepEqual(depois.flags, antes.flags);
  assert.deepEqual(depois.inventory, antes.inventory);
  assert.equal(depois.heroes.length, 3);
  for (const h of depois.heroes) {
    const old = antes.heroes.find((x) => x.id === h.id);
    assert.deepEqual([h.level, h.xp, h.hp, h.maxHp, h.power, h.alive],
      [old.level, old.xp, old.hp, old.maxHp, old.power, old.alive], `${h.id}: progresso perdido`);
    assert.equal(h.equip.weapon, STARTER[h.id], `${h.id}: sem arma inicial`);
    assert.deepEqual([h.equip.armor, h.equip.accessory], [null, null]);
  }
});

test('TU-12: a força dos heróis fica idêntica depois da conversão', () => {
  const antes = saveV1(), depois = migrateSave(saveV1());
  for (const h of depois.heroes) {
    const old = antes.heroes.find((x) => x.id === h.id);
    // os atributos do v1 viram a base...
    assert.deepEqual([h.baseAtk, h.baseDefense, h.baseSpeed, h.baseCrit, h.baseMaxMp],
      [old.atk, old.defense, old.speed, old.crit, old.maxMp], `${h.id}: base diferente`);
    // ...e a arma inicial não acrescenta nada, então o efetivo é o mesmo de antes
    const b = equipBonus(h.equip);
    assert.deepEqual([h.baseAtk + b.atk, h.baseDefense + b.defense, h.baseSpeed + b.speed,
      h.baseCrit + b.crit, h.baseMaxMp + b.maxMp],
    [old.atk, old.defense, old.speed, old.crit, old.maxMp], `${h.id}: a força mudou`);
    // os nomes antigos não sobram no save novo
    for (const k of ['atk', 'defense', 'speed', 'crit', 'maxMp']) {
      assert.equal(h[k], undefined, `${h.id}: campo antigo "${k}" ficou no save`);
    }
  }
});

test('TU-13: versão desconhecida é ignorada; save atual passa sem mexer', () => {
  assert.equal(migrateSave(null), null);
  assert.equal(migrateSave(undefined), null);
  assert.equal(migrateSave('nao e save'), null);
  assert.equal(migrateSave({ v: 99, heroes: [] }), null);
  assert.equal(migrateSave({ v: 0 }), null);
  const atual = { v: SAVE_VERSION, gold: 10, heroes: [] };
  assert.equal(migrateSave(atual), atual, 'save já atual deveria passar inalterado');
});

test('TU-13b: converter duas vezes não muda mais nada', () => {
  const uma = migrateSave(saveV1());
  assert.deepEqual(migrateSave(uma), uma);
});

test('TU-13c: save v1 sem heróis não quebra a conversão', () => {
  const r = migrateSave({ v: 1, gold: 5 });
  assert.equal(r.v, SAVE_VERSION);
  assert.deepEqual(r.heroes, []);
});

test('TU-15: Hero.toSave/loadSave guardam equipamento e atributos próprios', async () => {
  const { sheets } = await import('../src/sprites.js');
  const fakeAnim = { frames: [{}], fps: 8, loop: true, duration: 1 };
  for (const h of HEROES) sheets[h.id] = { anims: new Proxy({}, { get: () => fakeAnim, has: () => true }) };
  const { Hero } = await import('../src/heroes.js');
  const { equip } = await import('../src/equipment.js');

  const d = HEROES.find((h) => h.id === 'kaito');
  const h1 = new Hero(d, 0, 0);
  h1.baseAtk = 25; h1.level = 6;
  equip(h1, { katana_aco: 1, gibao_couro: 1 }, 'weapon', 'katana_aco');
  equip(h1, { gibao_couro: 1 }, 'armor', 'gibao_couro');
  const atkEfetivo = h1.atk, defEfetiva = h1.defense;

  const dados = h1.toSave();
  assert.deepEqual(dados.equip, { weapon: 'katana_aco', armor: 'gibao_couro', accessory: null });
  assert.equal(dados.baseAtk, 25, 'o save precisa guardar o atributo próprio, não o somado');

  const h2 = new Hero(d, 0, 0);
  h2.loadSave(dados);
  assert.deepEqual(h2.equipped, dados.equip);
  assert.deepEqual([h2.atk, h2.defense, h2.level], [atkEfetivo, defEfetiva, 6]);
});

test('TU-15b: herói carregado de um save convertido fica com a força do save v1', async () => {
  const { sheets } = await import('../src/sprites.js');
  const fakeAnim = { frames: [{}], fps: 8, loop: true, duration: 1 };
  for (const h of HEROES) sheets[h.id] = { anims: new Proxy({}, { get: () => fakeAnim, has: () => true }) };
  const { Hero } = await import('../src/heroes.js');

  const antigo = saveV1(), convertido = migrateSave(saveV1());
  for (const d of HEROES) {
    const h = new Hero(d, 0, 0);
    h.loadSave(convertido.heroes.find((x) => x.id === d.id));
    const old = antigo.heroes.find((x) => x.id === d.id);
    assert.deepEqual([h.atk, h.defense, h.speed, h.crit, h.maxMp, h.maxHp, h.level],
      [old.atk, old.defense, old.speed, old.crit, old.maxMp, old.maxHp, old.level],
      `${d.id}: força diferente depois de carregar o save convertido`);
  }
});
