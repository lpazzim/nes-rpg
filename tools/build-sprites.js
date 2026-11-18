// =====================================================================
// Converte as folhas de sprites (arte em alta resolução) em sprites estilo SNES.
//
//   npm run sprites                (todas as folhas)
//   npm run sprites -- kaito knight (só algumas)
//   PREVIEW=pasta npm run sprites   (gera prévias ampliadas das animações)
//
// Entrada : tools/sprites.config.js (folhas, divisões e animações)
// Saída   : assets/sprites/<nome>.png (atlas)  +  assets/sprites/sprites.json
//
// Para cada quadro usado:
//   1. recorta a região do quadro (detectada automaticamente)
//   2. remove o fundo e pedaços de quadros vizinhos
//   3. transforma a sombra do chão em preto semitransparente
//   4. reduz (média por bloco, alinhada ao ponto dos pés) e limita a paleta
// =====================================================================
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { loadSheet, detectFrames, applySplits, dist } = require('./detect-frames.js');
const config = require('./sprites.config.js');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets/sprites');
const SHADOW = [0, 0, 0, 80]; // cor da sombra no jogo (RGBA)

(async () => {
  const only = process.argv.slice(2);
  const metaFile = path.join(OUT_DIR, 'sprites.json');
  const meta = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, 'utf8')) : {};
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const [name, cfg] of Object.entries(config.sheets)) {
    if (only.length && !only.includes(name)) continue;
    const sheet = await loadSheet(path.join(ROOT, cfg.file));
    const frames = applySplits(sheet, detectFrames(sheet), cfg.splits || {});
    const scale = cfg.scale || config.scale;

    // quadros usados pelas animações
    const used = [...new Set(Object.values(cfg.anims).flatMap((a) => a.f))].sort((a, b) => a - b);
    for (const id of used) if (!frames[id]) throw new Error(`${name}: quadro ${id} não existe (há ${frames.length})`);
    const out = used.map((id) => extract(sheet, frames[id], scale, { dropAbove: !!cfg.dropAbove }));

    // paleta única por personagem
    const all = out.flatMap((f) => f.pixels.filter((p) => p && p[3] === 255));
    const palette = kmeans(all, cfg.colors || config.colors);
    for (const f of out) f.pixels = f.pixels.map((p) => (p && p[3] === 255 ? [...nearest(palette, p), 255] : p));

    // monta o atlas (prateleiras)
    const MAXW = 512, PAD = 1;
    let x = PAD, y = PAD, rowH = 0, atlasW = 0;
    for (const f of out) {
      if (x + f.w + PAD > MAXW) { x = PAD; y += rowH + PAD; rowH = 0; }
      f.ax0 = x; f.ay0 = y; x += f.w + PAD; rowH = Math.max(rowH, f.h); atlasW = Math.max(atlasW, x);
    }
    const atlasH = y + rowH + PAD;
    const buf = Buffer.alloc(atlasW * atlasH * 4);
    for (const f of out) {
      for (let j = 0; j < f.h; j++) for (let i = 0; i < f.w; i++) {
        const p = f.pixels[j * f.w + i]; if (!p) continue;
        const o = ((f.ay0 + j) * atlasW + f.ax0 + i) * 4;
        buf[o] = p[0]; buf[o + 1] = p[1]; buf[o + 2] = p[2]; buf[o + 3] = p[3];
      }
    }
    const png = path.join(OUT_DIR, `${name}.png`);
    await sharp(buf, { raw: { width: atlasW, height: atlasH, channels: 4 } }).png().toFile(png);

    const index = new Map(used.map((id, i) => [id, i]));
    meta[name] = {
      image: `assets/sprites/${name}.png`,
      frames: out.map((f) => [f.ax0, f.ay0, f.w, f.h, f.ox, f.oy]), // x, y, w, h, pés-x, pés-y
      anims: Object.fromEntries(Object.entries(cfg.anims).map(([k, a]) => [k, {
        frames: a.f.map((id) => index.get(id)), fps: a.fps, loop: a.loop !== false, ...(a.hit !== undefined ? { hit: a.hit } : {}),
      }])),
    };
    console.log(`${name}: ${frames.length} quadros na folha, ${used.length} usados, atlas ${atlasW}x${atlasH}`);

    if (process.env.PREVIEW) await previewAnims(name, meta[name], buf, atlasW, atlasH, process.env.PREVIEW);
  }
  fs.writeFileSync(metaFile, JSON.stringify(meta));
})().catch((e) => { console.error(e); process.exit(1); });

