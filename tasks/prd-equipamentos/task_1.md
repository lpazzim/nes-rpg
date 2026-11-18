# Tarefa 1.0: Peças e regras puras (sem mexer no jogo)

## Visão geral

Cria a tabela das 15 peças e as regras de equipar, com testes automáticos. Nada muda no jogo ainda: o resultado se confere com `npm test`, que passa a provar que a katana só serve para o Kaito, que equipar e tirar devolve os atributos originais e que a redução de dano respeita o teto de 25%.

<rules>
### Conformidade com o AGENTS.md e as rules

- `code-standards.md#5`: todos os números das peças (preços, bônus, teto de redução) ficam na tabela de `src/equipment.js`, nunca espalhados na lógica.
- `folder-structure.md#5`: `equipment.js` é módulo de base e **não importa nada do jogo**; sistema novo ganha arquivo próprio em `src/`.
- `javascript.md#5` e `#6`: JSDoc nos contratos `Equipped`, `EquipBonus` e `StatDiff`; a tabela `EQUIPMENT` nunca é alterada em tempo de jogo.
- `code-standards.md#1`: nomes e descrições das peças sem acentos (vão para o canvas).
- `tests.md#2`: toda regra com número ganha um `TU`; os testes de conteúdo iteram sobre **todas** as peças.
- Desvio: nenhum.
</rules>

<skills>
### Skills aplicáveis

Nenhuma.
</skills>

<requirements>
- RF1.1 a RF1.7
</requirements>

## Subtarefas

- [x] 1.1 Criar `src/equipment.js` com `SLOTS`, `SLOT_NAMES`, `DR_CAP`, `STARTER`, `BOSS_DROP` e a tabela `EQUIPMENT` com as 15 peças e os valores da tabela de balanceamento do PRD.
- [x] 1.2 Implementar as funções puras: `isEquipment`, `canEquip`, `equipBonus`, `piecesFor`, `equip`, `unequip`, `compareStats`.
- [x] 1.3 Garantir as regras de borda: `equipBonus` limita a redução de dano a `DR_CAP`; `equip` recusa id desconhecido, slot errado, estilo incompatível ou peça fora da bolsa, sem alterar nada.
- [x] 1.4 Criar `tests/equipment.test.mjs` com `TU-02` a `TU-06`, `TU-08` e `TU-10`.
- [x] 1.5 Adicionar `TI-01`, `TI-02` e `TI-05` ao `content.test.mjs`.
- [x] 1.6 Rodar `npm test`.

## Detalhes de implementação

Ver `techspec.md` → "Contratos de dados" (tabela `EQUIPMENT` e API de `src/equipment.js`). As funções recebem objetos simples (`hero` só precisa expor `type`, `equipped` e `recalcEquip`), para serem testáveis sem criar um `Hero` de verdade. O mínimo de 1 por atributo (`TU-07`) é aplicado no herói, na tarefa 2.0.

## Critérios de aceitação relacionados

- CA-04, CA-05, CA-06, CA-11, CA-15 (a parte de regras; a parte jogável vem nas tarefas 2.0 e 5.0)

## Testes da tarefa

### Unidade
- [x] TU-02 — `equipBonus` soma os atributos de 3 peças
- [x] TU-03 — `canEquip`: katana só no Kaito; armadura em todos
- [x] TU-04 — `piecesFor` lista só as compatíveis presentes na bolsa
- [x] TU-05 — equipar e tirar devolve os atributos e a bolsa ao estado original
- [x] TU-06 — trocar peça: a anterior volta para a bolsa, a nova sai
- [x] TU-08 — redução de dano limitada a `DR_CAP` (5% + 12% = 17%; 30% vira 25%)
- [x] TU-10 — entradas inválidas recusadas sem alterar nada

### Integração de conteúdo
- [x] TI-01 — toda peça tem nome sem acentos, slot válido, preço inteiro > 0 e descrição; arma tem estilo válido
- [x] TI-02 — todo estilo de arma corresponde a um herói; todo herói tem arma inicial, que existe e é do seu estilo
- [x] TI-05 — nenhuma peça sozinha passa do teto de redução; nenhum bônus zera um atributo base

### Ponta a ponta (navegador)
- Nenhum (sem mudança visível nesta tarefa).

## Arquivos relevantes

- `src/equipment.js` (novo)
- `tests/equipment.test.mjs` (novo), `tests/content.test.mjs`
