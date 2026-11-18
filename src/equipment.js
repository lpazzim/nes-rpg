// =====================================================================
// EQUIPAMENTOS: pecas, bonus e regras de equipar (logica pura, sem tela)
//
// Cada heroi tem 3 espacos: arma, armadura e acessorio. A arma so serve
// para o heroi do mesmo "style" (o type em data.js). As pecas ficam na
// mesma bolsa dos itens ({ id: quantidade }), entao a loja funciona sem
// codigo novo. O bonus NUNCA e somado ao atributo do heroi: ele e sempre
// recalculado a partir das pecas equipadas (ver recalcEquip em heroes.js).
//
// Para criar uma peca: entrada em EQUIPMENT + id no estoque de uma loja
// (SHOPS em items.js) ou em BOSS_DROP. Escreva SEM ACENTOS (canvas).
// =====================================================================

/**
 * @typedef {Object} Equipped  pecas equipadas de um heroi (null = espaco vazio)
 * @property {?string} weapon @property {?string} armor @property {?string} accessory
 *
 * @typedef {Object} EquipBonus  soma das pecas (dr ja limitado por DR_CAP)
 * @property {number} atk @property {number} defense @property {number} speed
 * @property {number} crit @property {number} maxMp
 * @property {number} power  fracao somada ao ganho de PODER (0,3 = +30%)
 * @property {number} dr     fracao do dano recebido que e descontada
 *
 * @typedef {Object} StatDiff  uma linha da comparacao na aba Equip.
 * @property {string} key @property {string} label
 * @property {number} from @property {number} to @property {boolean} better
 */

export const SLOTS = ['weapon', 'armor', 'accessory'];
export const SLOT_NAMES = { weapon: 'Arma', armor: 'Armadura', accessory: 'Acessorio' };

export const DR_CAP = 0.25;        // teto da reducao de dano somada
export const STAT_MIN = 1;         // nenhum atributo cai abaixo disso por causa de peca

// arma inicial de cada heroi (sem bonus: o jogo comeca com a forca de sempre)
export const STARTER = { kaito: 'katana_gasta', rin: 'adagas_simples', aster: 'bastao_rachado' };

// peca deixada por cada chefe (a chave e a flag da campanha)
export const BOSS_DROP = { bosque: 'coracao_bosque' };

