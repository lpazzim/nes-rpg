# Padrões de Codificação

Diretrizes obrigatórias para todo código do jogo (`src/`), das ferramentas (`tools/`) e dos testes (`tests/`).

---

## 1. Idioma

| O quê | Idioma | Exemplo |
| :--- | :--- | :--- |
| Identificadores (variáveis, funções, classes, arquivos de código) | Inglês | `spawnZone`, `enterMap`, `Hero` |
| Conteúdo do jogo (ids de mapa, entradas, textos, nomes) | Português | `'vila'`, `'caverna'`, `'Pocao'` |
| Comentários e documentação | Português (PT-BR) | `// cristal: cura tudo e abre o save` |
| Texto desenhado no canvas | Português **sem acentos** (fonte do sistema) | `'Nao teve efeito'` |

---

## 2. Cabeçalho de módulo

Todo arquivo de `src/` e `tools/` começa com um bloco que diz **o que o módulo faz** e, quando houver, **como usar/estender**.

```javascript
// =====================================================================
// INIMIGOS (sprites animados + IA)
//   Espantalho -> golpe de foice; às vezes salta sobre o herói
// =====================================================================
```

---

## 3. Comentários: o porquê, não o quê

Comente decisões não óbvias, unidades e armadilhas. Não narre o código.

```javascript
// ❌ Evite
// soma 1 no contador
count += 1;

// ✅ Prefira
// agenda antes: um erro não congela o jogo
requestAnimationFrame(frame);
```

---

## 4. Tamanho

| Unidade | Alvo | Limite | Ao passar do limite |
| :--- | :--- | :--- | :--- |
| Arquivo | até 300 linhas | 400 linhas | Dividir por responsabilidade; se não der agora, registrar em "Dívida técnica" no `AGENTS.md` |
| Função/método | até 40 linhas | 60 linhas | Extrair funções com nomes claros |
| Parâmetros | até 3 | 4 | Usar objeto de opções (`{ seed, theme, rooms }`) |

Pintores de arte pixel a pixel (`src/map/art.js`) podem ter funções maiores, mas cada objeto/bloco deve ser sua própria função.

---

## 5. Números mágicos

- **Balanceamento** (vida, dano, velocidade, preço, XP, tempos de recarga) vive em tabelas: `src/data.js`, `src/items.js` ou no próprio mapa (contagem de inimigos). Nunca espalhe esses números pela lógica.
- **Coordenadas de layout** (posição de casas, estradas, janelas da UI) podem ser literais nos arquivos de mapa e de UI.
- Constantes de módulo em `UPPER_SNAKE_CASE`: `const FADE = 0.3;`, `const CELL = 8;`.

---

## 6. Tempo e quadros

- Todo movimento e cronômetro usa `dt` (segundos). **Nunca** conte quadros.
- Ações atrasadas usam `game.later(segundos, fn)` (pausa junto com o jogo). Não use `setTimeout` na lógica do jogo.
- Cronômetros de entidade decrementam com `Math.max(0, t - dt)` (padrão `TIMERS` em `heroes.js`/`enemies.js`).

---

## 7. Desempenho por quadro

O jogo roda a 60 quadros por segundo; `update` e `render` precisam ser baratos.

- Arte estática é pintada **uma vez** (chão do mapa, objetos, quadros brancos de flash) e reaproveitada com `drawImage`.
- Desenhe só o que está na tela (`visibleObjects`, recorte do chão pela câmera).
- Não crie canvas, imagens ou objetos grandes dentro de `update`/`render`.
- Nada de `fillStyle` + `fillRect` por pixel em tempo real; isso só vale em pintura prévia, e de preferência com `PixelBuf`.

---

## 8. Determinismo

- Conteúdo de mapa (posição de árvores, salas, decoração) usa `hash(x, y, semente)` ou `makeRng(semente)`. O mesmo mapa precisa sair igual sempre (o save depende disso e há teste para isso).
- `Math.random` é permitido só em combate, IA e efeitos visuais.

---

## 9. Erros e robustez

- Use cláusulas de guarda (`if (!x) return;`) em vez de `if` aninhados.
- Dados vindos de fora (save, JSON de sprites) são validados ao carregar: save com versão diferente é ignorado (`readSave`).
- Falha de recurso opcional (retratos) não pode quebrar o jogo: use um fallback.
- Não engula erros de lógica com `try/catch` vazio. A exceção é o loop principal, que registra e segue.
