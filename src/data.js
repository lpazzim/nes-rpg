// =====================================================================
// DADOS DO JOGO
// Tudo que define "números" do jogo fica aqui: personagens, inimigos,
// áreas de inimigos e curva de experiência. Ajuste à vontade.
// =====================================================================

export const TILE = 16;          // tamanho de cada bloco do mapa, em pixels
export const VIEW_W = 480;       // resolução interna da tela (estilo 16 bits)
export const VIEW_H = 270;

// Nome provisório do jogo (aparece na tela título)
export const GAME_TITLE = 'Ecos do Destino';

// --- Heróis -----------------------------------------------------------
// type: define o estilo de combate (katana | daggers | mage)
// speed: pixels por segundo | crit: chance de crítico (0..1)
// powerGain: quanto a barra de PODER enche a cada golpe que acerta
export const HEROES = [
  {
    id: 'kaito', type: 'katana', name: 'Kaito', role: 'Katana',
    color: '#b8322a', hair: '#1f2430',
    maxHp: 130, maxMp: 0, atk: 15, def: 7, speed: 72, crit: 0.08, powerGain: 9,
    special: 'Iaido',
    skills: ['J  Corte: golpe rapido de katana', 'K  Corte Pesado: arco azul que empurra longe', 'L  Iaido: avanca cortando tudo no caminho'],
  },
  {
    id: 'rin', type: 'daggers', name: 'Rin', role: 'Duas adagas',
    color: '#24985a', hair: '#e8d27a',
    maxHp: 100, maxMp: 0, atk: 9, def: 5, speed: 90, crit: 0.22, powerGain: 5,
    special: 'Tempestade de Laminas',
    skills: ['J  Combo: 3 golpes, o 3o e mais forte', 'K  Arremesso: 3 adagas em leque', 'L  Tempestade: redemoinho de laminas'],
  },
  {
    id: 'aster', type: 'mage', name: 'Aster', role: 'Poderes',
    color: '#5b3fa8', hair: '#f2f2f2',
    maxHp: 85, maxMp: 40, atk: 12, def: 4, speed: 68, crit: 0.05, powerGain: 7,
    special: 'Espiral Dupla',
    skills: ['J  Orbe Azul: rapido, deixa o alvo lento', 'K  Orbe Vermelho: explode em area (8 MP)', 'L  Espiral Dupla: 16 orbes ao redor'],
  },
];

// --- NPCs e diálogos ----------------------------------------------------
// speed: passeio (px/s) | radius: colisão | talkRange: alcance da tecla E
// pause: pausa entre passeios (s) | charsPerSecond: velocidade do texto
// maxChars: letras por linha (fonte bitmap de src/font.js: 6 px por letra)
export const NPC_TUNING = { speed: 25, radius: 6, talkRange: 28, pause: [1.5, 4] };
export const DIALOG = { charsPerSecond: 40, maxChars: 72, linesPerPage: 3 };

// Custos de MP e regeneração (usado pelo herói de poderes)
export const MAGE = { redCost: 8, mpRegen: 2.5 };

// --- Inimigos ---------------------------------------------------------
// sheet: folha de sprites | aggro: distância em que percebe o herói
// reach: alcance do golpe | atkCd: tempo entre ataques | scale: tamanho
export const ENEMIES = {
  scarecrow: {
    name: 'Espantalho', sheet: 'scarecrow', hp: 48, atk: 11, def: 3, speed: 40, r: 8, xp: 8, gold: 6,
    aggro: 120, reach: 24, atkCd: 1.5,
  },
  treant: {
    name: 'Treant', sheet: 'treant', hp: 75, atk: 14, def: 5, speed: 30, r: 9, xp: 12, gold: 10,
    aggro: 110, reach: 26, atkCd: 1.8, ambush: true,
  },
  knight: {
    name: 'Cavaleiro', sheet: 'knight', hp: 95, atk: 16, def: 9, speed: 36, r: 8, xp: 16, gold: 14,
    aggro: 130, reach: 26, atkCd: 1.6, blocks: true,
  },
  cyber: {
    name: 'Soldado Cibernetico', sheet: 'cyber', hp: 65, atk: 13, def: 6, speed: 42, r: 8, xp: 18, gold: 16,
    aggro: 180, reach: 120, atkCd: 1.4, ranged: true,
  },
  treantBoss: {
    name: 'Treant Anciao', sheet: 'treant', hp: 520, atk: 24, def: 10, speed: 26, r: 15, xp: 150, gold: 250,
    aggro: 170, reach: 46, atkCd: 1.6, boss: true, scale: 2,
  },
};
export const RESPAWN_TIME = 30; // segundos até uma área limpa voltar a ter inimigos

// XP necessária para passar do nível atual para o próximo
export const xpToNext = (level) => 20 + level * 18;
