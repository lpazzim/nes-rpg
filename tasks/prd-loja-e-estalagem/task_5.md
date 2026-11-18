# Tarefa 5.0: Verificação final jogando e documentação

## Visão geral

Fecha a entrega: confere que compras sobrevivem ao save, mede o objetivo dos 30 segundos, faz um ajuste fino jogando e atualiza a documentação para o dono do projeto (como comprar e descansar).

<rules>
### Conformidade com o AGENTS.md e as rules

- `AGENTS.md#8` (definição de pronto): `npm test` verde, preview sem erros no console, fluxo jogado, documentação atualizada, viewport normal e servidores temporários encerrados.
- `game-architecture.md#8`: save inalterado, `SAVE_VERSION` continua 1.
- `tests.md#4`: verificação no navegador e checklist de QA.
- `documentation.md`: `CHANGELOG.md` sempre; `README.md` porque mudou algo visível ao jogador; `AGENTS.md` (fase 4 e dívida técnica); `prompts/README.md`.
- Memória do projeto: testes em aba separada com Novo Jogo; nunca gravar sobre o espaço 1.
</rules>

<skills>
### Skills aplicáveis

Nenhuma.
</skills>

<requirements>
- RF3.2 e os objetivos do PRD (30 s, saves antigos, console limpo)
</requirements>

## Subtarefas

- [x] 5.1 E2E-07: comprar, salvar num cristal em espaço livre (2 ou 3), recarregar, Continuar; conferir ouro e bolsa. Confirmar que um save anterior também carrega.
- [x] 5.2 E2E-08: cronometrar a compra de 3 Poções a partir do Mercador.
- [x] 5.3 Ajuste fino jogando (legibilidade a 480x270, textos das falas, cores dos itens em cinza); corrigir o que aparecer.
- [x] 5.4 Atualizar `README.md` (loja e estalagem na vila, controles), `AGENTS.md` (fase 4 no roteiro; dívida técnica do `game.js` resolvida), `CHANGELOG.md` (entrada da entrega) e `prompts/README.md`.
- [x] 5.5 Rodar `npm test`, recarregar o preview, ler o console, voltar o viewport ao normal e remover overlays.

## Detalhes de implementação

Ver `techspec.md` → "Abordagem de testes" (E2E-07 e E2E-08) e "Sequenciamento" (item 5).

## Critérios de aceitação relacionados

- CA-13, CA-15 (e reconferência geral de CA-01 a CA-12)

## Testes da tarefa

### Unidade
- Nenhum novo.

### Integração de conteúdo
- [x] TI-01 — suíte inteira verde no fechamento

### Ponta a ponta (navegador)
- [x] E2E-07 — compra persiste no save; save anterior carrega
- [x] E2E-08 — 3 Poções em menos de 30 s

## Arquivos relevantes

- `README.md`, `AGENTS.md`, `CHANGELOG.md`, `prompts/README.md`
- Arquivos tocados nas tarefas 1.0 a 4.0 (se o ajuste fino pedir)
