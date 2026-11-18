# TechSpec — NPCs e diálogos

PRD: `tasks/prd-npcs-e-dialogos/prd.md`

## Resumo

NPCs viram um terceiro tipo de entidade (`Npc`, em `src/npcs.js`), declarados pelos mapas (`B.npc(...)`) e criados pelo `Game` ao entrar no mapa, como as zonas de inimigos. Eles não entram no combate: a colisão com o grupo é resolvida pelo `Game` com uma separação simples entre círculos, sem alterar a grade estática do `World`.

A conversa é dividida em três partes:
- **Conteúdo:** `src/dialogues.js`, só dados, fácil de editar (RF12).
- **Lógica:** `src/dialog-runner.js`, pura e testável no Node. Cuida de páginas, letra a letra, escolhas e variantes por flag.
- **Desenho:** `src/ui/dialog.js`.

Um modo novo do `Game`, `dialog`, congela o mundo e entrega o teclado à caixa. A interação por **E** passa a escolher o alvo mais próximo entre cristais e NPCs.

## Arquitetura

### Módulos novos e alterados

| Arquivo | Novo/Alterado | Responsabilidade | Depende de |
| :--- | :--- | :--- | :--- |
| `src/dialogues.js` | Novo | Nome e falas de cada NPC (variantes por flag, escolhas, ações) | — |
| `src/dialog-runner.js` | Novo | Máquina de estados da conversa: quebra de linha, páginas, letra a letra, escolhas, fim | `data.js` (constantes) |
| `src/npcs.js` | Novo | Entidade `Npc`: parado/passeio, virar para o líder, animação com balanço, desenho | `data.js`, `sprites.js` |
| `src/ui/dialog.js` | Novo | Desenho da caixa, aba de nome, seta, janela de escolhas; repassa teclas ao runner | `ui/ui.js`, `dialog-runner.js` |
| `src/data.js` | Alterado | `NPC_TUNING` (velocidades, alcance, pausas) e `DIALOG` (letras/s, caracteres por linha, linhas por página) | — |
| `src/maps/builder.js` | Alterado | `B.npc(id, tx, ty, { dir, wander })`; `build()` devolve `npcs` | — |
| `src/maps/adventure1.js` | Alterado | 4 NPCs na vila (`buildVila`) | `builder.js` |
| `src/world.js` | Alterado | Guarda `npcs` do layout (só dados) | — |
| `src/game.js` | Alterado | Cria/atualiza/desenha NPCs; modo `dialog`; separação herói–NPC; interação pelo alvo mais próximo; aviso "E: Falar" | `npcs.js`, `ui/dialog.js`, `dialogues.js` |
| `tests/dialog.test.mjs` | Novo | TU do runner e do NPC | — |
| `tests/maps.test.mjs`, `tests/content.test.mjs` | Alterado | TI dos NPCs nos mapas e das falas | — |

A direção de dependências (`folder-structure.md#5`) é respeitada: `dialogues.js` e `dialog-runner.js` são módulos de base; `npcs.js` fica no nível das entidades; `ui/dialog.js` não importa `game.js` nem entidades; só o `game.js` orquestra.

### Fluxo

```text
enterMap -> world.npcs (dados) -> game.npcs = new Npc(...) para cada um
play: E -> nearInteractable() (mais próximo entre cristal e NPC, raio 28)
      -> NPC: npc.startTalk(leader); script = pickVariant(DIALOGUES[id], game.flags)
      -> game.mode = 'dialog'; game.dialog = new DialogBox(new DialogRunner(script, name), onClose)
dialog: DialogBox.update(dt, input) -> runner.tick/confirm/move/cancel
      -> runner.done -> onClose -> npc.endTalk(); game.mode = 'play'
      -> opção com action: game.dialogAction(action) (hoje: 'soon')
```

## Contratos de dados

### `DIALOGUES` (src/dialogues.js) — falas de cada NPC

| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `[npcId]` | objeto | sim | Chave igual ao id da folha `npcs` (`mercador_fazenda`...) |
| `.name` | string | sim | Nome na aba da caixa (sem acentos) |
| `.talk` | `Variant[]` | sim | Lista de variantes; vale a **primeira** cujo `if` está ativo (ou sem `if`) |
| `Variant.if` | string | não | Flag exigida (ex.: `'bosque'`) |
| `Variant.say` | string[] | sim | Falas em sequência (cada uma pode ocupar várias páginas) |
| `Variant.ask` | `Ask` | não | Pergunta exibida após a última fala |
| `Ask.options` | `Option[]` (2–4) | sim | A última é a opção de saída (usada por K/Esc) |
| `Option.label` | string | sim | Texto da opção (até 12 caracteres) |
| `Option.say` | string[] | não | Falas após escolher |
| `Option.action` | string | não | Ação do jogo após as falas (hoje `'soon'`; na loja: `'shop'`, `'sell'`, `'inn'`) |

