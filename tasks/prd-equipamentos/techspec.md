# TechSpec — Equipamentos

PRD: `tasks/prd-equipamentos/prd.md`

## Resumo

A mudança central é **separar atributo base de atributo efetivo** no `Hero`. Hoje `atk`, `defense`, `speed`, `crit` e `maxMp` são campos absolutos que crescem com o nível e vão direto para o save. Eles passam a ser **getters** (`baseAtk + bonus.atk`), e os campos gravados viram `baseAtk`, `baseDefense`, `baseSpeed`, `baseCrit`, `baseMaxMp`. O bônus é um objeto recalculado **só quando o equipamento muda** (`recalcEquip()`), então o custo por quadro é uma soma. Todo o resto do jogo continua lendo `h.atk` e `h.speed` como hoje, sem saber da existência de equipamento.

As peças ficam em `src/equipment.js` (tabela `EQUIPMENT` + regras puras: compatibilidade, bônus somado, equipar/desequipar, comparação). A bolsa continua sendo `{ id: quantidade }`, então **toda a loja é reaproveitada**: basta `items.js` ganhar um `findItem(id)` que procura nas duas tabelas. A aba Equip. sai do `ui/menu.js` para `src/ui/equip.js`, para o menu não passar do limite de linhas.

O save passa para a **versão 2**. Como o dono do projeto tem uma campanha em andamento, `readSave` ganha uma migração pura e testada: o save v1 já guarda os atributos sem equipamento, então eles viram a base diretamente e os heróis recebem as armas iniciais (que não dão bônus) — a força fica idêntica.

## Arquitetura

### Módulos novos e alterados

| Arquivo | Novo/Alterado | Responsabilidade | Depende de |
| :--- | :--- | :--- | :--- |
| `src/equipment.js` | Novo | Tabela `EQUIPMENT` (15 peças), `SLOTS`, `STARTER`, `DR_CAP`; regras puras: `canEquip`, `equipBonus`, `piecesFor`, `equip`, `unequip`, `compareStats` | — (base) |
| `src/items.js` | Alterado | `findItem(id)` (procura em `ITEMS` e `EQUIPMENT`), estoque da loja com equipamentos | `equipment.js` |
| `src/shop.js` | Alterado | Troca `ITEMS[id]` por `findItem(id)` em `buy`, `sell`, `maxBuy`, `sellPrice`, `sellableItems` | `items.js` |
| `src/heroes.js` | Alterado | Campos `base*`, `equipped`, `bonus`; getters `atk`/`defense`/`speed`/`crit`/`maxMp`/`powerGain`/`damageReduction`; `recalcEquip()`; `toSave`/`loadSave` na v2 | + `equipment.js` |
| `src/data.js` | Alterado | `HEROES` ganha `starter` (id da arma inicial) | — |
| `src/save.js` | Alterado | `SAVE_VERSION = 2`; `migrateSave(data)` pura; `readSave` migra v1 | `equipment.js` (ids iniciais) ou recebe de `data.js` |
| `src/combat-system.js` | Alterado | Redução de dano no herói; `src.powerGain` em vez de `src.data.powerGain`; peça do chefe no drop | `equipment.js` (id da peça) |
| `src/ui/equip.js` | Novo | Aba Equip.: escolher espaço → peça → comparação → confirmar | `data.js`, `equipment.js`, `ui/ui.js` |
| `src/ui/menu.js` | Alterado | Delega a aba Equip. para `EquipTab`; Status mostra atributos efetivos e as peças | + `ui/equip.js` |
| `tests/equipment.test.mjs` | Novo | `TU-01` a `TU-10` | `src/equipment.js`, `src/heroes.js` |
| `tests/save.test.mjs` | Novo | `TU-11` a `TU-13` (migração) | `src/save.js` |
| `tests/content.test.mjs` | Alterado | `TI-01` a `TI-04` (integridade das peças) | — |

**Direção de dependências.** `equipment.js` entra na base, junto com `data.js`/`items.js`, e não importa nada do jogo. `items.js` passa a importar `equipment.js` (sentido único, sem ciclo). `ui/equip.js` não importa entidades nem sistemas: lê o estado pela instância `game`. Nenhum módulo novo importa `game.js`.

