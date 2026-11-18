# TechSpec — Loja e estalagem

PRD: `tasks/prd-loja-e-estalagem/prd.md`

## Resumo

A entrega começa por uma **refatoração sem mudança de comportamento**: o `src/game.js` (498 linhas) perde o combate e a interação para dois módulos de sistema, `src/combat-system.js` e `src/interaction.js`. Eles exportam funções que recebem a instância `game` por parâmetro, e o `Game` mantém métodos finos com os mesmos nomes (`damage`, `explode`, `addHitbox`...), porque heróis e inimigos os chamam. Isso deixa o `game.js` com ~310 linhas antes da loja e ~350 depois.

A economia vira **lógica pura** em `src/shop.js` (comprar, vender, descansar), testada no Node, operando sobre uma "carteira" `{ gold, inventory }` — o próprio `game` serve como carteira. Estoques e preços de estalagem são tabelas em `src/items.js`, indexadas pelo **id do NPC** (`mercador_fazenda`, `estalajadeira`), então lojas futuras só exigem uma linha de dados. A tela é uma classe nova `ShopScreen` (`src/ui/shop.js`) com um modo novo `shop` no `Game`. A estalagem não tem tela própria: usa uma segunda conversa (Sim/Não) e o fade do jogo, generalizado para aceitar duração e callback. O formato do save não muda.

## Arquitetura

### Módulos novos e alterados

| Arquivo | Novo/Alterado | Responsabilidade | Depende de |
| :--- | :--- | :--- | :--- |
| `src/combat-system.js` | Novo (tarefa 1) | `applyDamage`, `heroDown`, `enemyDown`, `gainXp`, `updateHitboxes`, `spawnZone`, `updateZones`, `updatePickups`, `drawPickups`, `explode` | `data.js`, `combat.js`, `enemies.js`, `save.js` |
| `src/interaction.js` | Novo (tarefa 1; recebe loja/estalagem depois) | `nearInteractable`, `interact` (cristal/NPC), `talkTo`, `dialogAction`, `separateFromNpcs` (pura), fluxo da estalagem | `data.js`, `combat.js`, `items.js`, `shop.js`, `dialogues.js`, `dialog-runner.js`, `ui/dialog.js`, `ui/slots.js`, `ui/shop.js` |
| `src/game.js` | Alterado | Mantém campanha, modos, troca de mapa, fade, câmera e desenho; delega combate e interação; modo `shop`; fade com `dur`/`onMid`/`onEnd` | + `combat-system.js`, `interaction.js` |
| `src/shop.js` | Novo | Regras puras: `maxBuy`, `buy`, `sell`, `sellPrice`, `sellableItems`, `needsRest`, `rest` | `items.js` |
| `src/items.js` | Alterado | `SHOPS`, `INNS`, `MAX_STACK = 99`, `SELL_RATE = 0.5` | — |
| `src/ui/shop.js` | Novo | `ShopScreen`: lista, seletor de quantidade, avisos, ouro | `data.js`, `items.js`, `shop.js`, `ui/ui.js` |
| `src/dialogues.js` | Alterado | Ações `shop`/`sell`/`inn` nas opções; novas falas `INN_LINES` (oferta, sem ouro, descansado, bom dia) | — |
| `tests/systems.test.mjs` | Novo | Regras extraídas do `game.js` (XP, separação de NPC) e guarda de tamanho de arquivo | `src/*` |
| `tests/shop.test.mjs` | Novo | Regras de compra, venda e descanso | `src/shop.js`, `src/items.js` |
| `tests/dialog.test.mjs` | Alterado | Testes `BUG-01` e "parede" passam a importar `separateFromNpcs` de `interaction.js` | — |
| `tests/content.test.mjs` | Alterado | Integridade de `SHOPS`, `INNS`, ações e `INN_LINES` | — |

**Direção de dependências.** `shop.js` fica na base (só importa `items.js`). `combat-system.js` e `interaction.js` formam uma camada nova de **sistemas**, entre as entidades/telas e o `game.js`: podem importar entidades, `ui/*` e a base, mas **nunca** `game.js` (recebem `game` por parâmetro), e não importam um ao outro (o `interaction.js` não precisa do combate). `ui/shop.js` não importa entidades nem sistemas. O diagrama de `folder-structure.md#5` ganha a camada:

```text
heroes.js, enemies.js, maps/*, world.js, hud.js, ui/*
        ↑
combat-system.js, interaction.js   (sistemas: recebem game por parâmetro)
        ↑
game.js
```

### Divisão do `game.js` (tarefa 1)

| Sai do `game.js` (linhas atuais) | Vai para | Fica no `Game` |
| :--- | :--- | :--- |
| `damage` (166–192) | `applyDamage(game, target, src, h)` | `damage(t, s, h) { applyDamage(this, t, s, h); }` |
| `heroDown`, `enemyDown` (194–215) | `combat-system.js` | — (chamados só por `applyDamage`) |
| `gainXp` (217–230) | `gainXp(heroes, n)` — **pura** | — |
| `explode` (157–161) | `explode(game, x, y, owner)` | método fino (chamado pelos heróis) |
| `dropPickup`, `updatePickups` (233–253) + desenho dos itens no chão (`render` 433–439) | `updatePickups(game, dt)`, `drawPickups(ctx, pickups)` | `dropPickup` fino |
| `spawnZone`, `updateZones` (256–271) | `combat-system.js` | — |
| `updateHitboxes` (273–296) | `updateHitboxes(game, dt)` | — |
| `nearInteractable`, `interact`, `talkTo`, `dialogAction` (300–342) | `interaction.js` | `nearInteractable()` fino (usado em `update` e `render`) |
| `separateFromNpcs` (344–356) | `separateFromNpcs(heroes, npcs, world)` — **pura** | — |

Regras: nenhum comportamento muda (mesmos números, mesma ordem de chamadas em `update`), `addHitbox`, `later`, `shake`, `announce`, `nearestEnemy`, `nearestHero`, `followerSlot` ficam no `Game` (API usada pelas entidades). Os dois testes de regressão do `dialog.test.mjs` passam a chamar `separateFromNpcs` direto. A dívida técnica do `AGENTS.md` (linha do `game.js`) é atualizada, e `folder-structure.md` (§2 e §5) e `game-architecture.md` (§4 NPCs/Conversas, §5 Combate) passam a citar os módulos novos.

### Fluxo

**Loja:**

1. Modo `play`, tecla **E** perto do Mercador → `interaction.talkTo` → modo `dialog`.
2. Opção **Comprar** (`action: 'shop'`) ou **Vender** (`action: 'sell'`) → a caixa fecha → `dialogAction(game, action, npc)` → `game.openShop(npc.id, 'buy' | 'sell')`.
3. `openShop` cria `new ShopScreen(game, SHOPS[npcId], kind, () => game.closeShop())` e põe o modo `shop` (mundo congelado).
4. `ShopScreen.update` lê as teclas; ao confirmar, chama `buy(game, id, qty)` / `sell(game, id, qty)` de `shop.js`, que alteram `game.gold` e `game.inventory` e devolvem `{ ok, ... }`. A tela mostra o aviso.
5. K/Esc na lista → `onClose` → `game.closeShop()` → modo `play`.
6. Save: nada novo — `saveGame` já grava `gold` e `inventory`.

**Estalagem:**

1. Opção **Descansar** (`action: 'inn'`) → `dialogAction` → `innOffer(game, npc)`:
   - `!needsRest(game.heroes)` → abre conversa com `INN_LINES.rested` (sem cobrar).
   - Caso contrário → abre conversa com `INN_LINES.offer` (preço preenchido) e `ask` Sim (`action: 'innRest'`) / Não.
2. `innRest` → `rest(game, game.heroes, INNS[npc.id].price)`:
   - `{ ok: false, reason: 'gold' }` → conversa com `INN_LINES.noGold`.
   - `{ ok: true, revived }` → `game.startTransition({ dur: REST_FADE, onMid, onEnd })`. No meio (tela preta), reposiciona os revividos ao lado do líder (`placeAt`). No fim, abre conversa com `INN_LINES.morning`.