```javascript
export const DIALOGUES = {
  mercador_fazenda: {
    name: 'Mercador',
    talk: [
      { if: 'bosque', say: ['Dizem que voce acalmou o Treant Anciao! Meus clientes voltaram a sorrir.'] },
      {
        say: ['Bem-vindo! Tenho de tudo um pouco para quem vai encarar a floresta.'],
        ask: { options: [
          { label: 'Comprar', action: 'soon' }, { label: 'Vender', action: 'soon' },
          { label: 'Sair', say: ['Volte sempre!'] },
        ] },
      },
    ],
  },
};
```

> Variantes com `if` precisam vir **antes** da variante padrão.

### `NPC` no layout do mapa (`B.npc`)

| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | string | sim | Id do NPC (sprite `npcs` + `DIALOGUES`) |
| `x, y` | número (px) | sim | Posição dos pés (`B.npc` recebe blocos e converte) |
| `dir` | `'down'\|'up'\|'left'\|'right'` | não | Direção inicial (padrão `down`) |
| `wander` | número (blocos) | não | Raio de passeio; `0`/ausente = parado |

### Constantes em `data.js`

```javascript
export const NPC_TUNING = { speed: 25, radius: 6, talkRange: 28, pause: [1.5, 4] };
export const DIALOG = { charsPerSecond: 40, maxChars: 84, linesPerPage: 3 };
```

### Estado da campanha e save

| Campo novo | Onde vive | Vai para o save? | Valor no novo jogo |
| :--- | :--- | :--- | :--- |
| `npcs` | `game.npcs` (recriado em `enterMap`) | não | conforme o mapa |
| `dialog` | `game.dialog` (só durante a conversa) | não | `null` |

- `SAVE_VERSION`: mantém (nada novo é salvo; as variantes usam `flags`, que já são salvas).

## Integração com o jogo

- **Modos:** novo modo `dialog`. Entra por `game.talkTo(npc)` e sai pelo callback da caixa. Em `dialog`, `Enter/Esc` não abrem o menu (a caixa recebe o teclado) e o mundo não atualiza (heróis, inimigos, `timers`, `playTime`).
- **Update (`play`):** depois de `heroes.update` vêm `npcs.update(dt, game)` e `separateFromNpcs()`. Para cada herói vivo e cada NPC com `dist < r1 + r2`, o herói é empurrado para fora pela normal; se a nova posição colidir com o mundo, o empurrão é desfeito. O NPC que passeia não inicia passo se o destino ficar a menos de `r + 6` de um herói.
- **Interação:** `nearInteractable()` passa a montar a lista `world.interactables + game.npcs`, filtrar por `talkRange` e devolver o **mais próximo** (CA-05). Devolve `{ kind: 'save' | 'npc', ref }`. O aviso mostra "E: Salvar" ou "E: Falar".
- **Render:** NPCs entram na lista ordenada por `y` junto com heróis, inimigos e objetos. A caixa é desenhada depois do HUD, antes do fade.
- **Combate:** NPCs não estão em `enemies` nem em `heroes`; hitboxes os ignoram. Enquanto houver inimigos por perto, conversar continua permitido (o mundo congela).
- **Mapas:** `B.npc` reserva o bloco (para não nascer árvore em cima) e grava em `this.npcs`; `build()` inclui `npcs`; `World` guarda `this.npcs = L.npcs || []`.

## Interface

- **Caixa:** `win(10, 196, 460, 64)` (a mesma janela azul do jogo), sobre o HUD.
- **Aba de nome:** `win(18, 186, largura do nome + 16, 16)`, com o nome em amarelo.
- **Texto:** 8 px, linhas em `y = 216, 230, 244`, começando em `x = 24`.
- **Seta de continuar:** triângulo piscando em `(456, 252)` quando a página está completa e há mais.
- **Escolhas:** `win(360, 196 - 8 - 16·n, 110, 16·n + 8)`, com opções em 8 px e o `cursor` de `ui/ui.js`.
- **Aviso no mapa:** `E: Falar` 40 px acima da cabeça do NPC (como o do cristal).
- **Teclas (via `ui/ui.js`):**
  - `confirm` (J/Z/Enter/Espaço): completa a página ou avança.
  - `navY`: escolhe a opção.
  - `back` (K/X/Esc): escolhe a última opção (só quando há escolhas na tela).

## Conteúdo e arte

| Item | Origem | Placeholder | Pipeline |
| :--- | :--- | :--- | :--- |
| Sprites dos 4 NPCs da fazenda | REC-01 (entregue) | — | já integrado (folha `npcs`) |
| Falas dos 4 NPCs | Escritas pelo agente no tom "aventura leve" | — | `src/dialogues.js` |

