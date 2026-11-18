// =====================================================================
// ITENS
// use(heroi) devolve um texto de resultado, ou false se não fez efeito.
// =====================================================================

export const ITEMS = {
  potion: {
    name: 'Pocao', price: 30, desc: 'Recupera 60 HP de um aliado.',
    use(h) {
      if (!h.alive || h.hp >= h.maxHp) return false;
      h.hp = Math.min(h.maxHp, h.hp + 60); return '+60 HP';
    },
  },
  hipotion: {
    name: 'Pocao Forte', price: 90, desc: 'Recupera 200 HP de um aliado.',
    use(h) {
      if (!h.alive || h.hp >= h.maxHp) return false;
      h.hp = Math.min(h.maxHp, h.hp + 200); return '+200 HP';
    },
  },
  ether: {
    name: 'Eter', price: 60, desc: 'Recupera 30 MP (so quem usa magia).',
    use(h) {
      if (!h.alive || h.maxMp === 0 || h.mp >= h.maxMp) return false;
      h.mp = Math.min(h.maxMp, h.mp + 30); return '+30 MP';
    },
  },
  phoenix: {
    name: 'Pena de Fenix', price: 150, desc: 'Revive um aliado caido com 50% do HP.',
    use(h) {
      if (h.alive) return false;
      h.alive = true; h.hp = Math.round(h.maxHp / 2); return 'Reviveu!';
    },
  },
};

export const ITEM_ORDER = ['potion', 'hipotion', 'ether', 'phoenix'];
export const START_INVENTORY = { potion: 3, ether: 1, phoenix: 1 };
export const START_GOLD = 50;

// ---------------------------------------------------------------------
// LOJAS E ESTALAGENS (a chave é o id do NPC, o mesmo de DIALOGUES)
// ---------------------------------------------------------------------
export const MAX_STACK = 99;   // limite de cada item na bolsa
export const SELL_RATE = 0.5;  // venda = preço x 0,5, arredondado para baixo

export const SHOPS = {
  mercador_fazenda: { name: 'Loja da Pradaria', stock: ['potion', 'hipotion', 'ether', 'phoenix'] },
};

export const INNS = {
  estalajadeira: { price: 20 },
};