3. A cobrança e a cura acontecem **antes** do fade (o resultado não depende de a animação terminar); o fade é só apresentação.

As conversas secundárias usam o mesmo `DialogRunner`/`DialogBox`, montadas com uma definição sintética `{ name, talk: [{ say, ask }] }` — sem mudar o `dialog-runner.js`.

## Contratos de dados

### `SHOPS` — estoque de cada loja (`src/items.js`)

Chave = id do NPC lojista (o mesmo de `DIALOGUES` e da folha `npcs`).

| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `name` | `string` | sim | Título da tela, sem acentos |
| `stock` | `string[]` | sim | Ids de `ITEMS`, na ordem da lista |

```javascript
export const SHOPS = {
  mercador_fazenda: { name: 'Loja da Pradaria', stock: ['potion', 'hipotion', 'ether', 'phoenix'] },
};
```

### `INNS` — estalagens (`src/items.js`)

| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `price` | `number` | sim | Preço da noite em G (inteiro > 0) |

```javascript
export const INNS = { estalajadeira: { price: 20 } };
export const MAX_STACK = 99;   // limite por item na bolsa
export const SELL_RATE = 0.5;  // venda = preço x 0,5, arredondado para baixo
```

### `INN_LINES` — falas da estalagem (`src/dialogues.js`)

| Campo | Uso |
| :--- | :--- |
| `offer` | Pergunta com o preço; `{price}` é substituído pelo valor |
| `yes`, `no` | Rótulos das opções (`'Sim'`, `'Nao'`) |
| `noGold` | Sem ouro suficiente |
| `rested` | Grupo já está com tudo cheio |
| `morning` | Depois do descanso |

```javascript
export const INN_LINES = {
  offer: 'Uma noite custa {price} G. Vao descansar?',
  yes: 'Sim', no: 'Nao',
  noGold: 'Hmm, falta ouro para o quarto. Volte quando puder!',
  rested: 'Voces parecem descansados! Nao precisam de quarto agora.',
  morning: 'Bom dia! Dormiram bem? Voces parecem novos em folha!',
};
```

As opções do Mercador mudam para `action: 'shop'` e `action: 'sell'` (falas curtas tipo "Da uma olhada!"); a da Estalajadeira para `action: 'inn'`.

### API de `src/shop.js` (pura)

```javascript
/** @typedef {{ gold: number, inventory: Object<string, number> }} Wallet  o próprio game serve */
/** @typedef {{ ok: true, cost?: number, gain?: number, revived?: Object[] }
 *          | { ok: false, reason: 'unknown'|'qty'|'gold'|'full'|'none'|'rested' }} ShopResult */

sellPrice(id)               // Math.floor(ITEMS[id].price * SELL_RATE); 0 se não existe
maxBuy(wallet, id)          // min(floor(gold / price), MAX_STACK - tem); 0 se desconhecido
buy(wallet, id, qty)        // ShopResult; altera wallet só se ok
sell(wallet, id, qty)       // ShopResult; remove a chave quando chega a 0
sellableItems(inventory)    // ids com qtd > 0 que existem em ITEMS: ITEM_ORDER primeiro, depois o resto
needsRest(heroes)           // algum caído, ou hp < maxHp, ou mp < maxMp
rest(wallet, heroes, price) // ShopResult; revive (alive, hp, mp cheios) e cobra só se ok
```

Validações (todas devolvem `ok: false` sem alterar nada): id fora de `ITEMS` → `unknown`; `qty` não inteiro ou < 1 → `qty`; custo > ouro → `gold`; tem + qty > `MAX_STACK` → `full`; vender mais do que tem → `none`; descanso sem necessidade → `rested` (checado **antes** do ouro, para não dizer "falta ouro" a quem nem precisa).

### Estado do `ShopScreen`

| Campo | Valores | Descrição |
| :--- | :--- | :--- |
| `kind` | `'buy' \| 'sell'` | Tipo da tela |
| `step` | `'list' \| 'qty'` | Escolhendo item ou quantidade |
| `sel` | índice | Item selecionado na lista |
| `qty` | 1..max | Quantidade no seletor |
| `msg`, `msgT` | texto, segundos | Aviso temporário (~1,4 s, como no menu) |