Posições na vila (blocos):
- **Mercador:** (16, 30), atrás da barraca vermelha (16, 28), virado para baixo.
- **Estalajadeira:** (31, 42), em frente à casa (31, 38), virada para baixo.
- **Velho Agricultor:** (45, 28), passeio com raio de 2 perto do campo.
- **Jovem Aprendiz:** (10, 33), passeio com raio de 2 perto do lago.

As posições finais são ajustadas no E2E para não bloquear estradas.

## Abordagem de testes

### Testes de unidade (`tests/dialog.test.mjs`)

| ID | Caso | CA | Resultado esperado |
| :--- | :--- | :--- | :--- |
| TU-01 | `wrapText` quebra em palavras sem passar de `maxChars` e pagina em até 3 linhas | CA-11 | Nenhuma linha > 84; páginas com ≤ 3 linhas; texto reconstituído igual ao original |
| TU-02 | `pickVariant` escolhe a variante da flag ativa, senão a padrão | CA-09 | Com `{bosque:true}` → variante `if:'bosque'`; sem → padrão |
| TU-03 | `confirm` durante a digitação completa a página; o seguinte avança; o último encerra | CA-06 | `visible === page.length` → próxima página → `done` |
| TU-04 | `tick(dt)` revela ~40 letras/s | CA-06 | Após 0,5 s, ~20 letras visíveis |
| TU-05 | Escolha: `move(+1)` + `confirm` segue as falas da opção; `cancel` escolhe a última | CA-07 | Falas da opção exibidas; `cancel` → falas de "Sair" |
| TU-06 | Opção com `action` termina a conversa entregando a ação | CA-08 | `runner.action === 'soon'` ao terminar |
| TU-07 | NPC que passeia nunca sai do raio após 60 s simulados (mundo sem obstáculos) | CA-03 | Distância da origem ≤ `wander·16 + 1` o tempo todo |
| TU-08 | `startTalk` vira o NPC para o líder e para o passeio; `endTalk` retoma | CA-04 | `dir`/`faceX` apontam para o líder; estado `talk` → `idle` |

### Testes de integração de conteúdo

| ID | Caso | CA | Resultado esperado |
| :--- | :--- | :--- | :--- |
| TI-01 | Todo NPC de todos os mapas tem entrada em `DIALOGUES` e as 6 animações na folha `npcs` | CA-01, CA-12 | Sem NPC órfão |
| TI-02 | NPCs em chão andável, fora das saídas, e o mapa continua alcançável tratando cada NPC como bloqueio | CA-02, CA-12 | Entradas, saídas e cristal alcançáveis |
| TI-03 | Toda variante tem `say` não vazio, opções entre 2 e 4, rótulos ≤ 12 caracteres | CA-07, CA-11 | Conteúdo válido |
| TI-04 | Todo NPC da vila tem uma variante `if: 'bosque'` diferente da padrão | CA-09 | Textos diferentes |
| TI-05 | Velho Agricultor e Jovem Aprendiz citam floresta, caverna ou cristal | CA-10 | Ao menos uma fala com a palavra |
| TI-06 | Mercador tem Comprar/Vender/Sair e a Estalajadeira tem Descansar/Sair, com `action: 'soon'` | CA-08 | Opções presentes |

### Testes ponta a ponta (navegador)

| ID | Fluxo | CA | Resultado esperado |
| :--- | :--- | :--- | :--- |
| E2E-01 | Novo jogo → olhar a vila (captura ampliada em 4 pontos) | CA-01 | 4 NPCs nas posições, ordenados por profundidade com casas e árvores |
| E2E-02 | Andar contra o Mercador por 1 s | CA-02 | Líder não atravessa; `dist ≥ r1 + r2 - 1` |
| E2E-03 | Observar o Velho por 30 s (`window.game`) | CA-03 | Posição sempre dentro do raio; houve movimento e pausas |
| E2E-04 | Encostar no Aprendiz e apertar E | CA-04, CA-10 | `mode === 'dialog'`, nome correto, NPC virado, inimigos e tempo parados; fala com dica |
| E2E-05 | Ficar entre o cristal e a Estalajadeira, mais perto dela, e apertar E | CA-05 | Abre o diálogo (não o save); mais perto do cristal → abre o save |
| E2E-06 | J durante a digitação, J de novo, J até fechar | CA-06 | Completa, avança, fecha, `mode === 'play'` |
| E2E-07 | Mercador: setas + J em Comprar; outra conversa: Esc nas escolhas | CA-07, CA-08 | Fala "em breve"; Esc → "Volte sempre!" |
| E2E-08 | `game.flags.bosque = true` e conversar com os 4 | CA-09 | Falas da variante pós-chefe |
| E2E-09 | Captura ampliada da caixa com a fala mais longa | CA-11 | 3 linhas dentro da caixa, nada cortado |

