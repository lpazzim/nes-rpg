// Conversas: quebra de linha, páginas, letra a letra, escolhas e variantes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wrapText, paginate, pickVariant, DialogRunner } from '../src/dialog-runner.js';
import { DIALOG } from '../src/data.js';
import { Npc } from '../src/npcs.js';
import { sheets } from '../src/sprites.js';

const LONG = 'Esta e uma fala bem comprida para testar a quebra de linhas da caixa de dialogo, '
  + 'com palavras suficientes para ocupar mais de tres linhas e assim gerar uma segunda pagina '
  + 'de texto que o jogador precisa avancar apertando o botao de confirmar no teclado do jogo.';

const npc = (extra = {}) => ({
  name: 'Teste',
  talk: [
    { if: 'bosque', say: ['Depois do chefe.'] },
    { say: ['Primeira fala.', 'Segunda fala.'], ...extra },
  ],
});

test('TU-01: wrapText não passa do limite e paginate faz páginas de até 3 linhas', () => {
  const lines = wrapText(LONG, DIALOG.maxChars);
  assert.ok(lines.every((l) => l.length <= DIALOG.maxChars), 'linha maior que o limite');
  assert.equal(lines.join(' '), LONG, 'o texto quebrado deve ser o mesmo texto');
  const pages = paginate(LONG);
  assert.ok(pages.length >= 2, 'fala longa deveria ter mais de uma página');
  assert.ok(pages.every((p) => p.length >= 1 && p.length <= DIALOG.linesPerPage));
  assert.ok(wrapText('x'.repeat(200), 84).every((l) => l.length <= 84), 'palavra gigante deve ser cortada');
});

test('TU-02: pickVariant escolhe a versão da flag ativa, senão a padrão', () => {
  assert.equal(pickVariant(npc(), { bosque: true }).say[0], 'Depois do chefe.');
  assert.equal(pickVariant(npc(), {}).say[0], 'Primeira fala.');
});

test('TU-03: confirmar completa a página, depois avança e por fim encerra', () => {
  const r = new DialogRunner(npc());
  assert.equal(r.visible, 0);
  r.confirm();
  assert.ok(r.pageComplete, 'deveria completar a página');
  r.confirm();
  assert.deepEqual(r.lines, ['Segunda fala.']);
  r.confirm(); r.confirm();
  assert.equal(r.done, true);
  assert.equal(r.action, null);
});

test('TU-04: o texto aparece a ~40 letras por segundo', () => {
  const r = new DialogRunner({ name: 'T', talk: [{ say: [LONG] }] });
  r.tick(0.5);
  assert.equal(r.visible, Math.floor(DIALOG.charsPerSecond * 0.5));
});

test('TU-05: escolhas seguem a opção escolhida; cancelar escolhe a última', () => {
  const ask = { options: [{ label: 'A', say: ['Fala A.'] }, { label: 'B', say: ['Fala B.'] }, { label: 'Sair', say: ['Tchau.'] }] };
  const r = new DialogRunner(npc({ ask }));
  for (let i = 0; i < 4; i++) r.confirm();         // 2 falas (completar + avançar)
  assert.equal(r.choosing, true);
  r.move(1); r.confirm();
  assert.deepEqual(r.lines, ['Fala B.']);
  const r2 = new DialogRunner(npc({ ask }));
  for (let i = 0; i < 4; i++) r2.confirm();
  r2.cancel();
  assert.deepEqual(r2.lines, ['Tchau.']);
});

test('TU-06: opção com ação entrega a ação ao terminar as falas', () => {
  const ask = { options: [{ label: 'Comprar', action: 'soon', say: ['Em breve.'] }, { label: 'Sair' }] };
  const r = new DialogRunner(npc({ ask }));
  for (let i = 0; i < 4; i++) r.confirm();
  r.confirm();                                     // escolhe Comprar
  assert.equal(r.done, false);
  r.confirm(); r.confirm();                        // completa e fecha a fala
  assert.equal(r.done, true);
  assert.equal(r.action, 'soon');
});

// --- NPC (com folha de sprites falsa e mundo sem obstáculos) -----------------

const fakeAnim = { frames: [{}], fps: 1, loop: true, duration: 1 };
sheets.npcs = { anims: new Proxy({}, { get: () => fakeAnim, has: () => true }) };
const openWorld = { move(e, dx, dy) { e.x += dx; e.y += dy; } };
const seq = (seed) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

test('TU-07: NPC que passeia nunca sai do raio em 60 s e alterna andar e pausar', () => {
  const npc = new Npc({ id: 'velho_agricultor', x: 100, y: 100, wander: 2 }, seq(7));
  const game = { world: openWorld, heroes: [] };
  let maxDist = 0, walked = 0, paused = 0;
  for (let t = 0; t < 60; t += 1 / 60) {
    npc.update(1 / 60, game);
    maxDist = Math.max(maxDist, Math.hypot(npc.x - 100, npc.y - 100));
    if (npc.moving) walked++; else paused++;
  }
  assert.ok(maxDist <= 2 * 16 + 1, `saiu do raio: ${maxDist.toFixed(1)} px`);
  assert.ok(walked > 60 && paused > 60, `deveria andar e pausar (andou ${walked}, parou ${paused} quadros)`);
});

test('TU-08: startTalk vira o NPC para o líder e para o passeio; endTalk retoma', () => {
  const npc = new Npc({ id: 'aprendiz', x: 100, y: 100, wander: 2, dir: 'down' }, seq(3));
  const game = { world: openWorld, heroes: [] };
  npc.startTalk({ x: 60, y: 102 });                       // líder à esquerda
  assert.deepEqual([npc.state, npc.dir, npc.faceX], ['talk', 'side', -1]);
  const before = [npc.x, npc.y];
  for (let i = 0; i < 600; i++) npc.update(1 / 60, game);  // 10 s conversando
  assert.deepEqual([npc.x, npc.y], before, 'não pode andar durante a conversa');
  npc.startTalk({ x: 100, y: 40 });                       // líder acima
  assert.equal(npc.dir, 'up');
  npc.endTalk();
  assert.equal(npc.state, 'idle');
});

// --- separação herói x NPC (regressão BUG-01 da revisão) ---------------------
test('BUG-01: herói exatamente em cima de um NPC é empurrado para fora', async () => {
  const { separateFromNpcs } = await import('../src/interaction.js');
  const world = { collides: () => false };
  const hero = { alive: true, x: 100, y: 100, r: 5 };
  const npc = { x: 100, y: 100, r: 6 };
  separateFromNpcs([hero], [npc], world);
  assert.ok(Math.hypot(hero.x - npc.x, hero.y - npc.y) >= hero.r + npc.r - 0.01, 'herói continua dentro do NPC');
});

test('separação não empurra o herói para dentro de parede', async () => {
  const { separateFromNpcs } = await import('../src/interaction.js');
  const hero = { alive: true, x: 100, y: 100, r: 5 };
  separateFromNpcs([hero], [{ x: 104, y: 100, r: 6 }], { collides: () => true });
  assert.deepEqual([hero.x, hero.y], [100, 100]);
});
