// =====================================================================
// INICIALIZAÇÃO: carrega sprites e roda o loop (atualizar -> desenhar)
// O jogo em si fica em game.js.
// =====================================================================
import { VIEW_W, VIEW_H } from './data.js';
import { loadSprites, loadPortraits } from './sprites.js';
import { Game } from './game.js';

const canvas = document.getElementById('game');
canvas.width = VIEW_W; canvas.height = VIEW_H;

function fit() {
  let s = Math.min(innerWidth / VIEW_W, innerHeight / VIEW_H);
  if (s >= 1) s = Math.floor(s);
  canvas.style.width = `${VIEW_W * s}px`;
  canvas.style.height = `${VIEW_H * s}px`;
}
addEventListener('resize', fit);
fit();

let game;
let last = performance.now();
let lastError = '';
function frame(now) {
  requestAnimationFrame(frame);          // agenda antes: um erro não congela o jogo
  const dt = Math.min(1 / 30, (now - last) / 1000);
  last = now;
  try {
    game.update(dt);
    game.render();
  } catch (err) {
    if (String(err) !== lastError) { lastError = String(err); console.error(err); }
  }
  game.input.endFrame();
}

Promise.all([loadSprites(), loadPortraits()]).then(() => {
  game = new Game(canvas);
  window.game = game; // útil para depurar no console do navegador
  requestAnimationFrame(frame);
}).catch((err) => {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
  ctx.fillText(err.message, 10, 20);
  console.error(err);
});