```text
data.js, equipment.js            (base)
        ↑
items.js → shop.js
        ↑
heroes.js, ui/*                  (heroes.js lê equipment.js; ui/equip.js lê equipment.js)
        ↑
combat-system.js, interaction.js
        ↑
game.js
```

### Atributo base x efetivo (coração da mudança)

| Hoje | Passa a ser | Observação |
| :--- | :--- | :--- |
| `h.atk` (campo) | `h.baseAtk` (campo) + getter `h.atk` | `gainXp` passa a somar em `baseAtk` |
| `h.defense` | `h.baseDefense` + getter | idem |
| `h.speed` | `h.baseSpeed` + getter | idem (nível não mexe em speed hoje) |
| `h.crit` | `h.baseCrit` + getter | idem |
| `h.maxMp` | `h.baseMaxMp` + getter | ao recalcular, `mp` é limitado ao novo `maxMp` |
| `h.maxHp`, `h.hp` | **sem mudança** | nenhuma peça mexe em HP (PRD) |
| `src.data.powerGain` | getter `h.powerGain` | `data.powerGain * (1 + bonus.powerMult)` |
| — | getter `h.damageReduction` | `min(bonus.dr, DR_CAP)` |

`recalcEquip()` recalcula `this.bonus` (um objeto) e é chamado no construtor, ao equipar, ao desequipar e ao carregar o save. Os getters fazem só uma soma, então `update`/`render` continuam baratos (`code-standards.md#7`).

### Fluxo

**Equipar pelo menu:**

1. Menu, aba Equip. (`Q/E`) → `EquipTab` com `step: 'slot'`.
2. Setas escolhem o espaço (arma/armadura/acessório); `J` abre a lista.
3. `step: 'list'` — `piecesFor(hero, slot, inventory)` devolve as peças compatíveis da bolsa; a opção "Tirar" entra no topo quando há algo equipado.
4. Enquanto a peça está selecionada, `compareStats(hero, slot, id)` devolve as linhas da comparação (atributo, de, para, melhor/pior) e os efeitos em texto. A tela pinta verde/vermelho.
5. `J` confirma → `equip(hero, inventory, slot, id)` (ou `unequip`): troca as peças na bolsa, chama `hero.recalcEquip()` e volta ao passo `slot` com um aviso curto.
6. `K` volta um passo; no passo `slot`, fecha o menu como hoje.

**Comprar e vender:** sem fluxo novo. A loja já lista `shop.stock`; os ids de equipamento entram no estoque da vila e `findItem` resolve nome, preço e descrição. Peças equipadas não estão na bolsa, então não aparecem em `sellableItems` (RF4.3 sai de graça).

**Peça do chefe:** `enemyDown` já chama `dropPickup(x, y, 'heal')` quando `zone.boss`. Passa a largar também `dropPickup(x, y, 'equip', BOSS_DROP[flag])`; `updatePickups` coloca o id na bolsa e mostra o texto flutuante.

**Save:** `saveGame` grava `heroes[].toSave()` já na v2. `readSave` migra v1 antes de devolver.

## Contratos de dados

### `EQUIPMENT` — peças (`src/equipment.js`)

| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `name` | `string` | sim | Nome sem acentos (canvas) |
| `slot` | `'weapon' \| 'armor' \| 'accessory'` | sim | Espaço que ocupa |
| `style` | `'katana' \| 'daggers' \| 'mage'` | só em armas | Estilo do herói que pode usar (igual a `HEROES[].type`) |
| `price` | `number` | sim | Preço de compra em G (venda = metade) |
| `desc` | `string` | sim | Uma linha, sem acentos |
| `stats` | `Object` | não | `{ atk, defense, speed, crit, maxMp }`, valores podem ser negativos |
| `power` | `number` | não | Fração somada ao ganho de PODER (0,3 = +30%) |
| `dr` | `number` | não | Fração de dano reduzida (0,05 = 5%) |
| `shop` | `boolean` | não | `false` nas peças que não se compram (iniciais e a do chefe) |

