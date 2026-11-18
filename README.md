# My RPG — Protótipo

RPG de ação inspirado no estilo de *Seiken Densetsu 3*, com personagens, mundo e arte próprios.
Os heróis e os inimigos usam a arte definitiva, convertida para o estilo SNES. O mapa é pintado por código, pixel a pixel.

## Como rodar

Precisa do [Node.js](https://nodejs.org).

```bash
npm install
npm start
```

Depois abra **http://localhost:8080** no navegador.

## Controles

| Tecla | Ação |
|---|---|
| WASD / Setas | Mover |
| J (segurar) | Ataque básico |
| K | Habilidade |
| L | Especial (quando a barra de PODER estiver cheia) |
| Espaço | Esquiva (invencível durante o avanço) |
| Tab / Q | Trocar o herói controlado |
| Enter / Esc | Abrir o menu (status, itens) |
| E | Conversar com moradores / usar o cristal de save |
| P | Pausar |
| H | Mostrar/esconder ajuda |

No menu: **Q/E** trocam a aba, **setas** escolhem, **J** confirma e **K** volta.

## Heróis

| Herói | Estilo | J — Ataque | K — Habilidade | L — Especial |
|---|---|---|---|---|
| **Kaito** | Katana | Corte | Corte Pesado (arco azul) | **Iaido**: avança cortando tudo |
| **Rin** | Duas adagas | Combo de 3 golpes, muito crítico | Arremesso de 3 adagas | **Tempestade de Lâminas**: redemoinho |
| **Aster** | Poderes | Orbe **azul** (deixa lento) | Orbe **vermelho** (gasta MP, explode) | **Espiral Dupla**: 16 orbes |

Cada herói anda em 3 direções (frente, costas e lado, espelhado para a esquerda) e tem animações de ataque, habilidade, especial, dano e morte.

## Campanha

A campanha é dividida em **aventuras**. Cada uma tem um tema e segue o roteiro
**cidade → exterior → dungeon (andares) → chefe**. Vencer o chefe abre um portal de volta para a cidade.

| Aventura | Mapas | Situação |
|---|---|---|
| 1. O Bosque Ancião | Vila de Pradaria → Floresta Sussurrante → Raízes do Bosque (2 andares) → Coração do Bosque (**Treant Ancião**) | pronta |
| 2. Reino de Pedra | cidade murada → estrada → masmorras do castelo → chefe medieval | precisa da arte do chefe |
| 3. Neon | cidade futurista → periferia → laboratório → chefe futurista | precisa da arte do chefe |

Inimigos: **Espantalho** (foice e salto), **Treant** (disfarçado de toco; garra e raízes),
**Cavaleiro** (bloqueia de frente) e **Soldado cibernético** (tiro e escudo). Os dois últimos ficam para as aventuras 2 e 3.

- **Moradores:** na Vila de Pradaria vivem o Mercador, a Estalajadeira, o Velho Agricultor e o Jovem Aprendiz. Chegue perto e aperte **E** para conversar: **J** avança o texto, as **setas** escolhem respostas e **K/Esc** escolhe "Sair". As falas mudam depois que o Treant Ancião é derrotado.
- **Loja (Mercador):** escolha **Comprar** ou **Vender**. Na lista, **setas** escolhem o item e **J** confirma; depois as **setas** mudam a quantidade (o total aparece na tela) e **J** compra ou vende. **K** volta um passo. Cada item guarda no máximo 99 e a venda paga metade do preço. A loja da vila vende Poção (30 G), Poção Forte (90 G), Éter (60 G) e Pena de Fênix (150 G).
- **Estalagem (Estalajadeira):** escolha **Descansar** e confirme com **Sim**. Por 20 G a tela escurece e clareia, o grupo recupera todo o HP e o MP e quem estava caído revive. Ela avisa se faltar ouro ou se o grupo já estiver descansado (nada é cobrado nesses casos).
- **Equipamento:** cada heroi tem **arma, armadura e acessorio**. Abra o menu (**Enter**), va para a aba **Equip.** (**Q/E**), escolha o espaco com **cima/baixo**, troque de heroi com **esquerda/direita** e aperte **J** para ver as pecas da bolsa. Antes de confirmar, a comparacao mostra o que muda: **verde** melhora, **vermelho** piora. "Tirar" deixa o espaco vazio.
- **Armas por heroi:** a katana so serve ao Kaito, as adagas a Rin e o bastao ao Aster. Armaduras e acessorios servem a todos. Todos comecam com a arma inicial, que nao da bonus.
- **Onde conseguir pecas:** a loja da vila vende armas, armadura e acessorio; o Treant Anciao deixa o **Coracao do Bosque** no chao.
- **Pecas, precos e bonus:** ficam em `src/equipment.js`. Precos e estoques das lojas em `src/items.js` (`SHOPS` e `INNS`), por NPC. Falas em `src/dialogues.js`.
- **Editar as falas:** todos os textos ficam em `src/dialogues.js`, escritos sem acentos (a fonte do jogo ainda não tem acentos). O `npm test` avisa se algo estiver fora do padrão.
- **Save:** toque no **cristal azul** (tecla E). Ele cura o grupo e abre os 3 espaços de save. Há cristais na vila, na entrada da caverna e antes do chefe.
- **Tela título:** Novo jogo ou Continuar. Na tela de Game Over dá para carregar o último save.
- **Itens:** Poção, Poção Forte, Éter e Pena de Fênix. Use pelo menu. Os inimigos deixam ouro e às vezes poções.
- **Retratos do menu:** coloque `assets/portraits/kaito.png` (e rin, aster) e liste os nomes em `assets/portraits/portraits.json`, por exemplo `["kaito", "rin", "aster"]`. Sem retrato, o menu mostra o sprite ampliado.

### Criar ou editar mapas

- `src/maps/adventure1.js` monta cada mapa: chão, estradas, rio, casas, árvores, inimigos, **saídas** (`B.exit`), **entradas** (`B.entry`) e cristais (`B.crystal`).
- `src/maps/dungeon.js` gera os andares da dungeon a partir de uma semente. Mudar a semente gera outro layout.
- `src/maps/index.js` registra os mapas com nome e aventura.

## Sprites (arte → jogo)

As folhas originais ficam em `assets/source/`. O script converte cada uma:
1. Encontra os quadros automaticamente: as linhas pelas sombras, e os personagens pela faixa do tronco.
2. Remove o fundo e transforma a sombra em preto semitransparente.
3. Reduz pela metade, já que a arte usa "pixels" de 2x2.
4. Limita as cores, em 15 bits como no SNES.

```bash
npm run sprites                  # gera assets/sprites/*.png e sprites.json
npm run sprites -- kaito knight  # só algumas folhas
```

As animações (quais quadros, velocidade e quadro de impacto) ficam em **`tools/sprites.config.js`**.
Para ver os números dos quadros de uma folha:

```bash
node tools/detect-frames.js kaito previa.png
```

Se dois quadros saírem grudados (efeitos que se encostam), use `splits: { numero: quantidade }` na configuração.

## Organização do código

```
src/data.js            NÚMEROS DO JOGO: heróis, inimigos, XP  <- comece por aqui
src/main.js            inicialização e loop
src/game.js            campanha: troca de mapas, modos, save, desenho da cena
src/combat-system.js   combate: dano, mortes, XP, hitboxes, zonas de inimigos
src/interaction.js     tecla E: cristais, conversas, loja e estalagem
src/shop.js            regras de comprar, vender e descansar
src/items.js           itens, lojas e estalagens
src/equipment.js       pecas de equipamento e as regras de equipar
src/save.js            espaços de save (no navegador)
src/ui/                tela título, menu, loja, tela de save, janelas
src/maps/              mapas de cada aventura e o gerador de dungeons
src/heroes.js          heróis: controles, IA dos aliados, golpes, animações
src/enemies.js         inimigos: IA (emboscada, bloqueio, tiro, salto) e animações
src/sprites.js         carrega os sprites e toca as animações
src/combat.js          hitboxes, fórmula de dano, números e partículas
src/world.js           mapa carregado: colisão, saídas e desenho
src/map/art.js         arte do mapa (grama, água, caverna, muralha, árvores, casas...)
src/hud.js             interface
tools/build-sprites.js converte a arte em sprites
tools/detect-frames.js detecta os quadros das folhas
tools/sprites.config.js animações de cada personagem
tools/sync-skills.js   copia as skills para .claude/skills
tests/                 testes automáticos (npm test)
prompts/               roteiro das próximas funcionalidades
tasks/                 PRD, TechSpec, tarefas, review e QA de cada funcionalidade
```

## Desenvolvimento com IA

O guia para agentes de IA fica no [AGENTS.md](AGENTS.md): arquitetura, comandos, regras em `.agents/rules/` e fluxos (skills) em `.agents/skills/`.
O roteiro das próximas funcionalidades está em [prompts/README.md](prompts/README.md) e o histórico de entregas no [CHANGELOG.md](CHANGELOG.md).

```bash
npm test             # confere mapas, sprites, itens e regras
npm run skills:sync  # depois de editar uma skill em .agents/skills
```

## Próximos passos

Veja o roteiro em [prompts/README.md](prompts/README.md).
