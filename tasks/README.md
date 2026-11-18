# Artefatos das funcionalidades

Cada funcionalidade tem uma pasta `prd-<slug>/` criada pelo fluxo de skills (ver `prompts/README.md`):

| Arquivo | Criado por | Conteúdo |
| :--- | :--- | :--- |
| `prd.md` | `/criar-prd` | Requisitos, critérios de aceitação (`CA-*`), recursos externos (`REC-*`) |
| `techspec.md` | `/criar-techspec` | Módulos, contratos, integração, casos de teste (`TU-*`, `TI-*`, `E2E-*`) |
| `tasks.md` | `/criar-tasks` | Lista de tarefas com dependências e situação |
| `task_N.md` | `/criar-tasks` | Detalhe de cada tarefa (subtarefas, testes, arquivos) |
| `aventura.md` | `/criar-aventura` (opcional) | Plano de mapas de uma aventura |
| `codereview.md` | `/executar-review` | Conformidade, problemas e veredito |
| `qa.md` | `/executar-qa` | Critérios verificados, bugs e conclusão |
| `evidences/` | `/executar-qa` | Capturas de tela, quando der para salvar |

Não apague a pasta de uma funcionalidade concluída: ela documenta as decisões tomadas.