### Estado da campanha e save

| Campo novo | Onde vive | Vai para o save? | Valor no novo jogo |
| :--- | :--- | :--- | :--- |
| — | — | — | — |

- `gold` e `inventory` já são salvos; `shop` e o fade são transitórios.
- `SAVE_VERSION`: **mantém 1**. Saves antigos têm o mesmo formato.

## Integração com o jogo

- **Modos:** novo modo `shop` (teclado: `ShopScreen`; mundo não atualiza; desenha a tela por cima). Abre por `game.openShop(npcId, kind)`, fecha por `game.closeShop()`. Atualizar a tabela de `game-architecture.md#2`. A estalagem usa o modo `dialog` existente e o fade.
- **Fade generalizado:** `this.fade` ganha `dur` (padrão `FADE = 0,3`), `onMid` e `onEnd`. `startFade(map, entry, fromTitle)` continua igual (monta `onMid` com `enterMap`); novo `startTransition({ dur, onMid, onEnd })`. `updateFade` e `drawFade` usam `f.dur`. Durante o fade o mundo já fica congelado.
- **Update/Render:** `update` ganha `case 'shop': this.shop.update(dt, i); return;`. `render` desenha `this.shop.draw(ctx)` no passo 5 de `game-architecture.md#7` (depois do HUD, antes do fade), como o menu. Os itens no chão passam a ser desenhados por `drawPickups` (mesma posição na ordem).
- **Entidades/combate:** nenhuma mudança de regra. Heróis e inimigos continuam chamando `game.damage`, `game.explode`, `game.addHitbox`, `game.later`, que delegam ao `combat-system.js`.
- **Mapas:** nenhum. Mercador e Estalajadeira já estão na vila; a loja é achada pelo id do NPC.

## Interface

Tela de loja (480x270), fundo escurecido `rgba(0,0,10,0.55)` como o menu:

```text
y=8   win(10, 8, 460, 22)    "LOJA DA PRADARIA" (x=20)            "Ouro: 120 G" (direita, x=460, dourado)
y=34  win(10, 34, 460, 150)  linhas de 16 px a partir de y=54:
                             cursor x=20 | nome x=32 | preço x=250 (direita, dourado) | "Tem: 3" x=360
                             cinza (#6a7090) = não dá para comprar (sem ouro ou 99)
y=190 win(10, 190, 460, 70)  linha 1 (y=208): descrição do item
                             linha 2 (y=228): passo 'list' -> "J: escolher   K: sair"
                                               passo 'qty'  -> "Quantidade: < 3 >   Total: 90 G   J: confirmar  K: voltar"
                             linha 3 (y=246): aviso (msg) em amarelo/vermelho
```

- Título: `SHOPS[id].name` em maiúsculas na compra; `VENDER` na venda. Preço da venda = `sellPrice`.
- Venda vazia: a janela da lista mostra "Nada para vender" centralizado.
- Navegação: `navY` move o cursor (com volta ao início) no passo `list`; no passo `qty`, `navY` e `navX` mudam ±1 (cima/direita +1, baixo/esquerda −1) com limite entre 1 e o máximo (`maxBuy` ou o que tem). `confirm` avança/compra; `back` volta um passo. Até 8 itens cabem sem rolagem (a vila tem 4; rolagem fica para quando um estoque passar disso).
- Confirmar num item cinza não entra no seletor: mostra "Ouro insuficiente" ou "Bolsa cheia".
- Avisos: "Comprou 3 Pocao!", "Vendeu 2 Pocao (+30 G)". Textos sem acentos.
- Componentes reutilizados: `win`, `text`, `cursor`, `navY`, `navX`, `confirm`, `back` de `ui/ui.js`.

## Conteúdo e arte

