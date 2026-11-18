# Tarefa 2.0: Herói com força própria e bônus (jogo continua igual)

## Visão geral

Separa, dentro do herói, a **força própria** (que cresce com o nível) do **bônus do equipamento**. Cada herói passa a nascer com a arma inicial equipada, que não dá bônus nenhum — então o jogo continua exatamente com a força de hoje. O resultado se confere jogando: lutar, subir de nível e apanhar funcionam igual, e os atributos no Status não mudam.

<rules>
### Conformidade com o AGENTS.md e as rules

- `game-architecture.md#4`: o contrato das entidades (`atk`, `defense`, `crit`...) continua valendo; quem lê o herói não muda nada.
- `game-architecture.md#5`: a redução de dano entra em `applyDamage`, o único caminho de dano do jogo, depois do `calcDamage` e antes do HP, preservando o mínimo de 1.
- `code-standards.md#7`: o bônus é pré-calculado em `recalcEquip()`; os getters fazem só uma soma, sem alocar nada por quadro.
- `javascript.md#6`: a tabela `HEROES` não é alterada em jogo; o herói copia os valores para os campos `base*`.
- Desvio: nenhum.
</rules>

<skills>
### Skills aplicáveis

Nenhuma.
</skills>

<requirements>
- RF2.1 a RF2.4, RF1.4, RF1.5, RF1.6
</requirements>

## Subtarefas

- [x] 2.1 Em `src/data.js`, acrescentar a arma inicial de cada herói (`starter`), apontando para `STARTER` de `equipment.js`.
- [x] 2.2 Em `src/heroes.js`: trocar os campos `atk`, `defense`, `speed`, `crit` e `maxMp` por `baseAtk`, `baseDefense`, `baseSpeed`, `baseCrit` e `baseMaxMp`; criar `equipped`, `bonus` e `recalcEquip()`; criar os getters `atk`, `defense`, `speed`, `crit`, `maxMp`, `powerGain` e `damageReduction`.
- [x] 2.3 Garantir as bordas: atributo efetivo nunca abaixo de 1; ao recalcular, `mp` é limitado ao novo `maxMp`.
- [x] 2.4 Em `src/combat-system.js`: `gainXp` soma em `baseAtk`/`baseDefense`/`baseMaxMp`; `applyDamage` aplica a redução de dano do herói; o ganho de PODER usa `src.powerGain`.
- [x] 2.5 Procurar em todo o `src/` por escritas diretas nos atributos (`\.atk\s*=`, `.defense`, `.speed`, `.crit`, `.maxMp`) e corrigir as que sobraram.
- [x] 2.6 Criar `TU-01`, `TU-07`, `TU-09` e `TU-14` (em `equipment.test.mjs` ou `rules.test.mjs`, conforme o assunto).
- [x] 2.7 Rodar `npm test` e o E2E de regressão: lutar, subir de nível, apanhar, usar poção e conversar, conferindo que nada mudou.

## Detalhes de implementação

Ver `techspec.md` → "Atributo base x efetivo" (tabela de equivalência) e "Integração com o jogo". Os getters não têm setter: uma escrita esquecida falha em modo estrito e aparece no console, o que ajuda a encontrar o que faltou na subtarefa 2.5.

## Critérios de aceitação relacionados

- CA-01, CA-02, CA-11, CA-12, CA-15

## Testes da tarefa

### Unidade
- [x] TU-01 — herói novo: arma inicial equipada e atributos iguais aos de hoje
- [x] TU-07 — peça que tira velocidade não deixa o atributo abaixo de 1
- [x] TU-09 — `powerGain` com o Anel do Ímpeto = valor base x 1,3
- [x] TU-14 — redução de dano aplicada no dano recebido, nunca abaixo de 1

### Integração de conteúdo
- [x] TI-05 — (complemento) nenhum bônus zera um atributo base de `HEROES`

### Ponta a ponta (navegador)
- [x] E2E-01 (parte) — novo jogo: Status com os mesmos atributos de hoje; combate, nível e dano inalterados

## Arquivos relevantes

- `src/heroes.js`, `src/data.js`, `src/combat-system.js`
- `tests/equipment.test.mjs`, `tests/rules.test.mjs`
