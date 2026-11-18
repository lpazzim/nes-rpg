---
name: criar-aventura
description: Monta os mapas de uma aventura da campanha (cidade → exterior → dungeon com andares → arena do chefe) com o MapBuilder, registra-os, liga as saídas, posiciona inimigos e cristais e verifica tudo com testes e no navegador. Use quando uma funcionalidade pedir uma aventura ou mapas novos. Não use para ajustes pontuais num mapa existente (edite o arquivo direto) nem para integrar arte de personagens (integrar-sprites).
argument-hint: --aventura N --tema nome
---

Leia antes: `.agents/rules/maps-and-adventures.md` (estrutura, blocos, MapBuilder, dungeons, flags) e `src/maps/adventure1.js` como exemplo completo.

## Fluxo

1. **Planejar** — preencha `./references/TEMPLATE_AVENTURA.md` (pode ficar na seção de design da TechSpec ou em `tasks/prd-[slug]/aventura.md`): tema, ids dos mapas, grafo de saídas/entradas, inimigos por mapa, chefe e flag, cristais, blocos e objetos necessários, arte pendente (`REC-*`). Mostre o grafo ao usuário em texto simples.
   **Conclua quando:** o usuário aprovar o plano.

2. **Preparar a arte do tema** — se o tema precisar de blocos ou objetos novos, implemente-os em `src/map/art.js` (e colisão em `world.js`, `WALKABLE` no teste) seguindo a paleta e a técnica existentes (`PixelBuf`, `hash`/`smooth`, contorno escuro). Se o tema de dungeon for novo, adicione-o a `FLOOR`/`WALL`/`DECOR` em `dungeon.js`. Inimigos ou chefe novos passam por `/integrar-sprites`.
   **Conclua quando:** cada bloco/objeto do plano existir.

3. **Montar os mapas** — crie `src/maps/adventureN.js` com uma função `buildX()` por mapa, na ordem recomendada da rule (regiões → água → estradas → construções com `reserve` → árvores → decoração → zonas → entradas/saídas). Dungeons via `buildDungeon` com sementes novas. A arena tem `sealedByBoss` e o portal `requires: '<flag>'`.
   **Conclua quando:** todos os mapas do plano existirem.

4. **Registrar** — adicione os mapas a `MAPS` (`name`, `adventure`), marque a aventura como `ready` em `ADVENTURES` e ligue a cidade da aventura anterior (ou do ponto de partida combinado) à nova, se o PRD pedir. Documente a flag nova em `maps-and-adventures.md#6`.
   **Conclua quando:** `npm test` passar (saídas, entradas, alcance, determinismo).

5. **Percorrer no navegador** — para cada mapa: `game.enterMap(id, entrada)`, captura ampliada, densidade de árvores/inimigos, passagens bloqueadas por objetos (o teste não as vê), escuridão em dungeons, cristais funcionando. Percorra a cadeia inteira de saídas até o chefe e de volta pelo portal; derrote o chefe pelo console e confirme a flag e o portal.
   **Conclua quando:** a cadeia completa funcionar sem erros no console.

6. **Documentar** — `README.md` (campanha), `AGENTS.md` (estado/roteiro), `CHANGELOG.md`, `prompts/README.md`.
