// =====================================================================
// CONFIGURAÇÃO DOS SPRITES
//
// Para cada folha: arquivo de origem, divisões de quadros grudados
// (splits) e as animações. Os números são os quadros mostrados na prévia:
//
//   node tools/detect-frames.js <nome> prévia.png
//
// f = quadros em ordem | fps = velocidade | loop = repete (padrão: true)
// Todas as poses "de lado" olham para a DIREITA (o jogo espelha para a esquerda).
// =====================================================================
module.exports = {
  scale: 2,      // a arte usa "pixels" de 2x2 -> divide por 2 = pixel nítido
  colors: 40,    // cores por personagem

  sheets: {
    // ------------------------------------------------------------ HERÓIS
    aster: {
      file: 'assets/source/aster_sheet.webp',
      anims: {
        idle_down:  { f: [0, 1], fps: 2 },
        walk_down:  { f: [2, 3, 4, 5], fps: 8 },
        idle_up:    { f: [6, 7, 8, 7], fps: 3 },
        walk_up:    { f: [13, 14, 15, 16], fps: 8 },
        idle_side:  { f: [9, 10, 11, 10], fps: 3 },
        walk_side:  { f: [17, 18, 19, 20], fps: 10 },
        attack:     { f: [39, 40, 40], fps: 14, loop: false },           // orbe azul
        skill:      { f: [37, 38, 38], fps: 12, loop: false },           // orbe vermelho
        special:    { f: [45, 46, 47, 48, 49, 41, 42, 42], fps: 12, loop: false },
        hurt:       { f: [56, 57], fps: 10, loop: false },
        death:      { f: [62, 63, 64, 65, 66, 67], fps: 8, loop: false },
      },
    },
    rin: {
      file: 'assets/source/rin_sheet.webp',
      splits: { 37: 2 },
      anims: {
        idle_down:  { f: [0, 1], fps: 2 },
        walk_down:  { f: [2, 3, 4, 3], fps: 8 },
        idle_up:    { f: [5, 6], fps: 2 },
        walk_up:    { f: [6, 7, 8, 7], fps: 8 },
        idle_side:  { f: [9, 9, 31, 31], fps: 2 },
        walk_side:  { f: [18, 19, 20, 19], fps: 12 },
        attack:     { f: [32, 33], fps: 16, loop: false },               // golpes 1 e 2
        attack3:    { f: [37, 38, 40], fps: 14, loop: false },           // 3º golpe do combo
        skill:      { f: [41, 42], fps: 12, loop: false },               // arremesso
        special:    { f: [45, 46, 47, 48], fps: 14 },                    // redemoinho (loop)
        hurt:       { f: [54, 55], fps: 10, loop: false },
        death:      { f: [61, 62, 63, 64, 65], fps: 8, loop: false },
      },
    },
    kaito: {
      file: 'assets/source/kaito_sheet.webp',
      anims: {
        idle_down:  { f: [0, 2], fps: 2 },
        walk_down:  { f: [5, 6], fps: 6 },
        idle_up:    { f: [4], fps: 1 },
        walk_up:    { f: [7, 8], fps: 6 },
        idle_side:  { f: [9, 32], fps: 2 },
        walk_side:  { f: [17, 18, 19, 20], fps: 10 },
        attack:     { f: [36, 37, 38], fps: 16, loop: false },           // corte
        skill:      { f: [40, 41, 42, 43], fps: 14, loop: false },       // corte pesado
        special:    { f: [46, 47, 48, 49], fps: 14, loop: false },       // Iaido
        hurt:       { f: [57, 58], fps: 10, loop: false },
        death:      { f: [60, 61, 62, 63, 64], fps: 8, loop: false },
      },
    },

    // ---------------------------------------------------------- INIMIGOS
    treant: {
      file: 'assets/source/treant_sheet.png',
      anims: {
        idle:    { f: [0, 1, 2, 3, 4, 5], fps: 5 },
        walk:    { f: [6, 7, 8, 9, 10, 11], fps: 7 },
        attack:  { f: [20, 21, 22, 22], fps: 9, loop: false, hit: 1 },   // garra
        roots:   { f: [23, 24, 25, 26, 27], fps: 8, loop: false, hit: 2 },// raízes (área)
        hidden:  { f: [31, 32], fps: 1 },                                 // disfarçado de toco
        emerge:  { f: [33, 34], fps: 6, loop: false },
        hurt:    { f: [36, 37], fps: 10, loop: false },
        death:   { f: [44, 42, 43, 47, 48, 49], fps: 8, loop: false },
      },
    },
    scarecrow: {
      file: 'assets/source/scarecrow_sheet.png',
      anims: {
        idle:    { f: [1, 2], fps: 2 },
        walk:    { f: [18, 19, 20], fps: 8 },
        attack:  { f: [27, 28, 29, 30, 30], fps: 10, loop: false, hit: 3 },
        jump:    { f: [23, 24, 22], fps: 8, loop: false, hit: 2 },
        hurt:    { f: [39, 40], fps: 10, loop: false },
        death:   { f: [43, 44, 45, 46, 47, 48, 49, 50], fps: 9, loop: false },
      },
    },
    knight: {
      file: 'assets/source/knight_sheet.png',
      splits: { 30: 3 },
      anims: {
        idle:    { f: [0, 1], fps: 2 },
        walk:    { f: [15, 17, 18, 19], fps: 8 },
        attack:  { f: [27, 29, 29], fps: 9, loop: false, hit: 1 },       // corte em arco
        block:   { f: [34, 35, 36, 37], fps: 10 },
        hurt:    { f: [42, 43], fps: 10, loop: false },
        death:   { f: [46, 47, 48, 49, 50, 51], fps: 9, loop: false },
      },
    },
    cyber: {
      file: 'assets/source/cyber_sheet.png',
      splits: { 28: 2, 32: 3, 34: 2 },
      anims: {
        idle:    { f: [3, 4], fps: 2 },
        walk:    { f: [15, 16, 17, 16], fps: 8 },
        attack:  { f: [27, 28, 29, 27], fps: 10, loop: false, hit: 1 },  // tiro
        shield:  { f: [37, 38, 39, 40], fps: 10 },
        hurt:    { f: [41, 42], fps: 12, loop: false },
        death:   { f: [46, 47, 48, 49, 50, 51, 52], fps: 9, loop: false },
        bolt:    { f: [36], fps: 1 },                                     // projétil azul
      },
    },

    // -------------------------------------------------------------- NPCs
    // Folha com 12 NPCs (3 linhas x 4), cada um com 4 poses: frente, frente
    // alternativa, costas, lado. Animações nomeadas "<npc>.<animação>".
    npcs: {
      file: 'assets/source/npcs_sheet.webp',
      colors: 96,          // 12 personagens dividem a mesma paleta
      dropAbove: true,     // a folha tem o nome escrito acima de cada NPC
      anims: npcAnims([
        'mercador_fazenda', 'estalajadeira', 'velho_agricultor', 'aprendiz',     // fazenda
        'alquimista', 'estalajadeiro', 'soldado_patrulha', 'dama',               // medieval
        'negociante', 'bartender', 'cientista', 'soldado_corp',                  // futurista
      ]),
    },
  },
};

// Gera as 6 animações de NPC a partir da ordem na folha (4 quadros por NPC).
// Só há um quadro de costas e um de lado: o jogo acrescenta o balanço do passo.
function npcAnims(ids) {
  const out = {};
  ids.forEach((id, i) => {
    const b = i * 4;
    Object.assign(out, {
      [`${id}.idle_down`]: { f: [b, b + 1], fps: 1.5 },
      [`${id}.walk_down`]: { f: [b, b + 1], fps: 4 },
      [`${id}.idle_up`]:   { f: [b + 2], fps: 1 },
      [`${id}.walk_up`]:   { f: [b + 2], fps: 1 },
      [`${id}.idle_side`]: { f: [b + 3], fps: 1 },
      [`${id}.walk_side`]: { f: [b + 3], fps: 1 },
    });
  });
  return out;
}
