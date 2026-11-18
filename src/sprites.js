// =====================================================================
// SPRITES E ANIMAÇÕES
// Carrega assets/sprites/sprites.json (gerado por `npm run sprites`).
// Cada quadro vira um canvas + uma versão branca (flash de dano).
// =====================================================================

export const sheets = {};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
    img.src = src;
  });
}

function cut(img, x, y, w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  c.getContext('2d').drawImage(img, x, y, w, h, 0, 0, w, h);
  return c;
}

function whiten(src) {
  const c = document.createElement('canvas');
  c.width = src.width; c.height = src.height;
  const g = c.getContext('2d');
  g.drawImage(src, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

export async function loadSprites() {
  const meta = await fetch('assets/sprites/sprites.json').then((r) => r.json());
  await Promise.all(Object.entries(meta).map(async ([name, m]) => {
    const img = await loadImage(m.image);
    const frames = m.frames.map(([x, y, w, h, ox, oy]) => {
      const c = cut(img, x, y, w, h);
      return { img: c, white: whiten(c), w, h, ox, oy };
    });
    const anims = {};
    for (const [k, a] of Object.entries(m.anims)) {
      anims[k] = { ...a, frames: a.frames.map((i) => frames[i]), duration: a.frames.length / a.fps };
    }
    sheets[name] = { frames, anims };
  }));
}

// Desenha um quadro com os pés em (x, y). flip = olhando para a esquerda.
export function drawFrame(ctx, frame, x, y, { flip = false, white = false, scale = 1, alpha = 1 } = {}) {
  ctx.save();
  if (alpha !== 1) ctx.globalAlpha *= alpha;
  ctx.translate(Math.round(x), Math.round(y));
  if (flip || scale !== 1) ctx.scale(flip ? -scale : scale, scale);
  ctx.drawImage(white ? frame.white : frame.img, -frame.ox, -frame.oy);
  ctx.restore();
}

// Toca as animações de uma folha
export class Animator {
  constructor(sheetName) {
    this.sheet = sheets[sheetName];
    if (!this.sheet) throw new Error(`Folha de sprites "${sheetName}" não carregada`);
    this.name = null; this.t = 0; this.fired = false;
  }
  has(name) { return !!this.sheet.anims[name]; }
  play(name, restart = false) {
    if (!this.has(name)) return;
    if (this.name === name && !restart) return;
    this.name = name; this.t = 0; this.fired = false;
  }
  update(dt) { this.t += dt; }
  get anim() { return this.sheet.anims[this.name]; }
  get index() {
    const a = this.anim, i = Math.floor(this.t * a.fps);
    return a.loop ? i % a.frames.length : Math.min(i, a.frames.length - 1);
  }
  get frame() { return this.anim.frames[this.index]; }
  get done() { return !this.anim.loop && this.t >= this.anim.duration; }
  // true uma única vez quando a animação chega no quadro de impacto (hit)
  hitNow() {
    const a = this.anim;
    if (this.fired || a.hit === undefined) return false;
    if (Math.floor(this.t * a.fps) >= a.hit) { this.fired = true; return true; }
    return false;
  }
}

// Retratos dos heróis para o menu (opcional).
// Coloque assets/portraits/<id>.png (ex.: kaito.png) e liste o id em
// assets/portraits/portraits.json, ex.: ["kaito", "rin", "aster"].
export const portraits = {};
export async function loadPortraits() {
  try {
    const ids = await fetch('assets/portraits/portraits.json').then((r) => r.json());
    await Promise.all(ids.map((id) => loadImage(`assets/portraits/${id}.png`).then((img) => { portraits[id] = img; }).catch(() => {})));
  } catch { /* sem retratos: o menu usa o sprite ampliado */ }
}