// stats: atk | defense | speed | crit | maxMp (podem ser negativos)
// power: PODER enche mais rapido | dr: reduz o dano recebido
// shop: false -> nao entra em estoque de loja (inicial ou recompensa)
export const EQUIPMENT = {
  // --- armas: Kaito (katana) ---
  katana_gasta: {
    name: 'Katana Gasta', slot: 'weapon', style: 'katana', price: 60, shop: false,
    desc: 'A katana de treino de Kaito. Cumpre o seu papel.',
  },
  katana_aco: {
    name: 'Katana de Aco', slot: 'weapon', style: 'katana', price: 150,
    desc: 'Lamina firme e bem balanceada.', stats: { atk: 6 },
  },
  lamina_vento: {
    name: 'Lamina do Vento', slot: 'weapon', style: 'katana', price: 450,
    desc: 'Leve como uma rajada; corta antes de ser vista.', stats: { atk: 12, speed: 4 },
  },

  // --- armas: Rin (adagas) ---
  adagas_simples: {
    name: 'Adagas Simples', slot: 'weapon', style: 'daggers', price: 60, shop: false,
    desc: 'O par de adagas que Rin trouxe de casa.',
  },
  adagas_afiadas: {
    name: 'Adagas Afiadas', slot: 'weapon', style: 'daggers', price: 150,
    desc: 'Fio tao fino que acha qualquer brecha.', stats: { atk: 4, crit: 0.04 },
  },
  garras_gemeas: {
    name: 'Garras Gemeas', slot: 'weapon', style: 'daggers', price: 450,
    desc: 'Duas laminas curvas feitas para o golpe certeiro.', stats: { atk: 8, crit: 0.08 },
  },

  // --- armas: Aster (poderes) ---
  bastao_rachado: {
    name: 'Bastao Rachado', slot: 'weapon', style: 'mage', price: 60, shop: false,
    desc: 'Velho bastao de aprendiz, com uma trinca no topo.',
  },
  bastao_cristal: {
    name: 'Bastao de Cristal', slot: 'weapon', style: 'mage', price: 150,
    desc: 'O cristal guarda um pouco de energia extra.', stats: { atk: 5, maxMp: 10 },
  },
  cajado_runico: {
    name: 'Cajado Runico', slot: 'weapon', style: 'mage', price: 450,
    desc: 'Runas antigas brilham a cada conjuracao.', stats: { atk: 9, maxMp: 20 },
  },

  // --- armaduras ---
  tunica_viajante: {
    name: 'Tunica de Viajante', slot: 'armor', price: 90,
    desc: 'Tecido reforcado, bom para a estrada.', stats: { defense: 3 },
  },
  gibao_couro: {
    name: 'Gibao de Couro', slot: 'armor', price: 220,
    desc: 'Pesa um pouco, mas apara os golpes.', stats: { defense: 6, speed: -2 }, dr: 0.05,
  },
  manto_elfico: {
    name: 'Manto Elfico', slot: 'armor', price: 380,
    desc: 'Leve e solto; os passos ficam mais rapidos.', stats: { defense: 5, speed: 6 },
  },
  cota_malha: {
    name: 'Cota de Malha', slot: 'armor', price: 500,
    desc: 'Protecao pesada de aneis de metal.', stats: { defense: 11, speed: -6 }, dr: 0.08,
  },

  // --- acessorios ---
  bracelete_cobre: {
    name: 'Bracelete de Cobre', slot: 'accessory', price: 100,
    desc: 'Simples, mas firma o golpe e a guarda.', stats: { atk: 2, defense: 2 },
  },
  botas_leves: {
    name: 'Botas Leves', slot: 'accessory', price: 180,
    desc: 'Correr com elas quase nao cansa.', stats: { speed: 8 },
  },
  anel_impeto: {
    name: 'Anel do Impeto', slot: 'accessory', price: 320,
    desc: 'A barra de PODER enche 30% mais rapido.', power: 0.3,
  },
  coracao_bosque: {
    name: 'Coracao do Bosque', slot: 'accessory', price: 300, shop: false,
    desc: 'Pulsa com a forca do Treant Anciao.', stats: { defense: 4, crit: 0.05 }, dr: 0.12,
  },
};

// nomes dos atributos na comparacao (a ordem e a que aparece na tela)
const STAT_LABELS = { atk: 'Ataque', defense: 'Defesa', speed: 'Velocidade', crit: 'Critico', maxMp: 'MP maximo' };
const STAT_KEYS = Object.keys(STAT_LABELS);
const EMPTY_BONUS = { atk: 0, defense: 0, speed: 0, crit: 0, maxMp: 0, power: 0, dr: 0 };

export const isEquipment = (id) => !!EQUIPMENT[id];

// A flag "premio_<chefe>" marca que a recompensa JA foi pega (vai para o save).
// Sem ela, a peca volta ao chao quando o jogador reentra na arena: o chefe nao
// renasce, entao perder a peca (expirou ou saiu do mapa) seria definitivo.
export const prizeFlag = (bossFlag) => `premio_${bossFlag}`;

/**
 * Recompensas de chefe que ainda precisam aparecer no chao deste mapa.
 * @param {Object<string, boolean>} flags  flags da campanha
 * @param {Array<{boss?: string, x: number, y: number}>} zones  zonas do mapa (todas, sem filtrar)
 * @returns {Array<{ id: string, flag: string, x: number, y: number }>}  x, y em blocos
 */
export function pendingBossPrizes(flags, zones) {
  const out = [];
  for (const z of zones) {
    const id = z.boss && BOSS_DROP[z.boss];
    if (id && flags[z.boss] && !flags[prizeFlag(z.boss)]) out.push({ id, flag: z.boss, x: z.x, y: z.y });
  }
  return out;
}

