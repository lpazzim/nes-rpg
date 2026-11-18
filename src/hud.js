// =====================================================================
// HUD: cartões dos heróis, barra do chefe, ajuda e telas de pausa/fim
// =====================================================================
import { VIEW_W, VIEW_H, xpToNext } from './data.js';
import { outlineText } from './combat.js';

const CARD_W = 150, CARD_H = 34;
const HELP_W = 222;      // cabe a linha mais longa da ajuda na fonte bitmap
const BANNER_Y = 86;     // abaixo da caixa de ajuda, para os dois nao se cruzarem

export function drawHud(ctx, game) {
  const total = CARD_W * 3 + 14;
  let cx = Math.round((VIEW_W - total) / 2);
  const cy = VIEW_H - CARD_H - 4;
  game.heroes.forEach((h) => {
    drawCard(ctx, h, cx, cy, h === game.leader, game.time);
    cx += CARD_W + 7;
  });

  // Barra do chefe
  const boss = game.enemies.find((e) => e.boss && e.alive &&
    game.leader && Math.hypot(e.x - game.leader.x, e.y - game.leader.y) < 220);
  if (boss) {
    const w = 200, x = (VIEW_W - w) / 2, y = 14;
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(x - 2, y - 2, w + 4, 8);
    ctx.fillStyle = '#c0392b'; ctx.fillRect(x, y, w * (boss.hp / boss.maxHp), 4);
    ctx.textAlign = 'center';
    outlineText(ctx, boss.name, VIEW_W / 2, y - 4, '#ffd6a0');
    ctx.textAlign = 'left';
  }

  // Ajuda
  // a ajuda so aparece jogando (atras do menu/loja ela virava sombra no texto)
  if (game.showHelp && game.mode === 'play') {
    const lines = [
      'WASD/Setas: mover',
      'J: ataque   K: habilidade',
      'L: especial (PODER cheio)',
      'Espaco: esquiva   Tab: trocar heroi',
      'Enter: menu   E: interagir',
      'P: pausa   H: esconder ajuda',
    ];
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(4, 4, HELP_W, lines.length * 10 + 6);
    lines.forEach((l, i) => outlineText(ctx, l, 8, 14 + i * 10, '#e8e8e8', 8));
  } else if (game.mode === 'play') {
    outlineText(ctx, 'H: ajuda', 6, 12, '#cfcfcf', 8);
  }

  // Anúncio de especial / chefe derrotado
  if (game.banner && game.banner.t > 0) {
    ctx.globalAlpha = Math.min(1, game.banner.t * 2);
    ctx.textAlign = 'center';
    outlineText(ctx, game.banner.text, VIEW_W / 2, BANNER_Y, '#ffd84a', 12);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }

  if (game.paused) overlay(ctx, 'PAUSADO', 'P para continuar');
}

function drawCard(ctx, h, x, y, leader, time) {
  ctx.fillStyle = 'rgba(12,12,32,0.8)'; ctx.fillRect(x, y, CARD_W, CARD_H);
  ctx.strokeStyle = leader ? '#ffd84a' : '#555a70'; ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, CARD_W - 1, CARD_H - 1);

  outlineText(ctx, `${h.name} Lv${h.level}`, x + 4, y + 9, h.alive ? '#ffffff' : '#888', 8);
  ctx.textAlign = 'right';
  outlineText(ctx, h.alive ? h.data.role : 'K.O.', x + CARD_W - 4, y + 9, h.alive ? '#aab0c8' : '#ff6b6b', 8);
  ctx.textAlign = 'left';

  // Numeros a direita; as barras ficam a esquerda. Cada linha de texto da
  // fonte bitmap ocupa 7 px, entao as bases precisam de 8 px entre elas.
  const dir = x + CARD_W - 4;
  ctx.textAlign = 'right';

  // HP
  const hpP = h.hp / h.maxHp;
  bar(ctx, x + 4, y + 12, 90, 4, hpP, hpP > 0.5 ? '#4cd964' : hpP > 0.25 ? '#ffcc00' : '#ff3b30');
  outlineText(ctx, `${Math.ceil(h.hp)}/${h.maxHp}`, dir, y + 18, '#e8e8e8', 7);

  // MP (só quem usa poderes) ou recarga da habilidade: a barra ja diz tudo
  if (h.maxMp > 0) bar(ctx, x + 4, y + 19, 90, 3, h.mp / h.maxMp, '#4fa3ff');
  else {
    const ready = h.skillCd <= 0;
    bar(ctx, x + 4, y + 19, 90, 3, ready ? 1 : 1 - h.skillCd / 1.4, ready ? '#8fa0c0' : '#55607a');
  }

  // PODER
  const full = h.power >= 100;
  const pc = full ? (Math.floor(time * 6) % 2 ? '#fff6a0' : '#ffb000') : '#d4a017';
  bar(ctx, x + 4, y + 25, 90, 4, h.power / 100, pc);

  // So cabe mais UMA linha de texto no cartao: o aviso de PODER cheio tem
  // prioridade sobre o numero de MP (a barra azul continua visivel).
  if (full) outlineText(ctx, 'PODER!', dir, y + 26, '#ffd84a', 7);
  else if (h.maxMp > 0) outlineText(ctx, `MP ${Math.floor(h.mp)}`, dir, y + 26, '#9ecbff', 7);
  ctx.textAlign = 'left';

  // XP (linha fina na base)
  ctx.fillStyle = '#7fffd4';
  ctx.fillRect(x + 1, y + CARD_H - 2, (CARD_W - 2) * (h.xp / xpToNext(h.level)), 1);
}

function bar(ctx, x, y, w, h, p, color) {
  ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = '#2a2d3a'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color; ctx.fillRect(x, y, Math.max(0, Math.min(1, p)) * w, h);
}

function overlay(ctx, title, sub) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  outlineText(ctx, title, VIEW_W / 2, VIEW_H / 2 - 6, '#ffffff', 16);
  outlineText(ctx, sub, VIEW_W / 2, VIEW_H / 2 + 12, '#cfcfcf', 8);
  ctx.textAlign = 'left';
}
