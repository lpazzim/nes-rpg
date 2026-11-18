# Prompt 3 — NPCs e diálogos

Uso: `/criar-prd --arquivo prompts/03-npcs-e-dialogos.md` (slug: `npcs-e-dialogos`)
Pré-requisito: fases 1 e 2 concluídas.

## Contexto

As cidades estão vazias. Para ter lojas, estalagem e história, a Vila de Pradaria precisa de moradores com quem conversar. Esta funcionalidade cria a base de **NPCs** e **caixas de diálogo** que as próximas (loja, estalagem, aventuras) vão reutilizar.

## O que queremos

- NPCs parados ou passeando numa área pequena, com colisão, desenhados por profundidade como os outros personagens.
- Interagir com a tecla **E** (como o cristal): abre uma caixa de diálogo no estilo SNES na parte de baixo da tela, com o nome do NPC, texto aparecendo letra a letra e avanço com J/Enter.
- Diálogos com várias falas e com **escolhas** simples (ex.: "Comprar / Vender / Sair"), base para a loja e a estalagem.
- Falas que mudam conforme o progresso (flags), por exemplo depois de derrotar o Treant Ancião.
- Vila com 3–5 NPCs: mercador (barraca vermelha), estalajadeiro (perto de uma casa), 2–3 moradores com dicas sobre a floresta e a caverna.

## Objetivos

- O jogador encontra e conversa com todos os NPCs da vila em menos de 2 minutos.
- Nenhum NPC bloqueia passagem ou prende o grupo.
- Textos legíveis a 480x270, com no máximo 3 linhas por caixa.

## Fora do escopo

- Lojas e estalagem funcionando (prompt 4); aqui só as falas e as escolhas.
- Missões (quests) com objetivos rastreados.

## Arte

- REC: folhas de NPC (mercador, estalajadeiro, 2–3 moradores) no formato das folhas atuais: parado e andando de frente, costas e lado.
- Placeholder enquanto a arte não chega: heróis existentes recoloridos ou sprite simples desenhado por código.
