# Tarefa 6.0: Verificação final e documentação

## Visão geral

Fecha a entrega: mede o objetivo de 1 minuto, faz o ajuste fino jogando e atualiza a documentação para o dono do projeto (como equipar, o que cada peça faz e o aviso sobre a conversão do save).

<rules>
### Conformidade com o AGENTS.md e as rules

- `AGENTS.md#8` (definição de pronto): `npm test` verde, preview sem erros no console, fluxo jogado, documentação atualizada, viewport normal e servidores encerrados.
- `AGENTS.md#8` item 4: o formato do save mudou, então `SAVE_VERSION` incrementado **e a migração documentada**.
- `documentation.md`: `CHANGELOG.md` sempre; `README.md` porque mudou algo visível; `AGENTS.md` e rules porque mudaram arquitetura e padrões.
- Memória do projeto: aba separada, Novo Jogo, nunca gravar sobre o espaço 1.
</rules>

<skills>
### Skills aplicáveis

Nenhuma.
</skills>

<requirements>
- Objetivos do PRD (1 minuto, atributos conferem com o combate, console limpo)
</requirements>

## Subtarefas

- [x] 6.1 E2E-13: cronometrar comprar a arma na loja e equipá-la pelo menu.
- [x] 6.2 Conferir que os atributos mostrados no Status batem com o dano aplicado no combate (objetivo do PRD).
- [x] 6.3 Ajuste fino jogando: legibilidade da comparação a 480x270, nomes que não cabem, cores; corrigir o que aparecer.
- [x] 6.4 Atualizar `README.md` (equipar, peças, o que muda para o jogador), `AGENTS.md` (fase 5 no roteiro e arquitetura), `.agents/rules/` (`folder-structure.md`, `game-architecture.md`, `tests.md`), `CHANGELOG.md` (com o aviso de que saves antigos são convertidos) e `prompts/README.md`.
- [x] 6.5 Rodar `npm test`, recarregar o preview, ler o console, voltar o viewport ao normal e remover overlays.

## Detalhes de implementação

Ver `techspec.md` → "Abordagem de testes" (E2E-13) e "Sequenciamento" (item 6).

## Critérios de aceitação relacionados

- CA-16 (e reconferência geral de CA-01 a CA-15)

## Testes da tarefa

### Unidade
- Nenhum novo.

### Integração de conteúdo
- [x] Suíte inteira verde no fechamento

### Ponta a ponta (navegador)
- [x] E2E-13 — comprar e equipar em menos de 1 minuto

## Arquivos relevantes

- `README.md`, `AGENTS.md`, `CHANGELOG.md`, `prompts/README.md`, `.agents/rules/*.md`
- Arquivos tocados nas tarefas 1.0 a 5.0 (se o ajuste fino pedir)