// ---------------------------------------------------------------------
function isBackground(c, bg) {
  const d = dist(c, bg);
  if (d <= 30) return true;
  // brilho de magia misturado com o fundo (tom frio, luminosidade parecida, pouca saturação)
  const lum = (c[0] + c[1] + c[2]) / 3, sat = Math.max(...c) - Math.min(...c);
  return d < 70 && c[2] >= c[1] && lum >= 70 && lum <= 112 && sat < 60;
}
function isShadowColor(c) {
  const lum = (c[0] + c[1] + c[2]) / 3, sat = Math.max(...c) - Math.min(...c);
  return lum >= 22 && lum <= 62 && sat <= 22;
}

function extract(sheet, fr, S, opts = {}) {
  const { get, bg } = sheet;
  const { left, right, top, bottom } = fr.region;
  const w = right - left + 1, h = bottom - top + 1;
  const ax = fr.anchor.x - left, ay = fr.anchor.y - top;  // pés, em coordenadas da região

  // 1) máscara: 0 fundo, 1 conteúdo, 2 sombra
  //    O fundo é preenchido a partir das bordas (assim cinzas parecidos com o
  //    fundo DENTRO do personagem, como armaduras, não viram buracos).
  const isBgPx = new Uint8Array(w * h);
  const st = [];
  const push = (x, y) => { if (x >= 0 && y >= 0 && x < w && y < h && !isBgPx[y * w + x]) st.push(x, y); };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (st.length) {
    const y = st.pop(), x = st.pop();
    if (isBgPx[y * w + x] || !isBackground(get(left + x, top + y), bg)) continue;
    isBgPx[y * w + x] = 1;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
  const mask = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = get(left + x, top + y);
    if (isBgPx[y * w + x] || dist(c, bg) <= 12) continue;   // fundo (bordas) ou buraco com a cor exata do fundo
    mask[y * w + x] = (y >= ay - 7 && isShadowColor(c)) ? 2 : 1;
  }
  // 2) componentes conectados: descarta pedaços de vizinhos encostados na borda
  const comp = new Int32Array(w * h).fill(-1);
  const comps = [];
  for (let i = 0; i < w * h; i++) {
    if (!mask[i] || comp[i] >= 0) continue;
    const id = comps.length, st = [i]; let n = 0, edge = false, minDist = Infinity, minY = h, maxY = 0;
    comp[i] = id;
    while (st.length) {
      const k = st.pop(), x = k % w, y = (k - x) / w; n++;
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      if (x === 0 || x === w - 1) edge = true;
      minDist = Math.min(minDist, Math.abs(x - ax) + Math.max(0, y - ay));
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const nk = ny * w + nx; if (mask[nk] && comp[nk] < 0) { comp[nk] = id; st.push(nk); }
      }
    }
    comps.push({ n, edge, minDist, minY, maxY });
  }
  const main = comps.reduce((b, c, i) => (c.n > (comps[b]?.n || 0) ? i : b), 0);
  // dropAbove: descarta o que está inteiro acima da cabeça (títulos escritos na folha)
  const above = (c) => opts.dropAbove && c.maxY < comps[main].minY - 1;
  const keep = comps.map((c, i) => i === main || (!c.edge && c.n >= 3 && !above(c)));
  for (let i = 0; i < w * h; i++) if (mask[i] && !keep[comp[i]]) mask[i] = 0;

  // 3) caixa e redução alinhada aos pés
  let bx0 = w, bx1 = -1, by0 = h, by1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mask[y * w + x]) {
    bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y);
  }
  const gx0 = Math.floor((bx0 - ax) / S), gx1 = Math.ceil((bx1 + 1 - ax) / S);
  const gy0 = Math.floor((by0 - ay) / S), gy1 = Math.ceil((by1 + 1 - ay) / S);
  const ow = gx1 - gx0, oh = gy1 - gy0;
  const pixels = new Array(ow * oh).fill(null);
  for (let j = 0; j < oh; j++) for (let i = 0; i < ow; i++) {
    let r = 0, g = 0, b = 0, n = 0, sh = 0, tot = 0;
    for (let yy = 0; yy < S; yy++) for (let xx = 0; xx < S; xx++) {
      const x = Math.round(ax + (gx0 + i) * S + xx), y = Math.round(ay + (gy0 + j) * S + yy);
      tot++;
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const m = mask[y * w + x];
      if (m === 1) { const c = get(left + x, top + y); r += c[0]; g += c[1]; b += c[2]; n++; }
      else if (m === 2) sh++;
    }
    if (n / tot >= 0.5) pixels[j * ow + i] = [r / n, g / n, b / n, 255];
    else if ((n + sh) / tot >= 0.5) pixels[j * ow + i] = SHADOW;
  }
  return { w: ow, h: oh, ox: -gx0, oy: -gy0, pixels };
}