| Item | Origem | Placeholder | Pipeline |
| :--- | :--- | :--- | :--- |
| Ícones de itens | REC-01 (adiado) | Só texto colorido | Futuro: `assets/source/items_sheet.png` |
| Mercador, Estalajadeira | Já integrados (folha `npcs`) | — | — |
| Falas da loja/estalagem | `src/dialogues.js` | — | — |

## Abordagem de testes

### Testes de unidade

| ID | Caso | CA | Resultado esperado |
| :--- | :--- | :--- | :--- |
| TU-01 | `gainXp` puro: XP, level up e herói caído não ganha | CA-01 | Mesmos números de antes (curva `xpToNext`, +10% HP, +2 atk, +1 def, +4 MP) |
| TU-02 | `separateFromNpcs` (BUG-01 e parede) importado de `interaction.js` | CA-01 | Mesmos resultados dos testes atuais |
| TU-03 | Comprar 3 Poções com 100 G e 3 na bolsa | CA-03 | `ok`, ouro 10, poções 6, `cost` 90 |
| TU-04 | `maxBuy` com 100 G (Poção) e com 97 Poções | CA-04 | 3; e 2 (limite da bolsa) |
| TU-05 | Comprar Poção com 20 G | CA-05 | `reason: 'gold'`, carteira igual |
| TU-06 | Comprar com 99, e comprar 3 tendo 98 | CA-06 | `reason: 'full'` nos dois, carteira igual |
| TU-07 | Vender 2 de 3 Poções; depois vender a última | CA-07 | +30 G, sobra 1; depois a chave `potion` some |
| TU-08 | `sellPrice` arredonda para baixo (preço ímpar fictício) e de todos os itens = `floor(price/2)` | CA-07, CA-14 | Inteiro, nunca maior que a metade |
| TU-09 | `sellableItems` com bolsa vazia e com chave desconhecida | CA-08 | `[]`; id desconhecido fica de fora |
| TU-10 | `rest` com 1 caído e feridos, 50 G, preço 20 | CA-10 | `ok`, todos vivos com HP/MP cheios, ouro 30, `revived` = o caído |
| TU-11 | `rest` com 10 G | CA-11 | `reason: 'gold'`, heróis e ouro iguais |
| TU-12 | `rest` com grupo cheio | CA-12 | `reason: 'rested'`, ouro igual (mesmo sem ouro: `rested` vem antes) |
| TU-13 | Entradas inválidas: id inexistente, qty 0, −1, 1,5, `NaN`; vender mais do que tem | CA-14 | `unknown`/`qty`/`none`, carteira igual |
| TU-14 | Sequência aleatória de 500 compras/vendas com semente | CA-14 | Ouro ≥ 0 e cada quantidade entre 1 e 99 o tempo todo |

### Testes de integração de conteúdo

| ID | Caso | CA | Resultado esperado |
| :--- | :--- | :--- | :--- |
| TI-01 | Suíte inteira continua verde após a divisão | CA-01 | `npm test` sem falhas |
| TI-02 | Guarda de tamanho: todo `src/**/*.js` ≤ 400 linhas, exceto a lista de dívidas conhecidas (`map/art.js`) | CA-01 | `game.js` ≤ 400; exceção explícita no teste |
| TI-03 | Todo `SHOPS[*].stock` aponta para `ITEMS` com `price` inteiro > 0; toda chave de `SHOPS`/`INNS` existe em `DIALOGUES`; a vila vende os 4 itens | CA-02 | — |
| TI-04 | Toda `action` usada em `DIALOGUES` está em `{shop, sell, inn}` (ou ausente); NPC com `shop`/`sell` tem `SHOPS`, com `inn` tem `INNS` | CA-02, CA-10 | Nenhum `'soon'` sobrando |
| TI-05 | `INN_LINES` sem acentos e `offer` contém `{price}` | CA-10 | — |

### Testes ponta a ponta (navegador)

Seguir a memória do projeto: aba separada, **Novo Jogo**, nunca gravar sobre o espaço 1.

