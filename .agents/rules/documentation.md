# Padrão de Documentação

Cada documento tem **um dono e um propósito**. Antes de escrever, veja se a informação já tem lugar; se tiver, atualize-o em vez de duplicar.

---

## 1. Mapa dos documentos

| Documento | Público | Conteúdo | Atualizar quando |
| :--- | :--- | :--- | :--- |
| `README.md` | Dono do projeto / jogador | Como rodar, controles, heróis, campanha, como mexer em sprites e mapas | Mudou algo **visível** ao jogador ou um comando |
| `AGENTS.md` | Agentes de IA | Visão, stack, comandos, arquitetura resumida, fluxo, definição de pronto, dívida técnica | Mudou arquitetura, comando, fluxo ou estado das fases |
| `.agents/rules/*.md` | Agentes | Padrões obrigatórios e contratos | Um padrão foi criado ou alterado |
| `.agents/skills/*/SKILL.md` | Agentes | Fluxos de trabalho repetíveis + templates | O fluxo mudou (rode `npm run skills:sync` depois) |
| `CHANGELOG.md` | Todos | O que foi entregue, por entrega | **Toda** entrega |
| `prompts/NN-<slug>.md` | Agentes | Pedido de uma funcionalidade futura (vira PRD) | Ao planejar ou repriorizar o roteiro |
| `prompts/README.md` | Todos | Ordem e situação das funcionalidades | Uma funcionalidade começou ou terminou |
| `tasks/prd-<slug>/*` | Agentes | PRD, TechSpec, tarefas, review, QA, evidências | Durante o fluxo da funcionalidade |
| Cabeçalho dos módulos | Quem lê o código | O que o módulo faz e como estender | O papel do módulo mudou |

`.claude/skills/` é **gerado**: nunca edite lá.

---

## 2. Idioma e tom

- Português do Brasil, frases curtas, sem jargão desnecessário. O dono do projeto não programa.
- Termos de código entre crases: `game.enterMap`, `npm test`.
- Texto que aparece **no jogo** fica sem acentos (ver [code-standards.md](code-standards.md#1-idioma)); documentação usa acentos normalmente.

---

## 3. Identificadores

| Prefixo | Significado | Onde nasce |
| :--- | :--- | :--- |
| `US1` | História de usuário | PRD |
| `RF1` | Requisito funcional | PRD |
| `CA-01` | Critério de aceitação | PRD |
| `TU-01`, `TI-01`, `E2E-01` | Casos de teste (unidade, integração, ponta a ponta) | TechSpec |
| `1.0`, `1.1` | Tarefa e subtarefa | `tasks.md` / `task_N.md` |
| `BUG-01` | Defeito encontrado | `qa.md` / `codereview.md` |
| `REC-01` | Recurso externo (arte, áudio) pendente | PRD, seção "Recursos externos" |

IDs nunca são reaproveitados dentro de uma funcionalidade.

---

## 4. Nomes e slugs

- Slug de funcionalidade: kebab-case em português, curto: `npcs-e-dialogos`, `loja-e-estalagem`.
- Prompts numerados pela ordem de execução: `03-npcs-e-dialogos.md`.
- Pasta de artefatos: `tasks/prd-<slug>/`.

---

## 5. Formato Markdown

- Um `#` por arquivo (o título); seções com `##`, numeradas nas rules.
- Tabelas para referências (campos, comandos, contratos); listas para passos.
- Blocos de código com a linguagem (`sh`, `javascript`, `text`).
- Links relativos entre documentos: `[tests.md](tests.md)`.
- Sem emojis, exceto ✅/❌ em exemplos de "prefira/evite".

---

## 6. CHANGELOG

```markdown
## [Nome da entrega] — AAAA-MM-DD

### Adicionado
- O que o jogador ou o desenvolvedor ganhou (frase curta). Slug do PRD, se houver.
### Alterado
### Corrigido
### Removido
```

A entrada mais recente fica no topo. Escreva pensando no dono do projeto: o que mudou para ele.