function kmeans(points, k) {
  const step = Math.max(1, Math.floor(points.length / 8000));
  const sample = points.filter((_, i) => i % step === 0);
  const cents = [sample[0].slice(0, 3)];
  while (cents.length < k && cents.length < sample.length) {
    let far = null, fd = -1;
    for (const p of sample) { const d = d2(p, nearest(cents, p)); if (d > fd) { fd = d; far = p; } }
    if (fd <= 0) break;
    cents.push(far.slice(0, 3));
  }
  for (let it = 0; it < 10; it++) {
    const acc = cents.map(() => [0, 0, 0, 0]);
    for (const p of sample) {
      let bi = 0, bd = Infinity;
      cents.forEach((c, i) => { const d = d2(p, c); if (d < bd) { bd = d; bi = i; } });
      acc[bi][0] += p[0]; acc[bi][1] += p[1]; acc[bi][2] += p[2]; acc[bi][3]++;
    }
    acc.forEach((a, i) => { if (a[3]) cents[i] = [a[0] / a[3], a[1] / a[3], a[2] / a[3]]; });
  }
  // cores de 15 bits, como no SNES
  return cents.map((c) => c.map((v) => Math.min(248, Math.round(v / 8) * 8)));
}
function nearest(pal, p) {
  let best = pal[0], bd = Infinity;
  for (const c of pal) { const d = d2(c, p); if (d < bd) { bd = d; best = c; } }
  return best;
}
function d2(a, b) { return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2; }

// Prévia: uma linha por animação, ampliada 3x, sobre grama
async function previewAnims(name, m, buf, aw, ah, dir) {
  const Z = 3, CW = 64, CH = 56;
  const names = Object.keys(m.anims);
  const cols = Math.max(...names.map((n) => m.anims[n].frames.length));
  const W = (cols * CW + 70) * Z, H = names.length * CH * Z;
  const canvas = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) canvas.set([79, 143, 58, 255], i * 4);
  names.forEach((an, r) => {
    m.anims[an].frames.forEach((fi, c) => {
      const [fx, fy, fw, fh, ox, oy] = m.frames[fi];
      const baseX = 70 + c * CW + 32 - ox, baseY = r * CH + 46 - oy;
      for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++) {
        const s = ((fy + j) * aw + fx + i) * 4; const a = buf[s + 3]; if (!a) continue;
        for (let zy = 0; zy < Z; zy++) for (let zx = 0; zx < Z; zx++) {
          const X = (baseX + i) * Z + zx, Y = (baseY + j) * Z + zy;
          if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
          const d = (Y * W + X) * 4, t = a / 255;
          for (let k = 0; k < 3; k++) canvas[d + k] = Math.round(buf[s + k] * t + canvas[d + k] * (1 - t));
        }
      }
    });
  });
  const labels = names.map((an, r) => `<text x="6" y="${(r * CH + 30) * Z}" font-family="monospace" font-size="26" font-weight="bold" fill="#fff">${an}</text>`).join('');
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${labels}</svg>`);
  await sharp(canvas, { raw: { width: W, height: H, channels: 4 } }).composite([{ input: svg }]).png().toFile(path.join(dir, `anims_${name}.png`));
}
