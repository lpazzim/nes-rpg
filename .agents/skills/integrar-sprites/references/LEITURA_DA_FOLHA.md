# Como ler as folhas de sprite do usuário

Aprendizados da integração de Aster, Rin, Kaito, Treant, Espantalho, Cavaleiro e Soldado cibernético.

## Organização típica (5 linhas, ~1024 x 434)

| Linha | Conteúdo comum |
| :--- | :--- |
| 0 | Parado em várias direções, em grupos: frente (2), frente/andando (3–4), costas (3), 3/4 lado (3–4), 3/4 costas (4) |
| 1 | Andar/correr: de lado (4), de costas (3–4), de frente (3–4); às vezes salto |
| 2 | Ataques: preparação → golpe → retorno, muitas vezes com efeitos (arco, faíscas, tiro) |
| 3 | Habilidades, defesa/escudo, magias em área; início das reações a dano |
| 4 | Dano/atordoado e morte (caído no chão, desintegrando) |

Os grupos dentro de uma linha são separados por espaços maiores. Use-os para saber onde começa cada animação.

## Folha de NPCs (vários personagens)

- Formato recebido: 3 linhas x 4 NPCs, cada NPC com 4 poses **frente, frente alternativa, costas, lado** e o nome escrito acima.
- Uma única entrada `npcs` no config, com animações `<npc>.<animação>` geradas por `npcAnims([...ids])` na ordem da folha (da esquerda para a direita, de cima para baixo).
- Use `dropAbove: true` (remove os títulos) e `colors: 96` (paleta compartilhada).
- Só há um quadro de costas e um de lado: o jogo cria o balanço do passo no código.

## Direção

- Poses **de lado** quase sempre olham para a **direita**; confirme pela direção do rosto e da inclinação da corrida.
- "Frente" = de frente para a câmera (andar para baixo). "Costas" = cabelo/capa visíveis (andar para cima).
- Poses 3/4 servem como "lado" se não houver perfil puro.

## Armadilhas já vistas

| Problema | Exemplo | Solução |
| :--- | :--- | :--- |
| Poses grudadas por efeitos | Rin: cortes com rastro dourado; Cavaleiro: estocadas; Soldado: tiros | `splits` no config |
| Arma de uma linha invadindo a de cima | Espantalho: foices | A detecção por sombras já separa as linhas; confira a prévia |
| Projétil solto virando "quadro" | Soldado: balas | Aproveite como animação de projétil (`bolt`) |
| Quadro com roupa diferente | Kaito 24–31 (marrom) | Não use; peça correção ao usuário |
| Arma dividida errado | Estocadas do Cavaleiro sem a espada | Descarte a animação ou escolha outros quadros |
| Quadros de "levantar" no meio da morte | Treant 45–46 | Escolha a ordem manualmente: queda → caído → desintegra |
| Cinza do personagem parecido com o fundo | Armadura do Cavaleiro | Já tratado (fundo removido só pelas bordas); confira furos |

## Velocidades que funcionaram

| Animação | fps |
| :--- | :--- |
| Parado | 2–5 |
| Andar | 6–10 (correr: 10–12) |
| Ataque rápido | 14–16 |
| Ataque pesado / magia | 9–12 |
| Morte | 8–9 |
