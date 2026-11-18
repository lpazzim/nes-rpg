// =====================================================================
// EXECUTOR DE CONVERSAS (lógica pura, sem desenho)
// Recebe as falas de um NPC (src/dialogues.js) e controla:
//   - quebra de linha e páginas (até 3 linhas)
//   - texto aparecendo letra a letra
//   - escolhas (setas + confirmar; cancelar = última opção)
//   - fim da conversa e a "ação" escolhida (ex.: 'shop', 'sell', 'inn')
// A caixa na tela (src/ui/dialog.js) só lê este estado e repassa as teclas.
// =====================================================================
import { DIALOG } from './data.js';

// Quebra o texto em linhas de até maxChars, sem cortar palavras
// (palavras maiores que a linha são cortadas à força).
export function wrapText(text, maxChars) {
  const lines = [];
  let line = '';
  for (let word of text.split(/\s+/).filter(Boolean)) {
    while (word.length > maxChars) {
      if (line) { lines.push(line); line = ''; }
      lines.push(word.slice(0, maxChars)); word = word.slice(maxChars);
    }
    if (!line) line = word;
    else if (line.length + 1 + word.length <= maxChars) line += ` ${word}`;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}

// Divide uma fala em páginas de até linesPerPage linhas
export function paginate(text, maxChars = DIALOG.maxChars, linesPerPage = DIALOG.linesPerPage) {
  const lines = wrapText(text, maxChars), pages = [];
  for (let i = 0; i < lines.length; i += linesPerPage) pages.push(lines.slice(i, i + linesPerPage));
  return pages;
}

// Primeira versão da conversa cuja flag está ativa (ou a padrão, sem "if")
export function pickVariant(def, flags = {}) {
  return def.talk.find((v) => !v.if || flags[v.if]) || def.talk[def.talk.length - 1];
}

export class DialogRunner {
  constructor(def, flags = {}, cfg = DIALOG) {
    this.cfg = cfg;
    this.name = def.name;
    const v = pickVariant(def, flags);
    this.ask = v.ask || null;
    this.asked = false;       // a pergunta já foi mostrada?
    this.choices = null;      // opções na tela (enquanto escolhe)
    this.sel = 0;
    this.done = false;
    this.action = null;       // ação entregue ao fim (ex.: 'shop')
    this.pendingAction = null;
    this.load(v.say);
  }

  load(says = []) {
    this.pages = says.flatMap((s) => paginate(s, this.cfg.maxChars, this.cfg.linesPerPage));
    this.index = 0; this.shown = 0;
    if (!this.pages.length) this.next();
  }

  get lines() { return this.pages[this.index] || []; }
  get pageLength() { return this.lines.reduce((n, l) => n + l.length, 0); }
  get visible() { return Math.min(this.pageLength, Math.floor(this.shown)); }
  get pageComplete() { return this.visible >= this.pageLength; }
  get choosing() { return !!this.choices; }
  // há mais conteúdo depois desta página? (para a seta piscando)
  get hasMore() { return this.index < this.pages.length - 1 || (!!this.ask && !this.asked); }

  // linhas da página atual cortadas no que já apareceu
  visibleLines() {
    let left = this.visible;
    return this.lines.map((l) => { const s = l.slice(0, Math.max(0, left)); left -= l.length; return s; });
  }

  tick(dt) {
    if (this.done || this.choosing || this.pageComplete) return;
    this.shown = Math.min(this.pageLength, this.shown + this.cfg.charsPerSecond * dt);
  }

  confirm() {
    if (this.done) return;
    if (this.choosing) { this.choose(this.sel); return; }
    if (!this.pageComplete) { this.shown = this.pageLength; return; }
    this.next();
  }

  move(dir) {
    if (!this.choosing) return;
    const n = this.choices.length;
    this.sel = (this.sel + dir + n) % n;
  }

  // cancelar = escolher a última opção (normalmente "Sair")
  cancel() {
    if (this.choosing) this.choose(this.choices.length - 1);
  }

  next() {
    if (this.index < this.pages.length - 1) { this.index++; this.shown = 0; return; }
    if (this.ask && !this.asked) { this.asked = true; this.choices = this.ask.options; this.sel = 0; return; }
    this.done = true;
    this.action = this.pendingAction;
  }

  choose(i) {
    const opt = this.choices[i];
    this.choices = null;
    this.pendingAction = opt.action || null;
    this.load(opt.say || []);
  }
}
