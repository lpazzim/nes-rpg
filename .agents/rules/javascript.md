# Diretrizes de JavaScript

O jogo roda **direto no navegador, sem build**. As ferramentas rodam no Node.

---

## 1. Módulos

| Pasta | Sistema de módulos | Motivo |
| :--- | :--- | :--- |
| `src/` | ES modules (`import`/`export`), marcado por `src/package.json` (`"type": "module"`) | O navegador carrega direto; o Node também importa nos testes |
| `tools/`, `server.js` | CommonJS (`require`) | Scripts Node simples |
| `tests/` | ES modules com extensão `.mjs` | Importam `src/` diretamente |

- Sempre importe com caminho relativo **e extensão**: `import { TILE } from './data.js';`.
- **Nenhuma dependência de npm no navegador.** Dependências só como `devDependencies`, usadas por `tools/`.

---

## 2. Sem DOM no topo do módulo

Módulos de `src/` não podem acessar `document`, `window`, `localStorage` ou `Image` **no momento em que são importados**. Esse acesso fica dentro de funções. É isso que permite aos testes importarem mapas, dados e regras no Node.

```javascript
// ❌ Evite (quebra os testes no Node)
const canvas = document.createElement('canvas');

// ✅ Prefira
export function toCanvas() { const c = document.createElement('canvas'); /* ... */ }
```

Exceções: `main.js` (ponto de entrada) e `input.js` (só é criado pelo `Game`).

---

## 3. Variáveis e comparações

- `const` por padrão; `let` só quando reatribuir; **nunca** `var`.
- Comparação estrita: `===` e `!==`.
- Use `?.` e `??` para opcionais: `h.crit ?? src?.crit ?? 0`.
- Sem ternário aninhado; use `if`/`switch` ou uma tabela de lookup.

---

## 4. Funções e classes

- Entidades com estado e comportamento são classes: `Hero`, `Enemy`, `World`, `Game`, telas de UI.
- Lógica pura e pintores são funções nomeadas: `calcDamage`, `buildDungeon`, `caveFloorTile`.
- Callbacks curtos usam arrow function.
- Métodos que alteram o jogo recebem `game` como parâmetro (`update(dt, game)`). Não importe `game.js` em outros módulos.

---

## 5. Contratos de dados com JSDoc

Estruturas compartilhadas entre módulos (layout de mapa, save, hitbox, definição de inimigo) devem ter o formato documentado. Prefira um bloco `@typedef` perto de quem cria o dado:

```javascript
/**
 * @typedef {Object} Exit  passagem para outro mapa (coordenadas em blocos)
 * @property {number} x0 @property {number} y0 @property {number} x1 @property {number} y1
 * @property {string} to      id do mapa de destino (src/maps/index.js)
 * @property {string} entry   nome da entrada no mapa de destino
 * @property {string} [requires]     flag necessária (ex.: chefe derrotado)
 * @property {boolean} [sealedByBoss] fechada enquanto houver chefe vivo
 */
```

As tabelas de referência desses contratos ficam em [game-architecture.md](game-architecture.md) e [maps-and-adventures.md](maps-and-adventures.md).

---

## 6. Imutabilidade de dados de definição

Tabelas de definição (`HEROES`, `ENEMIES`, `ITEMS`, `MAPS`) **não são alteradas em tempo de jogo**. O estado vive nas instâncias: o herói copia `maxHp` de `data.maxHp` e evolui a própria cópia.

---

## 7. Verificação antes de concluir

```sh
npm test                                              # obrigatório
node --check --input-type=module < src/arquivo.js     # checagem rápida de sintaxe de um módulo
```

Depois, abra o jogo no preview e leia o console (ver [tests.md](tests.md)).
