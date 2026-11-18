// =====================================================================
// Detecta os quadros (frames) de uma folha de sprites sem grade fixa.
//
//   node tools/detect-frames.js assets/source/aster_sheet.webp [saida.png]
//
// Imprime a lista de caixas e, se pedir, gera uma prévia com cada quadro
// numerado — use os números no arquivo tools/sprites.config.js.
// =====================================================================
const sharp = require('sharp');

const BG_TOL = 30;

async function loadSheet(file) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const get = (x, y) => { const i = (y * W + x) * 3; return [data[i], data[i + 1], data[i + 2]]; };
  // cor de fundo = mais comum nas bordas
  const counts = new Map();
  for (let x = 0; x < W; x += 2) for (const y of [0, 1, H - 1, H - 2]) {
    const k = get(x, y).join(','); counts.set(k, (counts.get(k) || 0) + 1);
  }
  const bg = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0].split(',').map(Number);
  return { W, H, get, bg };
}

const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);

function detect(sheet, { minGapX = 3, minGapY = 4 } = {}) {
  const { W, H, get, bg } = sheet;
  const fg = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (dist(get(x, y), bg) > BG_TOL) fg[y * W + x] = 1;

  const runs = (len, filled, minGap, minSize) => {
    const out = []; let s = -1, gap = 0;
    for (let i = 0; i < len; i++) {
      if (filled(i)) { if (s < 0) s = i; gap = 0; }
      else if (s >= 0 && ++gap >= minGap) { out.push([s, i - gap]); s = -1; gap = 0; }
    }
    if (s >= 0) out.push([s, len - 1 - gap]);
    return out.filter(([a, b]) => b - a + 1 >= minSize);
  };

  const rowCount = (y, x0 = 0, x1 = W - 1) => { let n = 0; for (let x = x0; x <= x1; x++) n += fg[y * W + x]; return n; };
  const rows = runs(H, (y) => rowCount(y) > 1, minGapY, 12);
  const frames = [];
  for (const [y0, y1] of rows) {
    const cols = runs(W, (x) => { let n = 0; for (let y = y0; y <= y1; y++) n += fg[y * W + x]; return n > 1; }, minGapX, 6);
    for (const [x0, x1] of cols) {
      // aperta a caixa verticalmente dentro da coluna
      let ty0 = y1, ty1 = y0;
      for (let y = y0; y <= y1; y++) if (rowCount(y, x0, x1) > 0) { ty0 = Math.min(ty0, y); ty1 = Math.max(ty1, y); }
      frames.push({ id: frames.length, x: x0, y: ty0, w: x1 - x0 + 1, h: ty1 - ty0 + 1, row: rows.indexOf(rows.find((r) => r[0] === y0)) });
    }
  }
  return frames;
}

// ---------------------------------------------------------------------
// Detecção por SOMBRAS: cada quadro tem uma sombra elíptica sob os pés.
// Acha as sombras (linhas horizontais escuras e neutras com fundo logo
// abaixo), agrupa em linhas e divide a folha entre sombras vizinhas.
// Funciona mesmo quando efeitos/armas encostam no quadro do lado.
// ---------------------------------------------------------------------
function isShadowColor(c) {
  const lum = (c[0] + c[1] + c[2]) / 3, sat = Math.max(...c) - Math.min(...c);
  return lum >= 22 && lum <= 60 && sat <= 22;
}