```javascript
export const SLOTS = ['weapon', 'armor', 'accessory'];
export const SLOT_NAMES = { weapon: 'Arma', armor: 'Armadura', accessory: 'Acessorio' };
export const DR_CAP = 0.25;                 // teto da redução de dano somada
export const STARTER = { kaito: 'katana_gasta', rin: 'adagas_simples', aster: 'bastao_rachado' };
export const BOSS_DROP = { bosque: 'coracao_bosque' };   // flag do chefe -> peça

export const EQUIPMENT = {
  katana_gasta: { name: 'Katana Gasta', slot: 'weapon', style: 'katana', price: 60, shop: false,
    desc: 'A katana de treino de Kaito.' },
  katana_aco:   { name: 'Katana de Aco', slot: 'weapon', style: 'katana', price: 150,
    desc: 'Lamina firme e bem balanceada.', stats: { atk: 6 } },
  gibao_couro:  { name: 'Gibao de Couro', slot: 'armor', price: 220,
    desc: 'Pesa um pouco, mas apara os golpes.', stats: { defense: 6, speed: -2 }, dr: 0.05 },
  anel_impeto:  { name: 'Anel do Impeto', slot: 'accessory', price: 320,
    desc: 'O PODER enche 30% mais rapido.', power: 0.3 },
  coracao_bosque: { name: 'Coracao do Bosque', slot: 'accessory', price: 300, shop: false,
    desc: 'Pulsa com a forca do Treant Anciao.', stats: { defense: 4, crit: 0.05 }, dr: 0.12 },
  // ... 15 peças no total, com os valores da tabela de balanceamento do PRD
};
```

As 15 peças e seus números saem da seção "Balanceamento" do PRD. As iniciais têm `price` só para servir de referência de venda (50% dele); `shop: false` as mantém fora do estoque.

### API de `src/equipment.js` (pura)

```javascript
/** @typedef {{ weapon: ?string, armor: ?string, accessory: ?string }} Equipped */
/** @typedef {{ atk, defense, speed, crit, maxMp, power, dr }} EquipBonus  somatório já com o teto de dr */
/** @typedef {{ key: string, label: string, from: number, to: number, better: boolean }} StatDiff */

isEquipment(id)                      // true se o id existe em EQUIPMENT
canEquip(heroType, id)               // arma: style === heroType; armadura/acessório: sempre
equipBonus(equipped)                 // EquipBonus: soma as peças; dr limitado a DR_CAP
piecesFor(heroType, slot, inventory) // ids compatíveis daquele slot presentes na bolsa
equip(hero, inventory, slot, id)     // { ok, previous } — tira 1 da bolsa, devolve a anterior
unequip(hero, inventory, slot)       // { ok, previous } — devolve a peça para a bolsa
compareStats(hero, slot, id)         // { diffs: StatDiff[], effects: string[] } — id null = tirar
```

Regras: `equip` recusa (`ok: false`) id desconhecido, slot errado, estilo incompatível ou peça ausente da bolsa, e não altera nada nesse caso. `equip`/`unequip` chamam `hero.recalcEquip()` por meio de um callback (`hero` só precisa expor `type`, `equipped` e `recalcEquip`), mantendo o módulo testável com objetos simples.

### Estado do herói e save

| Campo | Onde vive | Vai para o save? | Valor no novo jogo |
| :--- | :--- | :--- | :--- |
| `baseAtk`, `baseDefense`, `baseSpeed`, `baseCrit`, `baseMaxMp` | `hero` | sim | De `HEROES[]` |
| `equipped` | `hero.equipped` | sim (`equip`) | `{ weapon: STARTER[id], armor: null, accessory: null }` |
| `bonus` | `hero.bonus` | não (derivado) | Recalculado ao carregar |

```javascript
// Hero.toSave() na versão 2
{ id: 'kaito', name: 'Kaito', level: 6, xp: 104, hp: 209, mp: 0, maxHp: 209,
  baseAtk: 25, baseDefense: 12, baseSpeed: 72, baseCrit: 0.08, baseMaxMp: 0,
  power: 9, alive: true, equip: { weapon: 'katana_gasta', armor: null, accessory: null } }
```

- `SAVE_VERSION`: **passa para 2**, com migração obrigatória (ver abaixo).

### Migração de save (v1 → v2)

```javascript
// save.js — pura, sem localStorage, testável no Node
export function migrateSave(data) {
  if (!data || data.v === SAVE_VERSION) return data;
  if (data.v !== 1) return null;            // versão desconhecida continua sendo ignorada
  return { ...data, v: SAVE_VERSION, heroes: data.heroes.map(migrateHero) };
}
```

