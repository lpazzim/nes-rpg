# Prompt 9 — Polimento

Uso: `/criar-prd --arquivo prompts/09-polimento.md` (slug: `polimento`)
Pré-requisito: `aventura-3-neon` concluída.

## Contexto

Com a campanha completa, falta acabamento para a experiência parecer a de um jogo lançado.

## O que queremos

- **Minimapa** (tecla M): mapa do lugar atual com o grupo, as saídas e os cristais; nas dungeons, revela só as salas visitadas.
- **Áudio:** música por região (cidade, exterior, dungeon, chefe) e efeitos (golpe, dano, cura, menu, level up), com volume no menu.
- **Fonte bitmap** própria, com acentos.
- **Balanceamento** de toda a campanha: curva de XP, dano e preços, com uma tabela de referência de nível esperado por mapa.
- **Opções:** volume e reatribuição de teclas, salvas no navegador.
- Pagar a dívida técnica listada no `AGENTS.md` (dividir `map/art.js` e `game.js`).

## Objetivos

- O jogo mantém ~60 fps no maior mapa.
- Nenhuma área exige "grind" acima de 15 minutos para avançar.

## Arte e áudio

- REC: músicas (cidade, exterior, dungeon, chefe) e efeitos sonoros, em `.ogg`, originais ou com licença livre informada pelo usuário.
- REC (opcional): fonte bitmap.