## Sequenciamento

1. **Conteúdo e lógica pura** (`data.js`, `dialogues.js`, `dialog-runner.js`) + TU-01–06, TI-03–06. É a base de tudo e testável sem navegador.
2. **NPC** (`npcs.js`) + TU-07–08: entidade isolada, com o mundo simulado nos testes.
3. **Mapas** (`builder.js`, `world.js`, `adventure1.js`) + TI-01–02: NPCs declarados na vila.
4. **Integração no `Game`** (criação, update, separação, interação, render, modo `dialog`) + `ui/dialog.js`: E2E-01–09.
5. **Ajuste fino e documentação**: posições, textos, `README.md` (controles e conteúdo), `AGENTS.md` (modo `dialog`), `game-architecture.md` (modos, entidades), `maps-and-adventures.md` (`B.npc`), `CHANGELOG.md`.

## Riscos

| Risco | Mitigação |
| :--- | :--- |
| `game.js` já passa de 400 linhas | Toda a lógica nova fica em módulos próprios; o `game.js` recebe só a costura (~40 linhas). A extração já está registrada na dívida técnica |
| NPC empurra herói para dentro de parede | A separação desfaz o empurrão se a posição nova colidir; o NPC não começa passo perto de herói |
| NPC preso em objeto durante o passeio | Escolhe outro destino após 1 s sem progresso; a área de passeio é pequena e checada no E2E-03 |
| Texto não cabe em outra fonte do sistema | Margem de ~20% (84 x 4,4 px = 370 px numa área de 436 px); E2E-09 confere |
| Conversa aberta perto de inimigos | O mundo congela no modo `dialog`; nenhum dano acontece durante a conversa |

## Principais decisões

| Decisão | Motivo | Alternativa descartada |
| :--- | :--- | :--- |
| `DialogRunner` puro separado do desenho | Testável no Node (TU-01–06) e reutilizável pela loja | Lógica dentro da classe de UI |
| Variantes por flag ("a primeira que vale") | Simples de escrever e de ler para o dono do projeto | Árvore de diálogo com nós e saltos |
| Escolhas com um nível + `action` | Cobre as conversas atuais e a loja/estalagem | Diálogos ramificados profundos (fora do escopo) |
| Colisão herói–NPC por separação de círculos no `Game` | NPCs se movem; a grade do `World` é estática e pintada uma vez | Atualizar a grade de colisão a cada passo |
| Quebra de linha por caracteres (fonte monoespaçada) | Determinística e testável sem canvas | `measureText` em tempo real |
| Falas em `src/dialogues.js` | Arquivo só de texto, fácil de editar (RF12) | JSON externo (exigiria carregamento assíncrono) |

## Conformidade

- **AGENTS.md e rules:** li `AGENTS.md` e todas as rules. As relevantes:
  - `game-architecture.md#2`: modo novo com classe de UI e callback de fechamento.
  - `game-architecture.md#4`: contrato de entidade (NPC sem combate).
  - `game-architecture.md#7`: ordem de desenho.
  - `folder-structure.md#5`: dependências.
  - `javascript.md#2`: sem DOM no topo; o runner e o NPC são testáveis no Node.
  - `code-standards.md#5`: números em `data.js`.
  - `code-standards.md#1`: texto do canvas sem acentos.
  - `maps-and-adventures.md#4`: a API do builder ganha `npc`.
  - `tests.md`: TU/TI/E2E.
  - `documentation.md`: docs a atualizar no passo 5.
- **Skills aplicáveis:** nenhuma de apoio (sprites já integrados por `/integrar-sprites`). Fluxo: `/criar-tasks` → `/executar-task` → `/executar-review` → `/executar-qa`.

## Arquivos relevantes

- Lidos: `src/game.js`, `src/world.js`, `src/maps/builder.js`, `src/maps/adventure1.js`, `src/data.js`, `src/sprites.js`, `src/ui/ui.js`, `src/ui/slots.js`, `src/heroes.js` (padrão de animação), `tests/*.test.mjs`, `tools/sprites.config.js`.
- Criados: `src/dialogues.js`, `src/dialog-runner.js`, `src/npcs.js`, `src/ui/dialog.js`, `tests/dialog.test.mjs`.
- Alterados: `src/data.js`, `src/maps/builder.js`, `src/maps/adventure1.js`, `src/world.js`, `src/game.js`, `tests/maps.test.mjs`, `tests/content.test.mjs`, documentação.
