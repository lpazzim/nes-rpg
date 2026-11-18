// =====================================================================
// COMBATE: áreas de dano (hitboxes), fórmula de dano e efeitos visuais
// =====================================================================

// Uma Hitbox é qualquer coisa que causa dano: um corte de katana,
// um orbe mágico, uma explosão, a pancada do golem...
export class Hitbox {
  constructor(o) {
    this.x = 0; this.y = 0; this.r = 8;
    this.vx = 0; this.vy = 0;          // velocidade (projéteis)
    this.life = 0.1; this.age = 0;     // duração em segundos
    this.team = 'hero';                // 'hero' acerta inimigos, 'enemy' acerta heróis
    this.owner = null;                 // quem atacou (usa o ATK dele)
    this.mult = 1;                     // multiplicador de dano
    this.kb = 90;                      // força do empurrão
    this.pierce = true;                // false = some ao acertar o primeiro alvo
    this.rehit = 0;                    // >0 = acerta o mesmo alvo várias vezes
    this.follow = false; this.ox = 0; this.oy = 0; // grudada no dono
    this.solidStop = false;            // some ao bater em parede/árvore
    this.look = 'none';                // como desenhar
    this.onHit = null; this.onEnd = null;
    Object.assign(this, o);
    this.hitTimes = new Map();
    this.dead = false;
  }
}

export function calcDamage(atk, def, mult, critChance) {
  let base = Math.max(1, atk * mult - def * 0.5) * (0.9 + Math.random() * 0.2);
  const crit = Math.random() < critChance;
  if (crit) base *= 1.8;
  return { amount: Math.max(1, Math.round(base)), crit };
}

// --- Efeitos: números de dano e partículas ---------------------------
export const fx = { texts: [], particles: [] };

export function floatText(x, y, text, color = '#fff', size = 8) {
  fx.texts.push({ x, y, text, color, size, life: 0.9 });
}

export function burst(x, y, color, n = 6, speed = 60) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random() * 0.8);
    fx.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.35 + Math.random() * 0.2, color });
  }
}

export function updateFx(dt) {
  for (const t of fx.texts) { t.y -= 28 * dt; t.life -= dt; }
  for (const p of fx.particles) {
    p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.9; p.vy *= 0.9; p.life -= dt;
  }
  fx.texts = fx.texts.filter((t) => t.life > 0);
  fx.particles = fx.particles.filter((p) => p.life > 0);
}

export function drawFx(ctx) {
  for (const p of fx.particles) {
    ctx.globalAlpha = Math.min(1, p.life * 3);
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.round(p.x), Math.round(p.y) - 2, 2, 2);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  for (const t of fx.texts) {
    ctx.globalAlpha = Math.min(1, t.life * 3);
    outlineText(ctx, t.text, Math.round(t.x), Math.round(t.y), t.color, t.size);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

export function outlineText(ctx, text, x, y, color, size = 8) {
  ctx.font = `bold ${size}px monospace`;
  ctx.fillStyle = '#000';
  ctx.fillText(text, x + 1, y + 1);
  ctx.fillText(text, x - 1, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

// Desenho dos projéteis e áreas de efeito
export function drawHitbox(ctx, h) {
  const x = Math.round(h.x), y = Math.round(h.y);
  switch (h.look) {
    case 'orbBlue':
    case 'orbRed': {
      const main = h.look === 'orbBlue' ? '#4fa3ff' : '#ff4b3a';
      ctx.globalAlpha = 0.35; ctx.fillStyle = main; dot(ctx, x, y - 16, h.r + 3);
      ctx.globalAlpha = 1; dot(ctx, x, y - 16, h.r);
      ctx.fillStyle = '#fff'; dot(ctx, x - 1, y - 17, Math.max(1, h.r - 3));
      break;
    }
    case 'dagger': {
      const a = Math.atan2(h.vy, h.vx);
      ctx.strokeStyle = '#e6edf3'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(a) * 5, y - 16 - Math.sin(a) * 5);
      ctx.lineTo(x + Math.cos(a) * 5, y - 16 + Math.sin(a) * 5);
      ctx.stroke();
      break;
    }
    case 'explosion': {
      const p = h.age / (h.age + h.life);
      ctx.globalAlpha = 0.6 * (1 - p);
      ctx.fillStyle = '#ff8a3a'; dot(ctx, x, y - 4, h.r * (0.4 + p * 0.6));
      ctx.fillStyle = '#ffe08a'; dot(ctx, x, y - 4, h.r * 0.4 * (1 - p));
      ctx.globalAlpha = 1;
      break;
    }
    case 'slam': {
      const p = h.age / (h.age + h.life);
      ctx.strokeStyle = `rgba(230,200,150,${1 - p})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(x, y, h.r * (0.5 + p * 0.5), h.r * 0.5 * (0.5 + p * 0.5), 0, 0, Math.PI * 2); ctx.stroke();
      break;
    }
    case 'spin': {
      // o redemoinho já está no sprite; aqui só o vento no chão
      ctx.strokeStyle = `rgba(200,235,255,${0.25 + 0.15 * Math.sin(h.age * 30)})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(x, y + 2, h.r - 4, (h.r - 4) * 0.45, 0, 0, Math.PI * 2); ctx.stroke();
      break;
    }
    case 'bolt': {
      if (!h.frame) break;
      ctx.save();
      ctx.translate(x, y - 18);
      ctx.rotate(Math.atan2(h.vy, h.vx));
      ctx.drawImage(h.frame.img, -h.frame.w / 2, -h.frame.h / 2);
      ctx.restore();
      break;
    }
    case 'roots': {
      // raízes saindo do chão em círculo
      const p = h.age / (h.age + h.life);
      ctx.strokeStyle = '#5a3d22'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + i;
        const rr = h.r * (0.35 + 0.6 * ((i * 37) % 10) / 10);
        const bx = x + Math.cos(a) * rr, by = y + Math.sin(a) * rr * 0.5;
        const len = 6 + 10 * Math.sin(Math.min(1, p * 2) * Math.PI);
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a) * 3, by - len); ctx.stroke();
      }
      ctx.strokeStyle = `rgba(120,90,40,${0.6 * (1 - p)})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x, y, h.r, h.r * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
      break;
    }
  }
}

export function dot(ctx, x, y, r) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}