/** O heroi deste tipo pode usar a peca? (armadura e acessorio servem para todos) */
export function canEquip(heroType, id) {
  const p = EQUIPMENT[id];
  if (!p) return false;
  return p.slot === 'weapon' ? p.style === heroType : true;
}

/** @param {Equipped} equipped @returns {EquipBonus} */
export function equipBonus(equipped) {
  const total = { ...EMPTY_BONUS };
  for (const slot of SLOTS) {
    const p = EQUIPMENT[equipped?.[slot]];
    if (!p) continue;
    for (const k of STAT_KEYS) total[k] += p.stats?.[k] ?? 0;
    total.power += p.power ?? 0;
    total.dr += p.dr ?? 0;
  }
  total.dr = Math.min(DR_CAP, total.dr);
  return total;
}

/** Ids compativeis daquele espaco que estao na bolsa (ordem da tabela) */
export function piecesFor(heroType, slot, inventory = {}) {
  return Object.keys(EQUIPMENT).filter((id) =>
    EQUIPMENT[id].slot === slot && canEquip(heroType, id) && inventory[id] > 0);
}

/**
 * Equipa uma peca da bolsa. A peca anterior volta para a bolsa.
 * Nao altera nada quando devolve ok: false.
 * @returns {{ ok: boolean, previous?: ?string, reason?: string }}
 */
export function equip(hero, inventory, slot, id) {
  const p = EQUIPMENT[id];
  if (!p) return { ok: false, reason: 'unknown' };
  if (p.slot !== slot) return { ok: false, reason: 'slot' };
  if (!canEquip(hero.type, id)) return { ok: false, reason: 'style' };
  if (!inventory[id]) return { ok: false, reason: 'none' };

  if (--inventory[id] <= 0) delete inventory[id];
  const previous = hero.equipped[slot] ?? null;
  if (previous) inventory[previous] = (inventory[previous] || 0) + 1;
  hero.equipped[slot] = id;
  hero.recalcEquip?.();
  return { ok: true, previous };
}

/** Tira a peca do espaco e devolve para a bolsa. */
export function unequip(hero, inventory, slot) {
  const previous = hero.equipped[slot] ?? null;
  if (!previous) return { ok: false, reason: 'empty' };
  inventory[previous] = (inventory[previous] || 0) + 1;
  hero.equipped[slot] = null;
  hero.recalcEquip?.();
  return { ok: true, previous };
}

/**
 * Comparacao mostrada antes de confirmar: so os atributos que mudam.
 * id null = tirar a peca atual.
 * @returns {{ diffs: StatDiff[], effects: string[] }}
 */
export function compareStats(hero, slot, id) {
  const next = { ...hero.equipped, [slot]: id ?? null };
  const before = equipBonus(hero.equipped), after = equipBonus(next);
  const diffs = [];
  for (const k of STAT_KEYS) {
    if (before[k] === after[k]) continue;
    const base = statBase(hero, k);
    diffs.push({
      key: k, label: STAT_LABELS[k],
      from: statValue(base, before[k], k), to: statValue(base, after[k], k),
      better: after[k] > before[k],
    });
  }
  const effects = [];
  const p = EQUIPMENT[id];
  if (p?.power) effects.push(`PODER enche ${Math.round(p.power * 100)}% mais rapido`);
  if (p?.dr) effects.push(`Reduz ${Math.round(p.dr * 100)}% do dano recebido`);
  return { diffs, effects };
}

// valor base do heroi para um atributo (sem equipamento)
function statBase(hero, key) {
  const map = { atk: 'baseAtk', defense: 'baseDefense', speed: 'baseSpeed', crit: 'baseCrit', maxMp: 'baseMaxMp' };
  return hero[map[key]] ?? 0;
}

/** Valor efetivo de um atributo: nunca abaixo de STAT_MIN (crit pode ser 0). */
export function statValue(base, bonus, key) {
  const v = base + bonus;
  if (key === 'crit') return Math.max(0, v);
  if (key === 'maxMp') return Math.max(0, v);   // heroi sem magia continua com 0
  return Math.max(STAT_MIN, v);
}
