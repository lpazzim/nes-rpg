// Copia as skills de .agents/skills (fonte da verdade) para .claude/skills,
// onde o Claude Code as encontra. Rode depois de editar qualquer skill:
//   npm run skills:sync
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, '.agents', 'skills');
const dst = path.join(root, '.claude', 'skills');

fs.rmSync(dst, { recursive: true, force: true });
fs.cpSync(src, dst, { recursive: true });
const count = (dir) => fs.readdirSync(dir, { withFileTypes: true })
  .reduce((n, e) => n + (e.isDirectory() ? count(path.join(dir, e.name)) : 1), 0);
console.log(`skills sincronizadas: ${count(dst)} arquivos em .claude/skills`);
