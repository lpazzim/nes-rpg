// =====================================================================
// TESTES DA FONTE BITMAP (src/font.js)
// Protegem contra erro de digitação na tabela de desenhos das letras.
// =====================================================================
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GLYPHS, GLYPH_W, GLYPH_H, ADVANCE, fontScale, textWidth, textHeight } from '../src/font.js';

test('todo caractere ASCII imprimível tem desenho', () => {
  const faltando = [];
  for (let c = 32; c <= 126; c++) {
    const ch = String.fromCharCode(c);
    if (!GLYPHS[ch]) faltando.push(`${ch} (${c})`);
  }
  assert.deepEqual(faltando, [], `sem desenho: ${faltando.join(', ')}`);
});

test('cada desenho tem 8 linhas de 5 colunas, só com "#" e "."', () => {
  for (const [ch, linhas] of Object.entries(GLYPHS)) {
    assert.equal(linhas.length, GLYPH_H, `"${ch}" tem ${linhas.length} linhas`);
    for (const l of linhas) {
      assert.equal(l.length, GLYPH_W, `"${ch}": linha "${l}" com ${l.length} colunas`);
      assert.ok(/^[.#]+$/.test(l), `"${ch}": linha "${l}" com caractere estranho`);
    }
  }
});

test('o espaço é vazio e as outras letras têm pixels acesos', () => {
  assert.ok(GLYPHS[' '].every((l) => !l.includes('#')), 'o espaço não pode ter pixel aceso');
  for (const [ch, linhas] of Object.entries(GLYPHS)) {
    if (ch === ' ') continue;
    assert.ok(linhas.some((l) => l.includes('#')), `"${ch}" está em branco`);
  }
});

test('nenhuma letra invade a linha da cauda sem precisar', () => {
  const comCauda = new Set(['g', 'j', 'p', 'q', 'y', ',', ';', '_']);
  for (const [ch, linhas] of Object.entries(GLYPHS)) {
    if (comCauda.has(ch)) continue;
    assert.ok(!linhas[7].includes('#'), `"${ch}" desenha na linha de baixo e vai encostar na linha seguinte`);
  }
});

test('a escala é inteira (1x, 2x ou 3x): é isso que mantém o texto nítido', () => {
  for (const [size, esperado] of [[7, 1], [8, 1], [9, 1], [10, 1], [12, 2], [16, 2], [24, 3], [99, 3]]) {
    assert.equal(fontScale(size), esperado, `tamanho ${size}`);
  }
});

test('largura e altura do texto acompanham a escala', () => {
  assert.equal(textWidth('abc', 8), 3 * ADVANCE);
  assert.equal(textWidth('abc', 16), 3 * ADVANCE * 2);
  assert.equal(textWidth('', 8), 0);
  assert.equal(textHeight(8), 7);
  assert.equal(textHeight(24), 21);
});

test('as falas cabem na caixa de dialogo com a fonte atual', async () => {
  const { DIALOG, VIEW_W } = await import('../src/data.js');
  const larguraUtil = VIEW_W - 20 - 28;        // caixa (10 de margem) menos o recuo do texto
  const linhaCheia = textWidth('x'.repeat(DIALOG.maxChars), 8);
  assert.ok(linhaCheia <= larguraUtil, `maxChars ${DIALOG.maxChars} daria ${linhaCheia} px, cabe ${larguraUtil}`);
});

test('os textos do jogo não usam caractere sem desenho', () => {
  const root = fileURLToPath(new URL('../src', import.meta.url));
  const arquivos = [];
  (function walk(d) {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (f.endsWith('.js')) arquivos.push(p);
    }
  })(root);

  for (const f of arquivos) {
    const linhas = readFileSync(f, 'utf8').split('\n');
    linhas.forEach((linha, i) => {
      if (!/outlineText\(|text\(ctx|announce\(/.test(linha)) return;
      for (const m of linha.matchAll(/'([^'\\]*)'/g)) {
        for (const ch of m[1]) {
          assert.ok(GLYPHS[ch], `${f}:${i + 1}: "${ch}" nao tem desenho na fonte`);
        }
      }
    });
  }
});
