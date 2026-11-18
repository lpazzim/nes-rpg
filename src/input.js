// Teclado: guarda teclas seguradas (down) e teclas apertadas neste quadro (pressed).
const BLOCKED = new Set([
  'Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
]);

export class Input {
  constructor() {
    this.down = new Set();
    this.pressed = new Set();
    addEventListener('keydown', (e) => {
      if (!this.down.has(e.code)) this.pressed.add(e.code);
      this.down.add(e.code);
      if (BLOCKED.has(e.code)) e.preventDefault();
    });
    addEventListener('keyup', (e) => this.down.delete(e.code));
    addEventListener('blur', () => this.down.clear());
  }

  isDown(...codes) { return codes.some((c) => this.down.has(c)); }
  wasPressed(...codes) { return codes.some((c) => this.pressed.has(c)); }
  endFrame() { this.pressed.clear(); }
}