function detectByShadows(sheet, { minRun = 16 } = {}) {
  const { W, H, get, bg } = sheet;
  const isBg = (x, y) => y >= H || dist(get(x, y), bg) <= BG_TOL;
  // 1) pixels "base de sombra": cor de sombra com fundo 1-2px abaixo
  const base = new Uint8Array(W * H);
  for (let y = 0; y < H - 1; y++) for (let x = 0; x < W; x++) {
    if (y + 3 >= H) continue;
    const c = get(x, y);
    if (!isShadowColor(c)) continue;
    // abaixo: transição clareando até virar fundo (borda suavizada da sombra)
    const lum = (p) => (p[0] + p[1] + p[2]) / 3;
    const c2 = get(x, y + 2), c3 = get(x, y + 3);
    if (lum(c2) > lum(c) + 6 && dist(c3, bg) < 60 && !isShadowColor(c3)) base[y * W + x] = 1;
  }
  // 2) sequências horizontais (tolerando ±3px de altura) = fundo das elipses
  const used = new Uint8Array(W * H);
  const shadows = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!base[y * W + x] || used[y * W + x]) continue;
    let cx = x, cy = y, n = 0, sumY = 0, gaps = 0, x1 = x;
    while (cx < W && gaps <= 2) {
      let found = -1;
      for (const dy of [0, -1, 1, -2, 2, -3, 3]) {
        const yy = cy + dy;
        if (yy >= 0 && yy < H && base[yy * W + cx] && !used[yy * W + cx]) { found = yy; break; }
      }
      if (found >= 0) { used[found * W + cx] = 1; n++; sumY += found; cy = found; x1 = cx; gaps = 0; }
      else gaps++;
      cx++;
    }
    if (n < minRun) continue;
    const by = Math.round(sumY / n);
    // embaixo de uma sombra de verdade só há fundo (barras de casaco têm pernas embaixo)
    let bgN = 0, tot = 0;
    for (let yy = by + 4; yy <= Math.min(H - 1, by + 12); yy++) for (let xx = x; xx <= x1; xx++) {
      tot++; if (dist(get(xx, yy), bg) < 45) bgN++;
    }
    if (tot > 0 && bgN / tot < 0.93) continue;
    // acima da sombra ficam os pés (conteúdo); lâminas/armas soltas têm fundo em cima
    let fgN = 0, tot2 = 0;
    const mx0 = Math.round(x + (x1 - x) * 0.3), mx1 = Math.round(x + (x1 - x) * 0.7);
    for (let yy = Math.max(0, by - 14); yy <= by - 3; yy++) for (let xx = mx0; xx <= mx1; xx++) {
      tot2++; if (dist(get(xx, yy), bg) > BG_TOL) fgN++;
    }
    if (fgN / tot2 >= 0.45) shadows.push({ x0: x, x1, cx: (x + x1) / 2, by });
  }
  // remove sombras duplicadas (mesma elipse vista em 2 alturas)
  shadows.sort((a, b) => a.by - b.by || a.x0 - b.x0);
  const uniq = [];
  for (const s of shadows) {
    const dup = uniq.find((u) => Math.abs(u.by - s.by) < 8 && s.x0 < u.x1 && s.x1 > u.x0);
    if (dup) { dup.x0 = Math.min(dup.x0, s.x0); dup.x1 = Math.max(dup.x1, s.x1); dup.cx = (dup.x0 + dup.x1) / 2; }
    else uniq.push({ ...s });
  }
  // sombras longas demais = duas sombras encostadas -> divide
  const widths = uniq.map((u) => u.x1 - u.x0).sort((a, b) => a - b);
  const med = widths[widths.length >> 1] || 30;
  for (const u of [...uniq]) {
    const k = Math.round((u.x1 - u.x0) / med);
    if (!((u.x1 - u.x0) > med * 1.6 && k >= 2)) continue;
    // só divide se houver fundo entre dois corpos logo acima da sombra
    const colEmpty = (xx) => {
      for (let yy = Math.max(0, u.by - 45); yy <= u.by - 12; yy++) if (dist(get(xx, yy), bg) > BG_TOL) return false;
      return true;
    };
    const step = (u.x1 - u.x0) / k;
    const cuts = [];
    for (let i = 1; i < k; i++) {
      const target = u.x0 + step * i;
      let cut = -1;
      for (let d = 0; d <= step * 0.3 && cut < 0; d++) {
        if (colEmpty(Math.round(target + d))) cut = Math.round(target + d);
        else if (colEmpty(Math.round(target - d))) cut = Math.round(target - d);
      }
      if (cut >= 0) cuts.push(cut);
    }
    if (!cuts.length) continue;
    uniq.splice(uniq.indexOf(u), 1);
    const edges = [u.x0, ...cuts, u.x1];
    for (let i = 0; i < edges.length - 1; i++) {
      uniq.push({ x0: edges[i], x1: edges[i + 1], cx: (edges[i] + edges[i + 1]) / 2, by: u.by });
    }
  }
  // 3) agrupa em linhas pela altura da sombra
  const rows = [];
  for (const s of uniq.sort((a, b) => a.by - b.by)) {
    const r = rows.find((rr) => Math.abs(rr.by - s.by) < 24);
    if (r) { r.items.push(s); r.by = Math.max(r.by, s.by); } else rows.push({ by: s.by, items: [s] });
  }
  rows.sort((a, b) => a.by - b.by);
  // linhas com menos de 3 sombras são falsos positivos (lâminas, chapéus...)
  for (let i = rows.length - 1; i >= 0; i--) if (rows[i].items.length < 3) rows.splice(i, 1);
  // 4) região de cada quadro e caixa do conteúdo
  const frames = [];
  rows.forEach((row, ri) => {
    row.items.sort((a, b) => a.cx - b.cx);
    const top = ri === 0 ? 0 : rows[ri - 1].by + 6;
    const bottom = Math.min(H - 1, row.by + 4);
    row.items.forEach((s, i) => {
      const left = i === 0 ? 0 : Math.ceil((row.items[i - 1].cx + s.cx) / 2);
      const right = i === row.items.length - 1 ? W - 1 : Math.floor((s.cx + row.items[i + 1].cx) / 2);
      let bx0 = W, bx1 = -1, by0 = H, by1 = -1;
      for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
        if (isBg(x, y)) continue;
        bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y);
      }
      if (bx1 < 0) return;
      frames.push({
        id: frames.length, row: ri, x: bx0, y: by0, w: bx1 - bx0 + 1, h: by1 - by0 + 1,
        region: { left, right, top, bottom }, shadow: { x0: s.x0, x1: s.x1, cx: s.cx, by: s.by },
      });
    });
  });
  return frames;
}

