# Prompt 6 — Aventura 2: Reino de Pedra

Uso: `/criar-prd --arquivo prompts/06-aventura-2-reino-de-pedra.md` (slug: `aventura-2-reino-de-pedra`)
Pré-requisito: `equipamentos` concluído. Skills: `/criar-aventura`, `/integrar-sprites`.

## Contexto

Depois do Bosque Ancião, o grupo segue para um reino medieval. A arte de cidade murada (calçamento, muralhas, casas de telhado laranja, chafariz, feira) e o inimigo **Cavaleiro** já existem, guardados para esta aventura.

## O que queremos

- Roteiro padrão: **Cidade do Reino** (segura, com loja/estalagem/NPCs) → **Estrada do Reino** (exterior) → **Masmorras do Castelo** (2–3 andares, tema `castle`) → **Salão do Trono** (chefe).
- Ligação com a aventura 1: o portal de volta do Bosque (ou uma estrada da vila) leva ao Reino depois que a flag `bosque` estiver ativa.
- Inimigos: Cavaleiro (bloqueia de frente) e mais 1–2 tipos medievais, se houver arte.
- Chefe medieval com 2–3 ataques e uma mecânica clara (ex.: escudo que só cai depois de uma investida).
- Flag `reino` ao vencer; portal de volta à cidade do Reino.
- Loja da cidade com estoque e equipamentos melhores.

## Objetivos

- A aventura inteira (cidade → chefe) leva 20–30 minutos para um grupo no nível esperado.
- Todos os mapas passam nos testes de integridade.

## Arte

- REC: chefe medieval (folha completa: parado, andar, 2–3 ataques, dano, morte).
- REC: NPCs medievais (mercador, guarda, moradores).
- Opcional: inimigos medievais extras.
- Placeholder do chefe: Cavaleiro com `scale: 2`.
