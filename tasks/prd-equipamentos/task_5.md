# Tarefa 5.0: Aba Equip. com a comparação

## Visão geral

Preenche a aba Equip. do menu, hoje vazia: escolher o espaço, ver as peças compatíveis da bolsa e a comparação dos atributos em verde e vermelho antes de confirmar. Ao final, dá para comprar uma arma na loja e equipá-la pelo menu.

<rules>
### Conformidade com o AGENTS.md e as rules

- `game-architecture.md#2`: a tela usa os atalhos de `ui/ui.js` (`navY`, `confirm`, `back`) e fecha pelo caminho de hoje (`g.closeMenu()`), sem alterar `game.mode` por conta própria.
- `folder-structure.md#2` e `#5`: tela nova em `src/ui/`; `ui/equip.js` não importa entidades nem sistemas, lê o estado pela instância `game`.
- `code-standards.md#4`: a aba sai do `ui/menu.js` para não passar do limite de linhas.
- `code-standards.md#1`: textos do canvas sem acentos.
- Desvio: nenhum.
</rules>

<skills>
### Skills aplicáveis

Nenhuma.
</skills>

<requirements>
- RF3.1 a RF3.6
</requirements>

## Subtarefas

- [x] 5.1 Criar `src/ui/equip.js` (`EquipTab`): passos `slot` e `list`, opção "Tirar", lista das peças compatíveis e aviso curto após a troca.
- [x] 5.2 Desenhar a comparação: cada atributo que muda com valor atual, novo e seta; verde quando melhora, vermelho quando piora; efeitos especiais escritos em azul claro.
- [x] 5.3 Ligar a aba ao `ui/menu.js` (o Menu delega `update` e `draw` quando a aba Equip. está ativa) e remover o aviso "chega junto com as lojas".
- [x] 5.4 Mostrar, na aba Status, o nome das três peças equipadas, abaixo dos atributos.
- [x] 5.5 Rodar `npm test` e os E2E-01 a E2E-05, E2E-09 e E2E-10, conferindo o layout com a captura ampliada.

## Detalhes de implementação

Ver `techspec.md` → "Fluxo" (Equipar pelo menu), "Interface" (posições e cores) e a API `compareStats` em "Contratos de dados". A lista mostra até 5 peças sem rolagem, o que cobre a aventura 1.

## Critérios de aceitação relacionados

- CA-01, CA-03, CA-04, CA-05, CA-06, CA-11, CA-12

## Testes da tarefa

### Unidade
- Cobertas na 1.0 e na 2.0 (a tela só chama `equipment.js`).

### Integração de conteúdo
- Nenhum novo.

### Ponta a ponta (navegador)
- [x] E2E-01 — novo jogo: arma inicial equipada em cada herói, outros espaços vazios
- [x] E2E-02 — comparação da Katana de Aço em verde, antes de confirmar
- [x] E2E-03 — confirmar troca: peça equipada, anterior na bolsa, Status atualizado
- [x] E2E-04 — Rin só vê armas de adagas
- [x] E2E-05 — "Tirar" devolve a peça e os atributos voltam
- [x] E2E-09 — Gibão (5%) + Coração (12%): dano recebido ~17% menor
- [x] E2E-10 — Anel do Ímpeto: a barra de PODER enche mais rápido

## Arquivos relevantes

- `src/ui/equip.js` (novo), `src/ui/menu.js`
