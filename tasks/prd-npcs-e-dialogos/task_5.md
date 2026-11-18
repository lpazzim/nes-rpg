# Tarefa 5.0: Ajuste fino jogando e documentação

## Visão geral

Joga a vila do começo ao fim e ajusta o que só aparece jogando:
- Posições dos NPCs, para não bloquearem ruas.
- Ritmo do texto e do passeio.
- Textos longos demais.

Depois atualiza toda a documentação afetada e registra a entrega.

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e todas as rules. Relevantes:
- `documentation.md#1`: quais documentos atualizar.
- `AGENTS.md#8`: definição de pronto.
</rules>

<skills>
### Skills aplicáveis

Nenhuma.
</skills>

<requirements>
- RF4, RF11, RF12
</requirements>

## Subtarefas

- [x] 5.1 Percorrer a vila e conversar com todos os NPCs (com e sem `bosque`); ajustar posições, textos e números em `NPC_TUNING`/`DIALOG` se preciso
- [x] 5.2 Rodar `npm test` e repetir E2E-01, E2E-05 e E2E-09 depois dos ajustes
- [x] 5.3 Atualizar a documentação:
  - `README.md`: conversar com E e onde editar as falas.
  - `AGENTS.md`: modo `dialog` na arquitetura.
  - `game-architecture.md`: tabela de modos e NPC como entidade.
  - `maps-and-adventures.md`: `B.npc` e os NPCs por mapa.
  - `folder-structure.md`: novos arquivos.
- [x] 5.4 Registrar a entrega no `CHANGELOG.md` e marcar a situação em `prompts/README.md` ("Em review")

## Detalhes de implementação

TechSpec: "Sequenciamento", item 5.

## Critérios de aceitação relacionados

- CA-01, CA-05, CA-11 (revalidação após os ajustes)

## Testes da tarefa

### Ponta a ponta (navegador)
- [x] E2E-01 — revalidar depois dos ajustes
- [x] E2E-05 — revalidar depois dos ajustes
- [x] E2E-09 — revalidar depois dos ajustes

## Arquivos relevantes

- `src/maps/adventure1.js`, `src/dialogues.js`, `src/data.js`, `README.md`, `AGENTS.md`, `.agents/rules/*.md`, `CHANGELOG.md`, `prompts/README.md`
