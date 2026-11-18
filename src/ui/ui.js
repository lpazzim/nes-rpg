// =====================================================================
// COMPONENTES DE INTERFACE (janelas azuis no estilo SNES)
// =====================================================================
import { outlineText } from '../combat.js';

export function win(ctx, x, y, w, h, active = true) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, active ? '#2c3f9e' : '#232a55');
  g.addColorStop(1, active ? '#101a52' : '#0d1230');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#0a0a18'; ctx.lineWidth = 1; ctx.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);
  ctx.strokeStyle = '#e8ecff'; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.strokeStyle = '#6a7ad0'; ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
}

export function text(ctx, str, x, y, color = '#ffffff', size = 8, align = 'left') {
  ctx.textAlign = align;
  outlineText(ctx, str, Math.round(x), Math.round(y), color, size);
  ctx.textAlign = 'left';
}

export function bar(ctx, x, y, w, h, p, color) {
  ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = '#2a2d3a'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color; ctx.fillRect(x, y, Math.max(0, Math.min(1, p)) * w, h);
}

// cursor em forma de seta (pisca suave)
export function cursor(ctx, x, y, time) {
  const dx = Math.round(Math.sin(time * 8));
  ctx.fillStyle = '#ffd84a';
  ctx.beginPath(); ctx.moveTo(x + dx, y - 4); ctx.lineTo(x + 6 + dx, y); ctx.lineTo(x + dx, y + 4); ctx.fill();
  ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke();
}

// tecla de navegação: devolve -1/1/0
export function navY(input) {
  if (input.wasPressed('ArrowUp', 'KeyW')) return -1;
  if (input.wasPressed('ArrowDown', 'KeyS')) return 1;
  return 0;
}
export function navX(input) {
  if (input.wasPressed('ArrowLeft', 'KeyA')) return -1;
  if (input.wasPressed('ArrowRight', 'KeyD')) return 1;
  return 0;
}
export const confirm = (input) => input.wasPressed('KeyJ', 'KeyZ', 'Enter', 'Space');
export const back = (input) => input.wasPressed('KeyK', 'KeyX', 'Escape', 'Backspace');

export function hpColor(p) { return p > 0.5 ? '#4cd964' : p > 0.25 ? '#ffcc00' : '#ff3b30'; }