// ---------------------------------------------------------------------
// Detecção principal: linhas pelas sombras + personagens pela faixa do tronco.
// O tronco (entre a cintura e o peito) quase nunca encosta no quadro vizinho,
// diferente de armas, rastros de golpe e poeira.
// ---------------------------------------------------------------------
function detectFrames(sheet, { torsoTop = 46, torsoBottom = 12, minGap = 3 } = {}) {
  const { W, H, get, bg } = sheet;
  const shadowFrames = detectByShadows(sheet);
  const rowsBy = new Map();
  for (const f of shadowFrames) {
    const r = rowsBy.get(f.row) || { by: 0, shadows: [] };
    r.by = Math.max(r.by, f.shadow.by); r.shadows.push(f.shadow); rowsBy.set(f.row, r);
  }
  const rows = [...rowsBy.values()].sort((a, b) => a.by - b.by);
  const isFg = (x, y) => dist(get(x, y), bg) > BG_TOL;
  const frames = [];
  rows.forEach((row, ri) => {
    const top = ri === 0 ? 0 : rows[ri - 1].by + 6;
    const bottom = Math.min(H - 1, row.by + 4);
    const y0 = Math.max(top, row.by - torsoTop), y1 = row.by - torsoBottom;
    const filled = (x) => { let n = 0; for (let y = y0; y <= y1; y++) if (isFg(x, y)) n++; return n >= 2; };
    const figs = []; let s = -1, gap = 0;
    for (let x = 0; x < W; x++) {
      if (filled(x)) { if (s < 0) s = x; gap = 0; }
      else if (s >= 0 && ++gap >= minGap) { figs.push([s, x - gap]); s = -1; gap = 0; }
    }
    if (s >= 0) figs.push([s, W - 1]);
    let items = figs.filter(([a, b]) => b - a >= 4).map(([a, b]) => ({ x0: a, x1: b }));
    // pedaços estreitos (ponta de arma, rastro) juntam-se ao vizinho mais próximo
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      if (it.x1 - it.x0 >= 16 || items.length < 2) continue;
      const dl = i > 0 ? it.x0 - items[i - 1].x1 : Infinity;
      const dr = i < items.length - 1 ? items[i + 1].x0 - it.x1 : Infinity;
      const j = dl <= dr ? i - 1 : i + 1;
      items[j] = { x0: Math.min(items[j].x0, it.x0), x1: Math.max(items[j].x1, it.x1), core: items[j].core || [items[j].x0, items[j].x1] };
      items.splice(i, 1);
    }
    items = items.map((it) => { const [c0, c1] = it.core || [it.x0, it.x1]; return { ...it, cx: (c0 + c1) / 2 }; });
    items.forEach((it, i) => {
      const left = i === 0 ? 0 : Math.ceil((items[i - 1].x1 + it.x0) / 2);
      const right = i === items.length - 1 ? W - 1 : Math.floor((it.x1 + items[i + 1].x0) / 2);
      let bx0 = W, bx1 = -1, by0 = H, by1 = -1;
      for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
        if (!isFg(x, y)) continue;
        bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y);
      }
      if (bx1 < 0) return;
      // sombra sob o personagem (ponto de apoio); senão, centro do tronco
      const sh = row.shadows.filter((q) => q.cx >= it.x0 - 6 && q.cx <= it.x1 + 6)
        .sort((a, b) => Math.abs(a.cx - it.cx) - Math.abs(b.cx - it.cx))[0];
      frames.push({
        id: frames.length, row: ri, x: bx0, y: by0, w: bx1 - bx0 + 1, h: by1 - by0 + 1,
        region: { left, right, top, bottom },
        anchor: { x: sh ? sh.cx : it.cx, y: (sh ? sh.by : row.by) - 3 },
      });
    });
  });
  return frames;
}