`migrateHero` renomeia `atk → baseAtk`, `defense → baseDefense`, `speed → baseSpeed`, `crit → baseCrit`, `maxMp → baseMaxMp` e acrescenta `equip: { weapon: STARTER[id], armor: null, accessory: null }`. Como o save v1 nunca teve equipamento, os valores já são a base pura e a força fica **idêntica**. `maxHp`, `hp`, `mp`, `level`, `xp`, `power` e `alive` passam direto; `gold`, `inventory`, `flags`, `map` e `entry` não mudam. Campos ausentes caem no valor de `HEROES[]`, como hoje.

`readSave` passa a devolver `migrateSave(data)`; a gravação continua só na versão atual. O save migrado só é escrito no disco quando o jogador salva de novo (nada é reescrito automaticamente, então um save v1 nunca é perdido por engano).

## Integração com o jogo

- **Modos:** nenhum modo novo. A aba Equip. vive dentro do modo `menu`, como as outras.
- **Update/Render:** sem passo novo por quadro. `EquipTab.update(dt, input)` e `draw(ctx)` são chamados pelo `Menu` quando `tab === 2`. O custo dos getters é uma soma por leitura.
- **Entidades/combate:**
  - `applyDamage`, quando o alvo é herói, aplica a redução **depois** do `calcDamage` e antes do HP: `amount = Math.max(1, Math.round(amount * (1 - target.damageReduction)))`. O mínimo de 1 de dano é preservado.
  - O ganho de PODER passa a usar `src.powerGain` (getter), em vez de `src.data.powerGain`.
  - `gainXp` soma em `h.baseAtk` e `h.baseDefense`, e `h.baseMaxMp += 4` quando o herói usa magia.
- **Itens no chão:** `dropPickup(x, y, kind, id)` ganha um terceiro parâmetro opcional. `updatePickups` trata `kind === 'equip'`: coloca o id na bolsa e mostra `+<nome>`. O desenho usa uma cor própria (azul claro) para diferenciar das poções.
- **Mapas:** nenhuma mudança.

## Interface

**Aba Equip.** (painel direito do menu, `win(160, 30, 310, 194)`, que já existe):

```text
y=46   "Equipamento - Kaito"
y=70   > Arma        Katana Gasta          (cursor em x=176)
y=88     Armadura    (vazio)
y=106    Acessorio   Bracelete de Cobre
--- a partir daqui, só no passo 'list' ---
y=128  lista das peças compatíveis (até 5 linhas de 16 px) + "Tirar" no topo
y=208  comparação da peça selecionada, 2 colunas:
         "Defesa      7 -> 13"   em verde
         "Velocidade 72 -> 70"   em vermelho
         "Reduz 5% do dano"      em azul claro (efeitos)
y=250  "J: equipar   K: voltar"
```

- Cores: verde `#7dff8a` (melhora), vermelho `#ff9a8a` (piora), azul `#9fe4ff` (efeito), cinza `#6a7090` (vazio/indisponível).
- Até 5 peças por lista sem rolagem (a aventura 1 tem no máximo 4 por espaço). Se passar disso, a lista corta e mostra as 5 primeiras — a rolagem fica para a fase de equipamentos das aventuras 2 e 3.
- **Status** (aba 0) passa a mostrar os atributos efetivos (nada muda no código: lê `h.atk`) e ganha, abaixo dos atributos, três linhas curtas com o nome das peças equipadas.
- **Loja:** sem mudança de layout; a coluna "Tem:" mostra quantas unidades daquela peça estão na bolsa.
- Componentes reutilizados: `win`, `text`, `cursor`, `navY`, `confirm`, `back` de `ui/ui.js`.

## Conteúdo e arte

| Item | Origem | Placeholder | Pipeline |
| :--- | :--- | :--- | :--- |
| Ícones de equipamento | REC-01 (opcional, pendente) | Só texto e cores | Futuro: `assets/source/items_sheet.png` |
| 15 peças (nomes, preços, bônus) | Tabela do PRD | — | — |
| Sprites dos heróis | Não mudam com o equipamento (fora do escopo) | — | — |

## Abordagem de testes

### Testes de unidade

