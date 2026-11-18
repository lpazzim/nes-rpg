# TechSpec — [Nome da funcionalidade]

PRD: `tasks/prd-[slug]/prd.md`

## Resumo

[Um ou dois parágrafos: abordagem técnica e principais decisões.]

## Arquitetura

### Módulos novos e alterados

| Arquivo | Novo/Alterado | Responsabilidade | Depende de |
| :--- | :--- | :--- | :--- |
| `src/[arquivo].js` | Novo | [...] | `data.js`, `ui/ui.js` |

[Confirme que a direção de dependências de `.agents/rules/folder-structure.md#5` é respeitada; nenhum módulo novo importa `game.js`.]

### Fluxo

[Como os dados e o controle passam entre os módulos: tecla → modo do Game → tela → efeito no estado → save.]

## Contratos de dados

[Para cada tabela, estrutura ou mudança de estado: uma subseção com tabela de campos e exemplo.]

### `[NOME_DA_TABELA]` — [descrição]

| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `[campo]` | `[tipo]` | sim/não | [...] |

```javascript
export const EXEMPLO = { id: { name: 'Nome', price: 30 } };
```

### Estado da campanha e save

| Campo novo | Onde vive | Vai para o save? | Valor no novo jogo |
| :--- | :--- | :--- | :--- |
| `[campo]` | `game.[campo]` | sim | `[valor]` |

- `SAVE_VERSION`: [mantém / passa para N, com migração ou aviso]

## Integração com o jogo

- **Modos:** [modo novo? quem abre/fecha; teclas]
- **Update/Render:** [o que roda por quadro e onde é desenhado na ordem de `game-architecture.md#7`]
- **Entidades/combate:** [mudanças em heróis, inimigos, hitboxes, `damage`]
- **Mapas:** [mapas, objetos, interações novas]

## Interface

[Layout em 480x270 (posições aproximadas das janelas), textos, cursor e navegação. Componentes de `ui/ui.js` reutilizados.]

## Conteúdo e arte

| Item | Origem | Placeholder | Pipeline |
| :--- | :--- | :--- | :--- |
| [ex.: mercador] | REC-01 | [sprite genérico] | `/integrar-sprites` |

## Abordagem de testes

### Testes de unidade

| ID | Caso | CA | Resultado esperado |
| :--- | :--- | :--- | :--- |
| TU-01 | [nome] | CA-01 | [...] |

### Testes de integração de conteúdo

| ID | Caso | CA | Resultado esperado |
| :--- | :--- | :--- | :--- |
| TI-01 | [nome] | CA-02 | [...] |

### Testes ponta a ponta (navegador)

| ID | Fluxo | CA | Resultado esperado |
| :--- | :--- | :--- | :--- |
| E2E-01 | [passos no jogo] | CA-01 | [estado em `window.game` e o que se vê] |

## Sequenciamento

1. [Primeiro: dados e lógica pura com testes (por quê)]
2. [Depois: integração no Game]
3. [Depois: interface]
4. [Por fim: conteúdo nos mapas e verificação]

## Riscos

| Risco | Mitigação |
| :--- | :--- |
| [ex.: saves antigos] | [migração em `readSave`] |

## Principais decisões

| Decisão | Motivo | Alternativa descartada |
| :--- | :--- | :--- |
| [...] | [...] | [...] |

## Conformidade

- **AGENTS.md e rules:** [confirme a leitura de todas as rules e cite as relevantes]
- **Skills aplicáveis:** [ex.: `/integrar-sprites` para REC-01]

## Arquivos relevantes

- [Lista de arquivos lidos, criados e alterados]