| ID | Fluxo | CA | Resultado esperado |
| :--- | :--- | :--- | :--- |
| E2E-01 | Após a tarefa 1: novo jogo → floresta, derrotar inimigos → voltar à vila, falar com um NPC → menu, usar Poção | CA-01 | Dano, XP, ouro, itens no chão e conversa iguais; console sem erros |
| E2E-02 | E perto do Mercador → Comprar | CA-02 | `game.mode === 'shop'`, 4 itens com preço e "Tem", ouro visível (captura ampliada) |
| E2E-03 | `game.gold = 100`, Poção, ↑ ×5, J | CA-03, CA-04 | Seletor para em 3, total 90; `gold === 10`, `inventory.potion === 6`, aviso |
| E2E-04 | `game.gold = 20` → Poção; `inventory.potion = 99` → Poção; bolsa vazia → Vender | CA-05, CA-06, CA-08 | "Ouro insuficiente", "Bolsa cheia", "Nada para vender"; estado igual |
| E2E-05 | Vender 2 de 3 Poções; K/Esc até sair; checar inimigo parado com loja aberta (na floresta via `game.openShop`) | CA-07, CA-09 | +30 G; volta passo a passo até `play`; posição do inimigo igual |
| E2E-06 | `heroes[1].hp = 0; alive = false`, feridos, 50 G → Descansar → Sim; depois 10 G; depois grupo cheio | CA-10, CA-11, CA-12 | Escurece/clareia, todos cheios, 30 G; aviso de falta de ouro; aviso de "descansados" sem cobrar |
| E2E-07 | Comprar, salvar no cristal em espaço livre (2 ou 3), recarregar a página, Continuar | CA-13 | Ouro e bolsa iguais; um save anterior (se existir) também carrega |
| E2E-08 | Cronometrar com teclado simulado: E no Mercador → Comprar → Poção → ↑↑ → J | CA-15 | < 30 s (o fluxo leva poucos segundos) |

## Sequenciamento

1. **Dividir o `game.js`** (`combat-system.js`, `interaction.js`), migrar os testes de separação, criar TU-01, TI-02 e rodar E2E-01. Primeiro porque é a base onde a loja entra e porque, sozinha, não muda nada visível — fica fácil confirmar que nada quebrou.
2. **Dados e regras puras:** `SHOPS`, `INNS`, `MAX_STACK`, `SELL_RATE` em `items.js`; `shop.js`; TU-03 a TU-14 e TI-03. Lógica testada antes de qualquer tela.
3. **Tela da loja:** `ui/shop.js`, modo `shop`, `openShop`/`closeShop`, ações `shop`/`sell` em `dialogues.js` e `dialogAction`; TI-04; E2E-02 a E2E-05.
4. **Estalagem:** fade generalizado (`startTransition`), `INN_LINES`, fluxo `inn`/`innRest` em `interaction.js`; TI-05; E2E-06.
5. **Fechamento:** E2E-07 e E2E-08, `README` (como comprar/descansar), `CHANGELOG`, rules (`game-architecture.md` §2/§4/§5/§7, `folder-structure.md` §2/§5, `tests.md` §3), `AGENTS.md` (dívida técnica e fase 4).

## Riscos

| Risco | Mitigação |
| :--- | :--- |
| A divisão muda o comportamento do combate sem ninguém notar | Mover código sem reescrever; métodos finos com os mesmos nomes; TU-01, suíte atual e E2E-01 antes de seguir |
| Esquecer um chamador de `game.damage`/`explode`/`dropPickup` | Manter esses nomes no `Game`; busca por `game\.` em `heroes.js`/`enemies.js` na revisão |
| Import circular ao extrair (sistemas ↔ game) | Sistemas recebem `game` por parâmetro e nunca importam `game.js` |
| Fade da estalagem chamar `enterMap` por engano | `onMid` explícito; `startFade` antigo monta seu próprio `onMid` |
| Jogador fecha o jogo no meio do fade do descanso | Cobrança e cura acontecem antes do fade; nada fica pela metade |
| Quantidade 99 ultrapassada por item pego no chão (`potion` dos inimigos) | Fora do escopo da loja, mas `updatePickups` passa a respeitar `MAX_STACK` (uma linha; não muda nada abaixo de 99) |
| Texto não cabe na largura em 480 px | Nomes de itens curtos; preço alinhado à direita; verificação visual ampliada (E2E-02) |

