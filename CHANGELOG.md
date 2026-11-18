# Changelog

Histórico de entregas do projeto, da mais recente para a mais antiga.
Formato: uma seção por entrega com **Adicionado**, **Alterado**, **Corrigido** e **Removido** (só as que existirem).
Quando a entrega vier de um PRD, cite o slug: `tasks/prd-<slug>/`.

## [Loja e estalagem] — 2026-11-17

PRD: `tasks/prd-loja-e-estalagem/` · Revisão: APROVADO · QA: APROVADO (15/15 critérios)

### Adicionado
- Loja do Mercador: **Comprar** (lista com preço, quanto você já tem, descrição, quantidade com total e avisos de "Ouro insuficiente" e "Bolsa cheia") e **Vender** (metade do preço). Ouro sempre visível. Limite de 99 por item.
- Estalagem: a Estalajadeira cobra 20 G, a tela escurece e clareia e o grupo recupera HP e MP (quem estava caído revive). Avisa quando falta ouro ou quando o grupo já está descansado.
- Lojas e estalagens são tabelas por NPC em `src/items.js` (`SHOPS`, `INNS`): uma cidade nova só precisa de uma linha de dados.
- Testes de regras de compra, venda e descanso, de conteúdo das lojas e de tamanho de arquivo (78 no total).

### Alterado
- `src/game.js` dividido: combate em `src/combat-system.js` e interação (conversas, loja, estalagem) em `src/interaction.js`. Sem mudança para o jogador; o arquivo caiu de ~500 para ~320 linhas.
- O fade passou a aceitar duração e ações no meio e no fim (`game.startTransition`).
- Poções do chão respeitam o limite de 99 da bolsa.

### Corrigido
- Carregar um save com o jogo já em andamento (por exemplo, pelo Game Over) podia gerar um erro ao desenhar os heróis antes de entrarem no mapa.

## [NPCs e diálogos] — 2026-11-17

PRD: `tasks/prd-npcs-e-dialogos/` · Revisão: APROVADO · QA: APROVADO (12/12 critérios)

### Adicionado
- Moradores na Vila de Pradaria: Mercador (barraca vermelha), Estalajadeira (estalagem), Velho Agricultor e Jovem Aprendiz (passeiam). O grupo não os atravessa.
- Conversas com a tecla **E**: caixa azul estilo SNES com nome, texto letra a letra, páginas de até 3 linhas, escolhas (setas + J; K/Esc = Sair) e falas que mudam depois de derrotar o Treant Ancião.
- Falas editáveis em `src/dialogues.js`; Comprar/Vender/Descansar avisam que a loja e a estalagem chegam em breve.
- Testes de conversa, de NPC e de integridade (falas sem acentos, NPCs sem bloquear caminhos): 56 no total.

### Alterado
- A tecla **E** passa a escolher o alvo mais próximo entre cristal e NPC.

## [Sprites dos NPCs] — 2026-11-17

### Adicionado
- 12 NPCs integrados (folha `assets/source/npcs_sheet.webp`): fazenda (mercador, estalajadeira, velho agricultor, aprendiz), medieval (alquimista, estalajadeiro, soldado de patrulha, dama da corte) e futurista (negociante, bartender, cientista, soldado corporativo). Animações `<npc>.idle_*`/`walk_*` na folha `npcs`.
- Opção `dropAbove` no pipeline de sprites, que descarta títulos escritos acima dos personagens na folha.
- Teste que garante as 6 animações de movimento de cada NPC.

## [Harness de desenvolvimento] — 2026-11-17

### Adicionado
- `AGENTS.md` (fonte da verdade para agentes) e `CLAUDE.md` apontando para ele.
- Regras em `.agents/rules/`: padrões de código, JavaScript, pastas, arquitetura do jogo, mapas e aventuras, pixel art, testes e documentação.
- Skills em `.agents/skills/`: fluxo PRD → TechSpec → Tasks → Executar → Review → QA, mais `integrar-sprites` e `criar-aventura`.
- Roteiro das próximas fases em `prompts/` e pasta `tasks/` para os artefatos de cada funcionalidade.
- Testes automáticos com `node:test` (`npm test`): integridade dos mapas, das animações, dos itens e regras de combate.
- `npm run skills:sync` para copiar as skills para `.claude/skills`.

### Alterado
- `src/package.json` marca o código do jogo como ES modules (permite testá-lo no Node).

## [Fase 2 — Título, save e menu] — 2026-11-17

### Adicionado
- Tela título (Novo jogo / Continuar), 3 espaços de save no navegador e cristais de save que curam o grupo.
- Menu com abas Status (retrato, atributos, golpes) e Itens (Poção, Poção Forte, Éter, Pena de Fênix).
- Ouro e drops de poção; Game Over com "carregar último save".

## [Fase 1 — Troca de mapas e Aventura 1] — 2026-11-17

### Adicionado
- Sistema de mapas com saídas, entradas e fade; cache de mapas montados.
- Aventura 1: Vila de Pradaria, Floresta Sussurrante, Raízes do Bosque (2 andares gerados) e Coração do Bosque (Treant Ancião).
- Arte de caverna (chão, paredes com raízes, escadas, porta do chefe, cogumelos) e escuridão nas dungeons.

### Removido
- Mapa único com todos os temas (cidade murada e fenda ficam para as aventuras 2 e 3).

## [Sprites animados e mapa SNES] — 2026-11-17

### Adicionado
- Pipeline de sprites (`npm run sprites`) com detecção automática de quadros, animações por herói/inimigo.
- Inimigos Espantalho, Treant, Cavaleiro, Soldado cibernético e o chefe Treant Ancião.
- Arte do mapa pintada por código (grama, rio, ponte, campos, cidade, fenda cibernética).

## [Protótipo] — 2026-11-17

### Adicionado
- Protótipo jogável: 3 heróis (katana, adagas, poderes), IA dos aliados, barra de PODER, XP e HUD.
