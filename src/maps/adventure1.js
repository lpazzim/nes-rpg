// =====================================================================
// AVENTURA 1 — O BOSQUE ANCIÃO
//   Vila de Pradaria  ->  Floresta Sussurrante  ->  Raízes do Bosque (2 andares)
//   ->  Coração do Bosque (chefe: Treant Ancião)  ->  portal de volta à vila
// Coordenadas em blocos de 16 px.
// =====================================================================
import { MapBuilder } from './builder.js';
import { buildDungeon } from './dungeon.js';
import { hash } from '../map/art.js';

// --------------------------------------------------------------- VILA
export function buildVila() {
  const B = new MapBuilder(64, 48, 'g');
  B.ellipse(6, 31, 3.5, 2.5, 'w');                       // lago
  B.road([[4, 24], [63.5, 24]]);                         // estrada para a floresta
  B.ellipse(22, 24, 7, 4.5, 'd');                        // praça
  B.road([[22, 28], [22, 40]], 2); B.road([[8, 40], [36, 40]], 2);
  for (const x of [11, 22, 33]) B.road([[x, 24], [x, 16.5]], 2);
  B.road([[44, 24], [44, 19]], 2);

  // casas (porta virada para a rua)
  for (const [x, y, v] of [[11, 15, 0], [22, 15, 1], [33, 15, 0], [13, 38, 1], [31, 38, 0]]) {
    B.add('house', x, y, v); B.reserve(x - 3, y - 5, x + 3, y + 1);
  }
  B.addPx('barn', 44 * 16 + 8, 18 * 16 + 6); B.reserve(40, 13, 48, 19);
  B.field(42, 30, 55, 38, 'top', 47);
  B.crystal(22, 21);
  // feira (lojas na próxima fase) e enfeites
  B.add('stall', 16, 28, 1); B.add('stall', 28, 28, 0); B.reserve(14, 26, 30, 29);
  for (const [x, y] of [[48, 20], [49, 21], [39, 18]]) B.add('hay', x, y);
  for (const [x, y] of [[7, 17], [27, 17], [37, 37], [9, 36]]) B.add('barrel', x, y);
  for (const [x, y] of [[17, 20], [27, 20], [18, 36], [26, 36]]) B.add('planter', x, y);
  for (const [x, y] of [[40, 21], [41, 22]]) B.add('crate', x, y);

  // moradores (falas em src/dialogues.js) — antes das árvores, para reservar o espaço
  B.npc('mercador_fazenda', 16, 26, { dir: 'down' });            // atrás da barraca vermelha
  B.npc('estalajadeira', 34, 40, { dir: 'down' });               // ao lado da porta da estalagem
  B.npc('velho_agricultor', 45, 27, { wander: 2 });              // perto do campo
  B.npc('aprendiz', 11, 33, { wander: 2 });                      // perto do lago

  // árvores: bordas (menos a saída leste) e alguns bosques
  B.trees((x, y) => {
    if (B.get(x, y) !== 'g' || B.nearOpen(x, y, 1, ['g'])) return false;
    const border = x < 3 || y < 3 || y > 44 || x > 60;
    const grove = hash(Math.floor(x / 5), Math.floor(y / 5), 9) < 0.2;
    return border || grove;
  }, { seed: 200 });
  for (let i = 0; i < 18; i++) {
    const x = 3 + Math.floor(hash(i, 1, 301) * 58), y = 3 + Math.floor(hash(i, 2, 301) * 42);
    if (B.get(x, y) === 'g' && !B.isReserved(x, y) && !B.nearOpen(x, y, 1, ['g'])) B.add(i % 3 ? 'bush' : 'rock', x, y);
  }

  B.entry('inicio', 22, 27, 'down');
  B.entry('leste', 60, 24, 'left');
  B.exit(63, 21, 63, 27, 'floresta', 'oeste');
  return B.build({ theme: 'farm', safe: true });
}