## Principais decisões

| Decisão | Motivo | Alternativa descartada |
| :--- | :--- | :--- |
| Dividir em `combat-system.js` + `interaction.js` (funções com `game` por parâmetro) | Tira ~190 linhas, respeita "ninguém importa `game.js`" e torna `gainXp`/`separateFromNpcs` testáveis sem o `Game` | `campaign.js` também agora (o `game.js` já fica abaixo de 400 sem ele; fica para quando crescer) |
| `Game` mantém métodos finos (`damage`, `explode`...) | Heróis e inimigos não mudam; refatoração menor e segura | Trocar todos os chamadores para importar o sistema |
| Lojas e estalagens indexadas pelo id do NPC | Zero campo novo nas falas e nos mapas; loja nova = uma linha em `SHOPS` | Campo `shop` no mapa (`B.npc`) ou no diálogo |
| `shop.js` opera sobre uma "carteira" (`game` serve) | Puro e testável com objetos simples | Métodos de compra dentro do `Game` |
| Estalagem sem tela própria (conversa Sim/Não + fade) | Reaproveita `DialogRunner` e o fade; menos código | Tela `InnScreen` |
| Fade generalizado com `dur`/`onMid`/`onEnd` | Um único mecanismo de escurecer para mapas e descanso | Segundo fade só da estalagem |
| Cobrar e curar antes do fade | Estado correto mesmo se a animação for interrompida | Aplicar no meio do fade |
| Fechar a loja volta ao jogo, não à conversa | Mais rápido (objetivo dos 30 s) e é o que o PRD pede | Reabrir o menu Comprar/Vender |
| Sem rolagem na lista (até 8 itens) | A vila tem 4; evita código sem uso | Rolagem já agora |

## Conformidade

- **AGENTS.md e rules:** todas as rules de `.agents/rules/` foram lidas. Relevantes: `code-standards.md` (limite de 400 linhas/60 por função; preços em `items.js`; tempo por `dt`), `javascript.md` (sem DOM no topo — `shop.js` e os sistemas são importáveis no Node; JSDoc nos contratos `Wallet`/`ShopResult`; tabelas imutáveis), `folder-structure.md` (`ui/shop.js` e `shop.js` já previstos; camada de sistemas nova documentada), `game-architecture.md` (modo novo com classe de UI + callback; ações `shop`/`sell`/`inn` em `dialogAction`; save inalterado), `tests.md` (TU para toda regra com número; testes de conteúdo iteram sobre todas as lojas), `documentation.md` (IDs, CHANGELOG, roteiro).
- **Skills aplicáveis:** nenhuma de arte nesta entrega (REC-01 adiado; quando chegar, seguir `pixel-art-assets.md#5`). Fluxo: `/criar-tasks` → `/executar-task` (a tarefa 1 é a divisão do `game.js`) → `/executar-review` → `/executar-qa`.

## Arquivos relevantes

- **Lidos:** `AGENTS.md`, `.agents/rules/*.md`, `tasks/prd-loja-e-estalagem/prd.md`, `tasks/prd-npcs-e-dialogos/codereview.md`, `src/game.js`, `src/items.js`, `src/dialogues.js`, `src/dialog-runner.js`, `src/ui/ui.js`, `src/ui/dialog.js`, `src/ui/menu.js`, `src/save.js`, `src/data.js`, `tests/dialog.test.mjs`, `tests/content.test.mjs`.
- **Criados:** `src/combat-system.js`, `src/interaction.js`, `src/shop.js`, `src/ui/shop.js`, `tests/systems.test.mjs`, `tests/shop.test.mjs`.
- **Alterados:** `src/game.js`, `src/items.js`, `src/dialogues.js`, `tests/dialog.test.mjs`, `tests/content.test.mjs`, `README.md`, `CHANGELOG.md`, `AGENTS.md`, `.agents/rules/game-architecture.md`, `.agents/rules/folder-structure.md`, `.agents/rules/tests.md`, `prompts/README.md`.
