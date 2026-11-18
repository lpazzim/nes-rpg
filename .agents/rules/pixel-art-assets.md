# Pixel Art e Recursos Visuais

---

## 1. Alvo visual (estilo SNES)

| Item | Padrão |
| :--- | :--- |
| Resolução do jogo | 480 x 270, ampliada inteira, sem suavização |
| Personagens comuns | ~39 px de altura no jogo |
| Chefes | Até 2x o tamanho (campo `scale` em `ENEMIES`) |
| Blocos | 16 x 16 px |
| Cores | 15 bits (canais múltiplos de 8); até 40 cores por personagem (`colors` no config) |
| Sombra | Elipse preta semitransparente sob os pés (gerada pelo pipeline a partir da sombra da folha) |
| Contorno | Escuro, herdado da arte original |

---

## 2. Formato das folhas de sprite (pedido ao usuário)

O pipeline (`tools/detect-frames.js` + `tools/build-sprites.js`) espera:

1. **Fundo cinza liso e uniforme** (ex.: `#48505A`), sem gradiente, sem textura.
2. **Uma sombra elíptica escura sob os pés de cada quadro.** É ela que separa as linhas e define o ponto de apoio.
3. Personagens de lado **virados para a DIREITA** (o jogo espelha para a esquerda).
4. Personagem com ~78 px de altura na folha, desenhado com "pixels" de 2x2.
5. Quadros separados por espaço de fundo; efeitos (cortes, tiros) podem encostar no vizinho, porque o pipeline divide pela faixa do tronco e aceita `splits` manuais.
6. Linhas organizadas por assunto (parado, andando, ataques, dano, morte).

### Quadros necessários

| Tipo | Obrigatórios | Desejáveis |
| :--- | :--- | :--- |
| Herói | parado e andando (frente, costas, lado), ataque, habilidade, especial, dano, morte | ataque de frente/costas, ciclo de andar com 4–6 quadros |
| Inimigo | parado, andar, ataque, dano, morte | 2º ataque, comportamento especial |
| Chefe | igual ao inimigo + 2–3 ataques | intro, fase 2 |
| NPC | parado e andando (frente, costas, lado) | gesto de fala |

---

## 3. Pipeline

```sh
node tools/detect-frames.js <nome> previa.png    # numera os quadros (usa splits do config)
npm run sprites -- <nome>                         # gera o atlas e o sprites.json
PREVIEW=<pasta-temporária> npm run sprites -- <nome>   # + prévia ampliada de cada animação (Git Bash)
```

`tools/sprites.config.js`, por folha:

| Campo | Uso |
| :--- | :--- |
| `file` | Caminho em `assets/source/` |
| `splits` | `{ idDoQuadro: quantidade }` para quadros grudados |
| `scale`, `colors` | Sobrescrevem os padrões (2 e 40); folhas com vários personagens precisam de mais cores (NPCs: 96) |
| `dropAbove` | Descarta o que está inteiro acima da cabeça (títulos escritos na folha) |
| `anims.<nome>.f` | Lista de quadros em ordem |
| `anims.<nome>.fps`, `loop` | Velocidade; `loop: false` para golpes e morte |
| `anims.<nome>.hit` | Índice (na lista `f`) do quadro de impacto, usado por `Animator.hitNow()` |

Nunca edite `assets/sprites/*` à mão. Tudo sai do pipeline.

---

## 4. Conferência obrigatória

Antes de dar a arte como integrada:
1. Abrir a prévia de cada animação e checar: quadros na ordem certa, nenhum pedaço de vizinho, nenhum furo no meio do corpo, sombra no lugar.
2. Ver o personagem em jogo: tamanho comparado aos outros, espelhamento, cores.
3. `npm test` (o teste de conteúdo confere as animações obrigatórias).

Problemas comuns: furos em cinzas parecidos com o fundo (o fundo é removido só a partir das bordas); halos de magia (regra `isBackground`); ponta de arma solta (o pipeline junta pedaços estreitos ao vizinho).

---

## 5. Outros recursos

| Recurso | Formato | Local |
| :--- | :--- | :--- |
| Retrato do menu | Busto, quadrado (~256 px), fundo liso ou transparente | `assets/portraits/<id>.png` + id em `portraits.json` |
| Ícones de item (futuro) | 16 x 16, folha em grade | `assets/source/items_sheet.png` |
| Tileset/inspiração de mapa | Qualquer; **só referência** | `assets/source/*_inspiration.*` |
| Áudio (futuro) | `.ogg` curto e em loop | `assets/audio/` |

A arte de mapas é **pintada por código** em `src/map/art.js`, imitando a inspiração. Não recorte imagens de inspiração para usar no jogo.

---

## 6. Como pedir arte ao usuário

Use este modelo na conversa e copie a pendência para a seção "Recursos externos" do PRD:

```
Preciso de: <o quê> (<para qual funcionalidade>)
Formato: fundo cinza liso, sombra no chão, virado para a direita, mesmo estilo das folhas atuais
Quadros: <lista: parado (frente/costas/lado), andar, ...>
Tamanho: personagem com ~78 px de altura na folha (pixels de 2x2)
Enquanto isso: uso um placeholder <descrição>, que será trocado quando a arte chegar
```

Regras: nunca pedir arte de personagens ou obras existentes; sempre oferecer um placeholder para não travar o desenvolvimento.