// ----------------------------------------------------------- FLORESTA
export function buildFloresta() {
  const W = 128, H = 96;
  const B = new MapBuilder(W, H, 'g');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (x >= 44 + Math.floor(hash(0, y, 1) * 4)) B.set(x, y, 'f');

  B.river([[76, -2], [78, 14], [72, 30], [74, 46], [80, 62], [84, 78], [82, 98]]);
  B.ellipse(100, 60, 6, 4, 'w');
  // clareiras
  const clearings = [[58, 20, 5, 4], [64, 70, 5, 4], [100, 82, 5, 4], [96, 40, 4.5, 3], [92, 14, 4, 3]];
  for (const [x, y, rx, ry] of clearings) B.ellipse(x, y, rx, ry, 'g', ['w']);
  // campos dos espantalhos
  B.field(8, 14, 20, 24, 'bottom', 13);
  B.field(10, 62, 24, 72, 'top', 16);
  B.field(26, 34, 36, 42, 'bottom', 30, false);

  // estradas
  B.road([[-1, 48], [20, 48], [40, 46], [60, 40], [74, 38], [90, 32], [104, 22], [112, 15]]);
  B.road([[14, 26], [14, 48]], 2); B.road([[17, 48], [17, 60]], 2); B.road([[31, 44], [31, 47]], 2);
  B.road([[60, 40], [62, 52], [64, 66]], 2); B.road([[90, 32], [96, 38]], 2);

  // caverna da dungeon (nordeste) + cristal de save
  B.ellipse(112, 12, 5, 3, 'g');
  B.addPx('cave', 112 * 16 + 8, 13 * 16 + 4); B.reserve(107, 8, 117, 16);
  B.exit(111, 12, 113, 13, 'bosque1', 'entrada');
  B.entry('caverna', 112, 16, 'down');
  B.crystal(106, 19);

  // árvores
  B.trees((x, y) => B.get(x, y) === 'f' && !B.nearOpen(x, y, 1, ['f']), { seed: 400 });
  B.trees((x, y) => {
    if (B.get(x, y) !== 'g' || x > 46 || B.nearOpen(x, y, 1, ['g'])) return false;
    return x < 3 || y < 3 || y > H - 4 || hash(Math.floor(x / 6), Math.floor(y / 6), 13) < 0.2;
  }, { seed: 500 });
  for (let i = 0; i < 40; i++) {
    const x = 3 + Math.floor(hash(i, 3, 302) * (W - 6)), y = 3 + Math.floor(hash(i, 4, 302) * (H - 6));
    const t = B.get(x, y);
    if ((t === 'g' || t === 'f') && !B.isReserved(x, y) && !B.nearOpen(x, y, 1, ['g', 'f'])) B.add(['rock', 'stump', 'bush'][i % 3], x, y);
  }

  // inimigos
  B.zone(14, 19, 'scarecrow', 3); B.zone(17, 67, 'scarecrow', 3); B.zone(31, 38, 'scarecrow', 2);
  B.zone(58, 20, 'treant', 3); B.zone(64, 70, 'treant', 3); B.zone(100, 82, 'treant', 3);
  B.zone(96, 40, 'treant', 2); B.zone(92, 14, 'treant', 2); B.zone(50, 46, 'scarecrow', 2);

  B.entry('oeste', 2, 48, 'right');
  B.exit(0, 45, 0, 51, 'vila', 'leste');
  return B.build({ theme: 'forest' });
}

// ------------------------------------------------------------ DUNGEON
export const buildBosque1 = () => buildDungeon({
  seed: 7101, theme: 'roots', enemies: ['treant', 'scarecrow'], perRoom: [2, 3],
  up: { to: 'floresta', entry: 'caverna' }, down: { to: 'bosque2', entry: 'entrada' },
});
export const buildBosque2 = () => buildDungeon({
  seed: 7202, theme: 'roots', rooms: 11, enemies: ['treant'], perRoom: [2, 4],
  up: { to: 'bosque1', entry: 'escada' }, down: { to: 'bosque_boss', entry: 'entrada', boss: true },
  crystalAtEnd: true,
});

// ------------------------------------------------------ ARENA DO CHEFE
export function buildBosqueBoss() {
  const B = new MapBuilder(40, 34, 'v');
  B.ellipse(20, 15, 16, 11, 'n');
  B.rect(18, 25, 21, 33, 'n');
  B.addPx('stairsUp', 20 * 16, 32 * 16 + 14);
  B.exit(18, 32, 21, 33, 'bosque2', 'escada', { sealedByBoss: true });
  B.entry('entrada', 20, 28, 'up');
  B.zone(20, 11, 'treantBoss', 1, { boss: 'bosque', radius: 0 });
  // portal de volta à vila (aparece depois de vencer o chefe)
  B.addPx('portal', 20 * 16 + 8, 15 * 16 + 8, 0, { requires: 'bosque' });
  B.exit(19, 14, 21, 15, 'vila', 'inicio', { requires: 'bosque' });
  B.reserve(15, 8, 25, 33);
  for (const [x, y] of [[8, 10], [32, 10], [7, 18], [33, 18], [12, 6], [28, 6], [10, 23], [30, 23]]) B.add(y % 2 ? 'mushroom' : 'rock', x, y);
  return B.build({ theme: 'roots', dark: true, arena: true });
}