| ID | Caso | CA | Resultado esperado |
| :--- | :--- | :--- | :--- |
| TU-01 | Herói novo: `equipped.weapon` é a arma inicial e os atributos batem com `HEROES[]` | CA-01, CA-02 | Arma inicial sem bônus; `atk` igual ao de hoje |
| TU-02 | `equipBonus` soma `stats` de 3 peças | CA-04 | Soma correta por atributo |
| TU-03 | `canEquip`: katana no Kaito sim, na Rin não; armadura em todos | CA-05 | — |
| TU-04 | `piecesFor` lista só as compatíveis presentes na bolsa | CA-05 | Katana não aparece para a Rin |
| TU-05 | Equipar e depois tirar devolve os atributos originais (sem "vazamento") | CA-06, CA-15 | `atk`/`defense`/`speed`/`crit`/`maxMp` voltam ao valor inicial; bolsa volta ao estado inicial |
| TU-06 | Trocar peça: a anterior volta para a bolsa, a nova sai | CA-04 | `inventory` consistente |
| TU-07 | Peça que tira velocidade não deixa o atributo abaixo de 1 | CA-15 | Atributo mínimo 1 |
| TU-08 | `equipBonus` limita `dr` a `DR_CAP`; 5% + 12% = 17%; peças somando 30% viram 25% | CA-11 | — |
| TU-09 | `powerGain` com o Anel do Ímpeto = `data.powerGain * 1,3` | CA-12 | — |
| TU-10 | `equip` recusa id desconhecido, slot errado, estilo errado e peça fora da bolsa, sem alterar nada | CA-15 | `ok: false`, estado intacto |
| TU-11 | `migrateSave` de um save v1 real: nível, ouro, bolsa, flags e mapa preservados; `baseAtk` = `atk` antigo | CA-13 | `v: 2`, armas iniciais equipadas |
| TU-12 | Herói migrado tem os **mesmos atributos efetivos** do save v1 | CA-13 | `atk` idêntico antes e depois |
| TU-13 | `migrateSave` devolve `null` para versão desconhecida e passa a v2 adiante sem mexer | CA-13 | — |
| TU-14 | `calcDamage` + redução: herói com 17% de redução leva ~17% menos; dano nunca abaixo de 1 | CA-11 | — |
| TU-15 | `toSave`/`loadSave` em v2: equipamento e bases preservados | CA-14 | Ida e volta idêntica |

### Testes de integração de conteúdo

| ID | Caso | CA | Resultado esperado |
| :--- | :--- | :--- | :--- |
| TI-01 | Toda peça de `EQUIPMENT` tem `name` sem acentos, `slot` válido, `price` inteiro > 0 e `desc`; arma tem `style` válido | CA-07 | — |
| TI-02 | Todo `style` de arma corresponde a um `HEROES[].type`; todo herói tem uma arma inicial em `STARTER`, que existe e é do seu estilo | CA-01, CA-05 | — |
| TI-03 | Todo id do estoque das lojas existe em `ITEMS` ou `EQUIPMENT`; peças com `shop: false` não estão em nenhum estoque; a loja da vila vende equipamento | CA-07 | — |
| TI-04 | `BOSS_DROP` aponta para peça existente e a flag corresponde a uma zona de chefe dos mapas | CA-10 | — |
| TI-05 | Nenhuma peça sozinha passa de `DR_CAP`; nenhum `stats` zera um atributo base de `HEROES[]` | CA-11, CA-15 | — |

### Testes ponta a ponta (navegador)

Aba separada, **Novo Jogo**, nunca gravar sobre o espaço 1 (ver memória do projeto). A migração é testada com um save v1 **criado pelo teste** num espaço livre.

