# PRD — NPCs e diálogos

Origem: `prompts/03-npcs-e-dialogos.md`

## Visão geral

Hoje a Vila de Pradaria é bonita, mas vazia: não há ninguém com quem conversar, e as próximas etapas (loja, estalagem, aventuras 2 e 3) dependem de personagens que falem com o jogador. Esta funcionalidade coloca **moradores na vila** e cria a **caixa de diálogo no estilo SNES**, com texto aparecendo letra a letra, várias falas em sequência, **escolhas** e falas que mudam conforme o progresso da campanha.

O valor é duplo: a vila ganha vida e o jogador recebe dicas sobre a floresta e a caverna, e o projeto ganha a base reutilizável para a loja, a estalagem e os NPCs medievais e futuristas já integrados (folha `npcs`).

## Objetivos

- O jogador encontra e conversa com os 4 NPCs da vila em menos de 2 minutos após começar um novo jogo.
- 100% dos NPCs são alcançáveis e nenhum bloqueia ruas, portas, o cristal ou a saída leste (verificado jogando e por teste).
- Cada caixa de diálogo mostra no máximo 3 linhas legíveis a 480x270.
- Pelo menos 1 fala de cada NPC muda depois que o Treant Ancião é derrotado (flag `bosque`).
- Nenhum erro no console durante o fluxo completo de conversas.

## Histórias de usuário

- US1: Como jogador, quero ver moradores na vila para sentir que o lugar é vivo.
- US2: Como jogador, quero apertar **E** perto de um morador para conversar com ele.
- US3: Como jogador, quero ler o texto aparecendo aos poucos e avançar no meu ritmo, ou completar a fala de uma vez.
- US4: Como jogador, quero responder a perguntas simples (escolhas) para decidir o rumo da conversa.
- US5: Como jogador, quero receber dicas sobre a Floresta Sussurrante e a caverna antes de explorá-las.
- US6: Como jogador, quero que os moradores reconheçam quando derrotei o Treant Ancião.
- US7 (borda): Como jogador, se um morador estiver andando quando eu falar com ele, quero que ele pare e se vire para mim.
- US8 (borda): Como jogador, quando houver um cristal e um morador perto, quero interagir com o mais próximo, sem confusão.

## Principais funcionalidades

### NPCs no mapa

Personagens que vivem num mapa, desenhados com profundidade como os heróis e com colisão (o grupo não os atravessa). Eles não lutam e não são alvo de golpes.

- RF1: Um mapa pode declarar NPCs com aparência (sprite da folha `npcs`), posição, direção inicial e comportamento (**parado** ou **passeando** numa área pequena ao redor da posição inicial).
- RF2: NPCs que passeiam andam devagar, fazem pausas e nunca saem da sua área nem atravessam obstáculos.
- RF3: Ao começar a conversa, o NPC para e se vira para o líder do grupo; ao terminar, volta ao comportamento anterior.
- RF4: A Vila de Pradaria recebe os 4 NPCs da fazenda: **Mercador** (parado na barraca vermelha), **Estalajadeira** (parada perto de uma casa), **Velho Agricultor** (passeia perto do campo) e **Jovem Aprendiz** (passeia perto do lago).

### Caixa de diálogo

- RF5: Interagir (**E**) com o NPC mais próximo ao alcance abre a caixa de diálogo; a regra do "mais próximo" vale também entre NPCs e o cristal de save.
- RF6: A caixa fica na parte de baixo da tela, no estilo das janelas azuis do jogo, com o **nome do NPC**, até 3 linhas de texto e um indicador piscando quando há mais texto.
- RF7: O texto aparece letra a letra. **J/Enter** completa a fala atual; com a fala completa, avança para a próxima; na última, fecha.
- RF8: Enquanto o diálogo está aberto, o mundo fica parado (inimigos, cronômetros e tempo de jogo não avançam) e o grupo não se move.
- RF9: Uma conversa pode ter **escolhas** (2 a 4 opções), navegadas com as setas e confirmadas com J/Enter; cada opção leva a outras falas ou encerra a conversa. **K/Esc** escolhe a última opção (normalmente "Sair").
- RF10: As falas de um NPC podem depender de **flags** da campanha (ex.: versão diferente depois de `bosque`).

### Conteúdo da vila

- RF11: Cada NPC tem de 2 a 4 falas no tom "aventura leve", em português, escritas para este jogo. O Mercador e a Estalajadeira oferecem escolhas (ex.: "Comprar / Vender / Sair" e "Descansar / Sair"); como loja e estalagem chegam na próxima etapa, essas opções respondem com uma fala avisando que "em breve" estarão disponíveis.
- RF12: Os textos ficam num lugar fácil de editar pelo dono do projeto, separados do código de comportamento.

## Critérios de aceitação