// Divide quadros com várias poses grudadas: splits = { idDoQuadro: quantidade }
function applySplits(sheet, frames, splits = {}) {
  const { get, bg } = sheet;
  const isFg = (x, y) => dist(get(x, y), bg) > BG_TOL;
  const out = [];
  for (const f of frames) {
    const n = splits[f.id];
    if (!n || n < 2) { out.push(f); continue; }
    const { top, bottom } = f.region;
    const y0 = Math.max(top, f.anchor.y - 43), y1 = f.anchor.y - 9;
    const col = (x) => { let c = 0; for (let y = y0; y <= y1; y++) if (isFg(x, y)) c++; return c; };
    const step = f.w / n, cuts = [];
    for (let k = 1; k < n; k++) {
      const t = f.x + step * k; let best = Math.round(t), bc = Infinity;
      for (let x = Math.round(t - step * 0.35); x <= Math.round(t + step * 0.35); x++) {
        const c = col(x); if (c < bc) { bc = c; best = x; }
      }
      cuts.push(best);
    }
    const edges = [f.region.left, ...cuts, f.region.right];
    for (let k = 0; k < n; k++) {
      const left = k === 0 ? edges[0] : edges[k] + 1, right = edges[k + 1];
      let bx0 = Infinity, bx1 = -1, by0 = Infinity, by1 = -1, tx0 = Infinity, tx1 = -1;
      for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
        if (!isFg(x, y)) continue;
        bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y);
        if (y >= y0 && y <= y1) { tx0 = Math.min(tx0, x); tx1 = Math.max(tx1, x); }
      }
      if (bx1 < 0) continue;
      // âncora: centro do corpo (parte do tronco perto do lado esquerdo do pedaço = corpo, a direita = arma)
      const bodyW = Math.min(tx1 - tx0, 34);
      out.push({ ...f, x: bx0, y: by0, w: bx1 - bx0 + 1, h: by1 - by0 + 1,
        region: { left, right, top, bottom }, anchor: { x: tx0 + bodyW / 2, y: f.anchor.y } });
    }
  }
  return out.map((f, i) => ({ ...f, id: i }));
}

async function preview(file, frames, out) {
  const meta = await sharp(file).metadata();
  const S = 2;
  const rects = frames.map((f) =>
    `<rect x="${f.x * S}" y="${f.y * S}" width="${f.w * S}" height="${f.h * S}" fill="none" stroke="#ff0" stroke-width="1"/>` +
    `<rect x="${f.x * S}" y="${f.y * S}" width="${String(f.id).length * 9 + 4}" height="14" fill="#000"/>` +
    `<text x="${f.x * S + 2}" y="${f.y * S + 11}" font-family="monospace" font-size="13" font-weight="bold" fill="#0ff">${f.id}</text>`).join('');
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${meta.width * S}" height="${meta.height * S}">${rects}</svg>`);
  await sharp(file).resize(meta.width * S, meta.height * S, { kernel: 'nearest' }).composite([{ input: svg }]).png().toFile(out);
}

module.exports = { loadSheet, detect, detectByShadows, detectFrames, applySplits, dist, BG_TOL };

if (require.main === module) {
  (async () => {
    let [file, out] = process.argv.slice(2);
    // aceita o nome de uma folha do tools/sprites.config.js (aplica as divisões)
    let splits = {};
    if (!file.includes('/')) {
      const cfg = require('./sprites.config.js').sheets[file];
      splits = cfg.splits || {}; file = cfg.file;
    }
    const sheet = await loadSheet(file);
    const frames = process.env.MODE === "grid" ? detect(sheet) : process.env.MODE === "shadow" ? detectByShadows(sheet) : applySplits(sheet, detectFrames(sheet), splits);
    console.log(`${file}: bg=${sheet.bg} quadros=${frames.length}`);
    const byRow = {};
    for (const f of frames) (byRow[f.row] ||= []).push(`${f.id}:${f.w}x${f.h}`);
    for (const [r, l] of Object.entries(byRow)) console.log(`  linha ${r}: ${l.join(' ')}`);
    if (out) await preview(file, frames, out);
  })().catch((e) => { console.error(e); process.exit(1); });
}