| ID | Fluxo | CA | Resultado esperado |
| :--- | :--- | :--- | :--- |
| E2E-01 | Novo jogo → menu → aba Equip. | CA-01, CA-02 | Arma inicial em cada herói, outros espaços vazios; Status igual ao de hoje |
| E2E-02 | Kaito, espaço Arma, selecionar Katana de Aço | CA-03 | Comparação "Ataque 15 -> 21" em verde (captura ampliada) |
| E2E-03 | Confirmar a troca | CA-04 | Katana de Aço equipada, Katana Gasta na bolsa, Status com o ataque novo |
| E2E-04 | Rin, espaço Arma | CA-05 | Só armas de adagas na lista |
| E2E-05 | Equipar armadura e depois "Tirar" | CA-06 | Atributos voltam ao valor anterior; peça de volta à bolsa |
| E2E-06 | Loja da vila → Comprar | CA-07 | Consumíveis e equipamentos na lista, com preço |
| E2E-07 | Equipar uma peça e abrir Vender tendo outra igual na bolsa | CA-08, CA-09 | Só a da bolsa aparece; vender dá metade do preço |
| E2E-08 | `game.flags = {}` → derrotar o Treant Ancião → andar sobre o item | CA-10 | "+Coracao do Bosque" na tela e na bolsa, equipável |
| E2E-09 | Equipar Gibão (5%) + Coração (12%) e apanhar de um inimigo | CA-11 | Dano ~17% menor que sem as peças (comparação medida) |
| E2E-10 | Equipar o Anel do Ímpeto e acertar golpes | CA-12 | Barra de PODER enche mais rápido que sem o anel |
| E2E-11 | Gravar um save v1 fabricado num espaço livre, recarregar e Continuar | CA-13 | Nível, ouro, bolsa e mapa iguais; armas iniciais; console limpo |
| E2E-12 | Trocar equipamento → salvar no cristal → recarregar → Continuar | CA-14 | Mesmas peças e atributos |
| E2E-13 | Cronometrar: comprar arma na loja → menu → equipar | CA-16 | Menos de 1 minuto |

## Sequenciamento

1. **Base e regras:** `equipment.js` (tabela + funções puras) e `TU-02` a `TU-10`, `TI-01`, `TI-02`, `TI-05`. Nada no jogo ainda.
2. **Herói com base/bônus:** `heroes.js` (campos `base*`, getters, `recalcEquip`), `data.js` (`starter`), `gainXp`, redução de dano e `powerGain` em `combat-system.js`; `TU-01`, `TU-07`, `TU-14`. Aqui o jogo precisa continuar exatamente como antes (regressão).
3. **Save v2 com migração:** `save.js` e `Hero.toSave`/`loadSave`; `TU-11` a `TU-13`, `TU-15`, `E2E-11`, `E2E-12`. Vem antes da interface para o save novo já nascer completo.
4. **Loja e recompensa:** `findItem` em `items.js`, `shop.js` generalizado, estoque da vila com equipamento, peça do chefe no drop; `TI-03`, `TI-04`, `E2E-06` a `E2E-08`.
5. **Aba Equip.:** `ui/equip.js`, Status com as peças; `E2E-01` a `E2E-05`, `E2E-09`, `E2E-10`, `E2E-13`.
6. **Fechamento:** documentação (`README`, `AGENTS`, rules, `CHANGELOG`) e verificação final.

## Riscos

| Risco | Mitigação |
| :--- | :--- |
| **Perder a campanha do dono do projeto** ao mudar `SAVE_VERSION` | Migração pura e testada (`TU-11` a `TU-13`) antes de qualquer tela; `E2E-11` com save v1 fabricado; nada reescreve o save existente automaticamente |
| Esquecer um lugar que escreve em `h.atk` e quebrar silenciosamente (getter sem setter) | Buscar por `\.atk\s*[+-]?=`, `\.defense`, `\.speed`, `\.crit`, `\.maxMp` em todo o `src/`; getters sem setter fazem a escrita indevida falhar em modo estrito (ES modules), o que aparece no console |
| Bônus "vazando" ao equipar/desequipar várias vezes | O bônus é derivado (`recalcEquip` recalcula do zero), nunca somado ao campo base; `TU-05` cobre o ciclo |
| `mp` maior que o novo `maxMp` ao tirar uma peça de MP | `recalcEquip` limita `mp` ao `maxMp` |
| Getter chamado em todo quadro ficar caro | `bonus` é pré-calculado; o getter é uma soma. Sem alocação por quadro (`code-standards.md#7`) |
| Equipamento entrar na aba Itens e ser "usado" | A aba Itens lista `ITEM_ORDER`, que só tem consumíveis; `TI-03` garante a separação |
| Lista de peças passar de 5 linhas | Conteúdo da aventura 1 cabe; a rolagem fica registrada como pendência para a aventura 2 |
| Texto da comparação não caber em 480 px | Nomes curtos, duas colunas, verificação visual ampliada (`E2E-02`) |

