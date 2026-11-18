# Mapas e Aventuras

Como montar mapas e organizar a campanha. Toda aventura nova segue este padrão (skill `/criar-aventura`).

---

## 1. Estrutura de uma aventura

```
CIDADE (base segura) → EXTERIOR (campo/estrada) → DUNGEON (2–3 andares) → ARENA DO CHEFE → portal de volta à cidade
```

| Mapa | Tamanho sugerido (blocos) | `safe` | `dark` | Cristal de save | Inimigos |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Cidade | 64 x 48 | sim | não | 1 (praça) | nenhum (3–5 NPCs: mercador, estalagem, moradores) |
| Exterior | 128 x 96 | não | não | 1 (antes da dungeon) | 6–10 zonas, 2–3 cada |
| Andar de dungeon | 72 x 56, 10–11 salas | não | sim | último andar: na sala final | 2–4 por sala |
| Arena do chefe | ~40 x 34 | não | sim | não | só o chefe |

- A arena tem a saída selada (`sealedByBoss`) e um portal com `requires: '<flag>'`, que leva de volta à cidade.
- Um arquivo por aventura: `src/maps/adventureN.js`, com funções `buildX()` exportadas.
- Registre cada mapa em `src/maps/index.js` com `name` (exibido no banner e no save) e `adventure`.

---

## 2. Ids e nomes

| Item | Padrão | Exemplos |
| :--- | :--- | :--- |
| Id de mapa | português, minúsculas, `_` para sufixo | `vila`, `floresta`, `bosque1`, `bosque_boss` |
| Nome exibido | Português **sem acentos** (canvas) | `'Raizes do Bosque - 1o andar'` |
| Entradas | Onde se chega, descritivo | `inicio`, `leste`, `oeste`, `caverna`, `entrada`, `escada`, `cristal` |
| Flag de chefe | Tema da aventura | `bosque`, `reino`, `neon` |

Entradas reservadas: `entrada` (chegada pela escada de cima), `escada` (chegada vinda de baixo), `cristal` (criada por `B.crystal`).

---

## 3. Blocos do chão

| Código | Bloco | Colisão | Tema típico |
| :--- | :--- | :--- | :--- |
| `g` | Grama | livre | cidade/exterior |
| `f` | Chão de floresta | livre | exterior |
| `d` | Terra/estrada | livre | todos |
| `s` | Campo arado (com plantação via `B.field`) | livre | fazenda |
| `w` | Água | bloqueia andar (projéteis passam) | todos |
| `b` | Ponte (criada por `B.road` sobre água) | livre | todos |
| `c` | Calçamento | livre | castelo |
| `m` | Piso metálico com neon | livre | futurista |
| `x` | Muralha | sólido | castelo |
| `k` | Prédio/bloco cyber | sólido | futurista |
| `n` | Chão de caverna | livre | dungeon `roots` |
| `v` | Parede de caverna | sólido | dungeon `roots` |

Bloco novo: pintor em `map/art.js` (`case` em `paintGround`), colisão em `World` (lista de sólidos) e `WALKABLE` em `tests/maps.test.mjs`.

---

## 4. `MapBuilder` (src/maps/builder.js)

| Método | Uso |
| :--- | :--- |
| `new MapBuilder(w, h, fill)` | Mapa preenchido com um bloco |
| `rect`, `ellipse`, `stroke` | Pintar regiões |
| `river(pts)`, `road(pts, largura)` | Rio; estrada (vira ponte sobre a água) |
| `field(x0, y0, x1, y1, lado, x)` | Campo arado com cerca e abertura |
| `add(tipo, tx, ty, variante, dx, dy)` / `addPx(tipo, x, y, variante, extra)` | Objeto por bloco / por pixel |
| `reserve(...)`, `isReserved`, `nearOpen` | Proteger áreas (não nascem árvores) |
| `trees(onde, { seed, density })` | Preencher com árvores e arbustos |
| `crystal(tx, ty, entrada)` | Cristal de save + entrada logo abaixo |
| `zone(x, y, tipo, qtd, { radius, boss, respawn })` | Área de inimigos |
| `npc(id, tx, ty, { dir, wander })` | Morador (id da folha `npcs` com falas em `dialogues.js`); `wander` = raio de passeio em blocos. Chame **antes** de `trees` (reserva o espaço) |
| `exit(x0, y0, x1, y1, mapa, entrada, opts)` / `entry(nome, x, y, dir)` | Passagens |
| `build({ theme, dark, safe })` | Layout final |

Ordem recomendada: **regiões → água → clareiras → campos → estradas → construções (com `reserve`) → árvores → decoração → zonas → entradas/saídas**.

### Objetos disponíveis (`map/art.js`)

`tree` (2 variantes), `bush`, `rock`, `stump`, `mushroom`, `fenceH`, `fenceV`, `barn`, `house` (0 laranja, 1 cinza), `fountain`, `stall` (0 azul, 1 vermelha), `barrel`, `planter`, `hay`, `crate`, `lamp`, `pipe`, `cave`, `stairsUp`, `stairsDown`, `bossDoor`; dinâmicos: `crystal`, `portal`.

Objeto novo: função em `OBJECTS` devolvendo `{ buf, ax, ay, foot | solids, flat }`. `foot` é a base sólida; `solids` são retângulos relativos à âncora; `flat` faz o objeto ser desenhado no chão, sem ordenação.

---

## 5. Dungeons (src/maps/dungeon.js)

`buildDungeon({ seed, theme, rooms, enemies, perRoom, up, down, crystalAtEnd })`

- `theme`: `roots` (pronto), `castle` (usa `c`/`x`), `lab` (usa `m`/`k`). Tema novo: entradas em `FLOOR`, `WALL` e `DECOR`.
- `up`: `{ to, entry }` da escada de subida (sala inicial, sem inimigos).
- `down`: `{ to, entry, boss }`; com `boss: true` desenha a porta do chefe.
- A **semente** define o layout para sempre. Trocar a semente de um andar já lançado muda os saves que estejam naquele andar.

---

## 6. Flags da campanha

| Flag | Significado | Definida em |
| :--- | :--- | :--- |
| `bosque` | Treant Ancião derrotado (aventura 1 concluída) | zona do chefe em `bosque_boss` |
| `premio_bosque` | Coração do Bosque já foi pego (senão a peça volta ao chão ao reentrar na arena) | `updatePickups` |

Toda flag nova entra nesta tabela.

---

## 7. Verificação de mapa

1. `npm test`: saídas → mapas e entradas existentes, entradas andáveis e fora das saídas, tudo alcançável, layout determinístico.
2. No preview: `game.enterMap('<id>', '<entrada>')` e percorrer as saídas; olhar a densidade de árvores e de inimigos e se há passagens bloqueadas por objetos (o teste só enxerga os blocos, não os objetos).