- CA-01: Dado um novo jogo na Vila de Pradaria, quando o jogador anda pela vila, então vê os 4 NPCs da fazenda nas posições descritas, desenhados na frente ou atrás de casas e árvores conforme a posição. (US1, RF1, RF4)
- CA-02: Dado o grupo encostado num NPC, quando o jogador tenta atravessá-lo, então o grupo é bloqueado como por um objeto sólido. (RF1)
- CA-03: Dado um NPC que passeia, quando observado por 30 segundos, então ele anda e pausa sem sair da sua área e sem ficar preso. (RF2)
- CA-04: Dado o líder a até um passo de um NPC, quando o jogador aperta E, então abre a caixa com o nome do NPC, o NPC se vira para o líder e o mundo para. (US2, US7, RF3, RF5, RF6, RF8)
- CA-05: Dado um cristal e um NPC ao alcance, quando o jogador aperta E, então interage com o mais próximo dos dois. (US8, RF5)
- CA-06: Dada uma fala aparecendo, quando o jogador aperta J, então a fala é completada na hora; apertando de novo, passa para a próxima; após a última, a caixa fecha e o jogo volta ao normal. (US3, RF7)
- CA-07: Dada uma conversa com escolhas, quando o jogador escolhe uma opção com as setas e J, então segue as falas daquela opção; quando aperta K/Esc, então escolhe "Sair". (US4, RF9)
- CA-08: Dado o Mercador ou a Estalajadeira, quando o jogador escolhe Comprar, Vender ou Descansar, então recebe uma fala avisando que o serviço chega em breve, sem erro. (RF11)
- CA-09: Dada a flag `bosque` ativa (chefe derrotado), quando o jogador conversa com qualquer NPC da vila, então ouve pelo menos uma fala diferente da versão anterior. (US6, RF10)
- CA-10: Dado o Velho Agricultor ou o Jovem Aprendiz, quando o jogador conversa com eles, então recebe pelo menos uma dica sobre a floresta, a caverna ou o cristal de save. (US5, RF11)
- CA-11: Dado qualquer diálogo, quando exibido, então nenhuma linha passa da borda da caixa e há no máximo 3 linhas por vez. (RF6)
- CA-12: Dado o mapa da vila, quando os testes automáticos rodam, então todo NPC tem sprite válido, está em chão andável e não bloqueia o caminho até as saídas e o cristal. (RF1, RF4)

## Experiência do jogador

- **Controles:** **E** conversa (o mesmo do cristal); **J/Enter** avança ou confirma; **setas/WASD** escolhem; **K/Esc** escolhe "Sair". Nenhuma tecla nova. Enquanto o diálogo está aberto, Enter/Esc **não** abrem o menu.
- **Telas e layout (480x270):** caixa azul de ~460 x 64 px na parte de baixo, sobre o HUD. Nome do NPC numa aba pequena no canto superior esquerdo da caixa. Texto de 8 px, até 3 linhas. Seta piscando no canto inferior direito quando há mais. Escolhas numa janela menor acima da caixa, à direita, com o cursor amarelo do jogo.

```text
                                        +--------------+
                                        | > Comprar    |
                                        |   Vender     |
 +-[ Mercador ]-------------------------|   Sair       |
 | Bem-vindo! Tenho de tudo um pouco    +--------------+
 | para quem vai encarar a floresta.             |
 |                                            v  |
 +-----------------------------------------------+
```

- **Feedback:** aviso "E: Falar" acima do NPC quando ao alcance (como o "E: Salvar" do cristal); texto letra a letra (~40 letras por segundo); NPC vira para o grupo.
- **Persistência:** nada novo vai para o save. O que muda conforme o progresso usa as flags que já são salvas.

## Balanceamento

| Item | Valor inicial | Justificativa |
| :--- | :--- | :--- |
| Velocidade do texto | ~40 letras/s | Leitura confortável sem parecer lenta; J completa na hora |
| Alcance para conversar | ~28 px (mesmo do cristal) | Coerência com a interação existente |
| Velocidade de passeio | ~25 px/s (menos que os heróis) | Parece um passeio, não uma fuga |
| Área de passeio | raio de ~2–3 blocos | Mantém o NPC perto do seu "lugar" |
| Pausa entre passeios | 1,5–4 s | Movimento natural |

## Recursos externos

| ID | Recurso | Necessário para | Placeholder enquanto isso | Situação |
| :--- | :--- | :--- | :--- | :--- |
| REC-01 | Sprites dos 4 NPCs da fazenda | CA-01 | — | **Entregue** (folha `npcs`) |
| REC-02 | Retratos dos NPCs na caixa de diálogo | Opcional (fora do escopo) | Só o nome | Não solicitado |

Nenhum recurso pendente bloqueia esta entrega.

## Restrições de alto nível

- Roda no navegador, sem build e sem dependências (ver `AGENTS.md`).
- Saves existentes continuam válidos: nada muda no formato do save.
- Personagens e falas 100% originais.
- Texto no canvas sem acentos (fonte do sistema), como no resto do jogo.
- A base (NPCs, diálogo, escolhas, falas por flag) precisa servir aos NPCs medievais e futuristas sem retrabalho.

## Fora do escopo

- Loja e estalagem funcionando (prompt 4); aqui as opções só respondem "em breve".
- Missões com objetivos rastreados.
- Retratos dos NPCs na caixa de diálogo.
- NPCs nas aventuras 2 e 3 (entram junto com cada aventura).
- Sons de diálogo (prompt 9).
- Heróis respondendo nas conversas.

## Dependências

- Fases 1 e 2 concluídas (mapas, modos do `Game`, cristal com a tecla E, flag `bosque`).
- Sprites dos NPCs integrados (folha `npcs`): concluído.
