# Tarefa 4.0: Estalagem (Sim/Não, escurecer e clarear)

## Visão geral

Liga a opção Descansar da Estalajadeira: ela diz o preço e pergunta Sim/Não; com ouro, a tela escurece e clareia, o grupo volta com HP e MP cheios (os caídos revivem) e ela dá bom dia. Sem ouro ou com o grupo já cheio, ela avisa e não cobra. Dá para ver jogando na vila.

<rules>
### Conformidade com o AGENTS.md e as rules

- `game-architecture.md#2`: o fade continua congelando o mundo; agora aceita `dur`, `onMid` e `onEnd` (`startTransition`), e `startFade` de mapas mantém o mesmo comportamento.
- `game-architecture.md#4` (Conversas): ação nova `inn` (e `innRest` interna) em `dialogAction`; conversas secundárias usam `DialogRunner`/`DialogBox` sem alterar o `dialog-runner.js`.
- `code-standards.md#5` e `#6`: preço vem de `INNS`; duração do fade é constante de módulo; tempo por `dt`, sem `setTimeout`.
- `code-standards.md#1`: `INN_LINES` sem acentos.
- Desvio: nenhum.
</rules>

<skills>
### Skills aplicáveis

Nenhuma.
</skills>

<requirements>
- RF2.1–RF2.5
</requirements>

## Subtarefas

- [x] 4.1 Generalizar o fade no `Game`: campos `dur`, `onMid`, `onEnd`; novo `startTransition({ dur, onMid, onEnd })`; `startFade` monta seu `onMid` com `enterMap`; `updateFade`/`drawFade` usam `f.dur`.
- [x] 4.2 Adicionar `INN_LINES` em `dialogues.js` e trocar a opção Descansar para `action: 'inn'`.
- [x] 4.3 Em `interaction.js`: `innOffer` (conversa de "descansados" ou oferta com Sim/Não) e `innRest` (chama `rest`; sem ouro → fala `noGold`; ok → transição, reposiciona os revividos no meio, fala `morning` no fim).
- [x] 4.4 Completar TI-04 com a ação `inn` (NPC com `inn` tem `INNS`) e adicionar TI-05.
- [x] 4.5 Rodar `npm test`, o E2E-06 e repetir rapidamente uma troca de mapa (o fade de mapas não pode ter mudado).
- [x] 4.6 Atualizar documentação: `game-architecture.md#2` (fade com `startTransition`) e `#4` (ação `inn`).

## Detalhes de implementação

Ver `techspec.md` → "Fluxo" (Estalagem), "`INN_LINES`" e "Integração com o jogo" (fade generalizado). Cobrança e cura acontecem **antes** do fade; o fade é só apresentação. Revividos são colocados ao lado do líder (como no cristal); `separateFromNpcs` resolve se caírem em cima da Estalajadeira.

## Critérios de aceitação relacionados

- CA-10, CA-11, CA-12

## Testes da tarefa

### Unidade
- Regras cobertas na 2.0 (TU-10 a TU-12).

### Integração de conteúdo
- [x] TI-04 — (complemento) NPC com ação `inn` tem entrada em `INNS`; nenhum `'soon'` sobrando em `DIALOGUES`
- [x] TI-05 — `INN_LINES` sem acentos e `offer` contém `{price}`

### Ponta a ponta (navegador)
- [x] E2E-06 — herói caído e feridos, 50 G → Descansar → Sim: escurece/clareia, todos cheios, 30 G; com 10 G: aviso sem cobrar; grupo cheio: aviso de "descansados" sem cobrar

## Arquivos relevantes

- `src/game.js`, `src/interaction.js`, `src/dialogues.js`
- `tests/content.test.mjs`
- `.agents/rules/game-architecture.md`
