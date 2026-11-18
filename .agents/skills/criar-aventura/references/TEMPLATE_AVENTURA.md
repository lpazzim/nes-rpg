# Aventura [N] — [Nome]

## Tema

[Ambientação, paleta e clima em 2–3 frases. Ex.: "Reino medieval de pedra; muralhas cinzas, estandartes vermelhos, masmorras úmidas."]

## Mapas

| Id | Nome exibido | Tipo | Tamanho | `dark` | `safe` | Tema de blocos |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `[id]` | `[Nome sem acentos]` | Cidade | 64x48 | não | sim | [g, d, c, x...] |
| `[id]` | | Exterior | 128x96 | não | não | |
| `[id]1` | | Dungeon 1 | 72x56 | sim | não | `castle` / `lab` / `roots` |
| `[id]_boss` | | Arena | 40x34 | sim | não | |

## Grafo de passagens

```text
[cidade]:leste  ->  [exterior]:oeste
[exterior]:dungeon  ->  [id]1:entrada
[id]1:escada(baixo)  ->  [id]2:entrada
[id]N:porta do chefe  ->  [id]_boss:entrada
[id]_boss:portal (requires: [flag])  ->  [cidade]:inicio
```

## Cristais de save

| Mapa | Posição aproximada | Entrada criada |
| :--- | :--- | :--- |
| Cidade | praça | `cristal` |
| Exterior | antes da dungeon | `cristal` |
| Último andar | sala final | `cristal` |

## Inimigos

| Mapa | Zonas | Tipos | Qtd. por zona | Sementes |
| :--- | :--- | :--- | :--- | :--- |
| Exterior | [6–10] | [tipos] | 2–3 | — |
| Dungeon 1 | por sala | [tipos] | 2–3 | `[semente]` |

## Chefe

- Inimigo: `[id em ENEMIES]` (`boss: true`, `scale`)
- Flag: `[flag]`
- Mecânica principal: [o que o jogador precisa aprender para vencer]

## Blocos e objetos novos

- [ex.: estandarte, tocha de parede, bloco de grade de prisão]

## Recursos externos

| REC | Recurso | Placeholder |
| :--- | :--- | :--- |
| REC-01 | [folha do chefe] | [inimigo existente com `scale: 2` e outra cor] |