## Principais decisões

| Decisão | Motivo | Alternativa descartada |
| :--- | :--- | :--- |
| Separar `base*` + getters efetivos | O resto do jogo continua lendo `h.atk` sem saber de equipamento; uma só fonte de verdade | Somar o bônus no campo e subtrair ao trocar (vaza arredondamento e duplica em save/load) |
| `bonus` pré-calculado em `recalcEquip()` | Getter vira uma soma; sem custo por quadro | Recalcular as peças a cada leitura |
| Equipamento na mesma bolsa `{ id: qtd }` | Reaproveita toda a loja (`buy`, `sell`, `sellableItems`) sem código novo; duas peças iguais viram quantidade 2 | Lista separada de instâncias (exigiria reescrever a loja inteira) |
| Tabela própria em `equipment.js` + `findItem` em `items.js` | 15 peças não cabem em `items.js` sem passar do limite de linhas; `findItem` isola a busca | Misturar tudo em `ITEMS` (consumível tem `use`, equipamento não) |
| Migração em `save.js`, pura e testada | É o risco mais alto da entrega; precisa rodar no Node, sem navegador | Migrar dentro do `Game` ao carregar |
| Armas iniciais sem bônus nenhum | Mantém a força atual (RF2.2) e torna a migração trivialmente segura | Dar bônus pequeno e rebalancear os inimigos |
| Aba Equip. em `src/ui/equip.js` | `ui/menu.js` (166 linhas) passaria do limite com o fluxo completo | Tudo dentro do `Menu` |
| Redução de dano aplicada em `applyDamage` | Único caminho de dano do jogo (`game-architecture.md#5`) | Alterar `calcDamage` (também é usada por inimigos) |
| Peça do chefe como item no chão (`kind: 'equip'`) | Reaproveita os itens no chão que já existem | Entrega direta na bolsa |
| Sem rolagem na lista de peças | A aventura 1 não chega a 5 por espaço | Rolagem já agora |

## Conformidade

- **AGENTS.md e rules:** todas as rules de `.agents/rules/` foram lidas. Relevantes: `code-standards.md` (tabelas de balanceamento em `equipment.js`; limites de 400/60 linhas — `heroes.js` fica em ~350 e `menu.js` encolhe; sem alocação por quadro), `javascript.md` (sem DOM no topo: `equipment.js` e `save.js` continuam importáveis no Node; JSDoc em `Equipped`, `EquipBonus`, `StatDiff`; tabelas nunca alteradas em jogo), `folder-structure.md` (`equipment.js` como sistema de base, `ui/equip.js` como tela; nenhum import de `game.js`), `game-architecture.md` (§5 dano só por `applyDamage`; §8 campo novo no save nos três pontos — `newGame`, `saveGame`, `loadGame` — e `SAVE_VERSION` incrementado **com migração**, como a própria regra exige quando há progresso em andamento), `tests.md` (TU para toda regra com número; testes de conteúdo iteram sobre todas as peças), `documentation.md`.
- **Skills aplicáveis:** nenhuma de arte (REC-01 opcional e adiado). Fluxo: `/criar-tasks` → `/executar-task` → `/executar-review` → `/executar-qa`.

## Arquivos relevantes

- **Lidos:** `AGENTS.md`, `.agents/rules/*.md`, `tasks/prd-equipamentos/prd.md`, `src/heroes.js`, `src/data.js`, `src/items.js`, `src/shop.js`, `src/save.js`, `src/combat.js`, `src/combat-system.js`, `src/ui/menu.js`, `src/ui/shop.js`, `tests/content.test.mjs`, `tests/shop.test.mjs`.
- **Criados:** `src/equipment.js`, `src/ui/equip.js`, `tests/equipment.test.mjs`, `tests/save.test.mjs`.
- **Alterados:** `src/heroes.js`, `src/data.js`, `src/items.js`, `src/shop.js`, `src/save.js`, `src/combat-system.js`, `src/ui/menu.js`, `tests/content.test.mjs`, `README.md`, `AGENTS.md`, `CHANGELOG.md`, `.agents/rules/game-architecture.md`, `.agents/rules/folder-structure.md`, `.agents/rules/tests.md`, `prompts/README.md`.
