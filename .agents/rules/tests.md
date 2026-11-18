# Testes e Verificação

O jogo é validado em duas frentes: **testes automáticos** (lógica e integridade de conteúdo) e **verificação no navegador** (o que só se vê jogando).

---

## 1. Pirâmide do projeto

| Camada | ID | Ferramenta | O que cobre |
| :--- | :--- | :--- | :--- |
| Unidade | `TU-*` | `node:test` | Lógica pura: dano, XP, efeitos de item, gerador de dungeon, cálculos de loja |
| Integração de conteúdo | `TI-*` | `node:test` com os dados reais | Mapas (saídas/entradas/alcance/determinismo), sprites x dados, itens, skills sincronizadas |
| Ponta a ponta | `E2E-*` | Navegador do preview + `window.game` | Fluxos jogáveis: título → jogo → menu → save → troca de mapa → chefe |

Não há meta de cobertura numérica. A regra é: **toda regra de jogo nova com número ou condição ganha um `TU`, e todo conteúdo novo (mapa, inimigo, item) passa pelos testes de integridade.**

---

## 2. Testes automáticos

```sh
npm test      # node --test "tests/**/*.test.mjs"
```

- Arquivos em `tests/<assunto>.test.mjs`, importando `../src/...` (ES modules).
- Nomes de teste em português, descrevendo o comportamento: `'poção cura sem passar do máximo'`.
- Estrutura AAA (preparar, agir, verificar), um comportamento por teste.
- Aleatoriedade: fixe `Math.random` com uma sequência (veja `withRandom` em `rules.test.mjs`) ou use sementes.
- **Nada de DOM** nos testes. Se um módulo precisar de DOM ao ser importado, ele está violando [javascript.md](javascript.md#2-sem-dom-no-topo-do-módulo).
- Teste que cobre conteúdo deve iterar sobre **todos** os itens da tabela (todos os mapas, todos os inimigos), para que o conteúdo novo seja testado sem mexer no teste.

---

## 3. Testes existentes

| Arquivo | Garante |
| :--- | :--- |
| `maps.test.mjs` | Saídas apontam para mapa e entrada existentes; entradas andáveis e fora de saídas; tudo alcançável; tipos de inimigo válidos; mapas determinísticos |
| `content.test.mjs` | Animações obrigatórias de heróis e inimigos (por comportamento); quadros válidos; atributos de inimigo; itens; `.claude/skills` sincronizado |
| `rules.test.mjs` | Dano mínimo, crítico, curva de XP, dados dos heróis |
| `shop.test.mjs` | Comprar, vender, descansar: ouro nunca negativo, bolsa entre 1 e 99, entradas inválidas recusadas, 500 operações aleatórias com semente |
| `systems.test.mjs` | XP (`gainXp`) e guarda de tamanho: nenhum arquivo de `src/` passa de 400 linhas (exceto `map/art.js`) |
| `dialog.test.mjs` | Quebra de linha e páginas, letra a letra, escolhas, versões por flag, passeio e conversa do NPC |

Os testes de mapa também conferem os NPCs (falas, animações, chão andável e caminhos livres), e os de conteúdo conferem as falas (sem acentos, opções, versões pós-chefe).

---

## 4. Verificação no navegador

1. Inicie o preview `my-rpg` (`.claude/launch.json`) e recarregue a página.
2. Leia o console: **zero erros** depois de carregar e depois do fluxo testado.
3. Execute o fluxo pelo teclado simulado ou por atalhos no `window.game`:

```javascript
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const tap = async (code) => {
  dispatchEvent(new KeyboardEvent('keydown', { code })); await wait(40);
  dispatchEvent(new KeyboardEvent('keyup', { code })); await wait(60);
};
await tap('Enter');                       // título -> novo jogo
game.enterMap('floresta', 'caverna');     // pular para um ponto
game.leader.x = 63 * 16 + 8;              // andar até uma saída (troca de mapa após o fade)
```

4. Para **ver** detalhes, use um viewport de 960x540 e mostre o canvas ampliado:

```javascript
const img = document.createElement('img');
img.id = 'dbgimg'; img.src = document.getElementById('game').toDataURL();
img.style.cssText = 'position:fixed;inset:0;width:100vw;image-rendering:pixelated;z-index:99';
document.body.appendChild(img);           // remova depois: document.getElementById('dbgimg').remove()
```

5. Cuidado com o tempo: a troca de mapa leva fade (0,6 s) + proteção contra re-entrada (0,6 s). Espere até o `game.world.id` mudar antes do próximo passo.
6. Ao terminar: remova overlays, recarregue a página e volte o viewport ao normal.

### Checklist de jogo (QA)

- [ ] Controles respondem (andar, J/K/L, esquiva, Tab, Enter/Esc, E)
- [ ] Texto legível a 480x270, sem sobrepor o HUD
- [ ] Feedback visual de dano, cura, bloqueio, level up e troca de mapa
- [ ] Sem travadas perceptíveis em mapas grandes (o jogo continua a ~60 fps)
- [ ] Save e carregamento preservam o estado novo
- [ ] Sem erros no console
