---
name: integrar-sprites
description: Integra uma folha de sprites nova (herói, inimigo, chefe ou NPC) ao jogo — detecta os quadros, monta as animações no tools/sprites.config.js, gera o atlas, confere a prévia e registra o personagem nos dados. Use quando o usuário enviar arte de personagem ou quando uma tarefa depender de um REC-* de sprite. Não use para arte de mapa (que é pintada por código em src/map/art.js).
argument-hint: --nome nome-curto --arquivo caminho/da/imagem
---

Leia antes: `.agents/rules/pixel-art-assets.md` e `.agents/rules/game-architecture.md#4` (comportamentos e animações exigidas). O guia de leitura das folhas do usuário está em `./references/LEITURA_DA_FOLHA.md`.

## Fluxo

1. **Copiar a arte** — salve a imagem original em `assets/source/<nome>_sheet.<ext>` (minúsculas, sem espaço). Nunca altere o original.
   **Conclua quando:** o arquivo estiver em `assets/source/`.

2. **Detectar os quadros** — registre a folha em `tools/sprites.config.js` (`file` + `anims: {}` vazio) e rode `node tools/detect-frames.js <nome> <scratchpad>/det_<nome>.png`. Abra a prévia numerada. Para cada caixa com 2+ poses, adicione `splits: { id: quantidade }` e rode de novo (os ids mudam depois de uma divisão).
   **Conclua quando:** cada pose tiver exatamente um número.

3. **Mapear as animações** — identifique direção e assunto de cada linha (ver `LEITURA_DA_FOLHA.md`). Na dúvida sobre a direção, recorte e amplie as linhas antes de decidir. Preencha `anims` com `f`, `fps`, `loop` e `hit` (quadro do impacto) para golpes. Garanta as animações obrigatórias do tipo de personagem (tabela abaixo).
   **Conclua quando:** todas as animações obrigatórias estiverem definidas.

4. **Gerar e conferir** — `PREVIEW=<scratchpad> npm run sprites -- <nome>` e abra `anims_<nome>.png`. Confira cada linha: ordem dos quadros, pedaços de vizinhos, furos no corpo, sombra, consistência de roupa entre quadros (quadros de outra cor ficam de fora). Ajuste e repita.
   **Conclua quando:** a prévia estiver limpa.

5. **Registrar no jogo** — herói: `id` igual ao nome da folha em `HEROES`; inimigo/chefe: entrada em `ENEMIES` com `sheet` e todos os atributos (ver `tests/content.test.mjs`); comportamento novo: flag + tratamento em `enemies.js` + `behaviorAnims` no teste + tabela em `game-architecture.md#4`.
   **Conclua quando:** `npm test` passar.

6. **Ver em jogo** — no preview, coloque o personagem numa cena (zona temporária ou `game.enemies.push(...)` pelo console) e confira tamanho, espelhamento, golpes e morte numa captura ampliada. Remova a zona temporária.
   **Conclua quando:** o personagem tiver sido visto em ação sem erros no console.

7. **Documentar** — `CHANGELOG.md`, `README.md` (se for visível ao jogador) e marque o `REC-*` como entregue no PRD/tasks, se houver.

## Animações obrigatórias

| Tipo | Obrigatórias |
| :--- | :--- |
| Herói | `idle_down`, `walk_down`, `idle_up`, `walk_up`, `idle_side`, `walk_side`, `attack`, `skill`, `special`, `hurt`, `death` |
| Inimigo/chefe | `idle`, `walk`, `attack`, `hurt`, `death` + as do comportamento (`ambush`: `hidden`, `emerge`; `blocks`: `block`; `ranged`: `bolt`, `shield`) |
| NPC | `idle_down`, `walk_down`, `idle_up`, `walk_up`, `idle_side`, `walk_side` |
