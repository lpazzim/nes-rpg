# Tarefa 3.0: Save versão 2 com conversão do save antigo

## Visão geral

Guarda o equipamento no save e converte os saves antigos. É a tarefa de maior risco da entrega: o dono do projeto tem uma campanha em andamento (nível 6) e o jogo hoje **ignora** saves de versão diferente, o que faria a campanha sumir da tela título. O resultado se confere com testes da conversão e carregando um save antigo fabricado num espaço livre.

<rules>
### Conformidade com o AGENTS.md e as rules

- `game-architecture.md#8`: campo novo no estado entra em `newGame`, `saveGame` e `loadGame`; ao mudar o formato de forma incompatível, incrementar `SAVE_VERSION` **e escrever a migração em `readSave` antes**, porque há progresso em andamento — é exatamente o caso previsto pela regra.
- `javascript.md#2`: `migrateSave` é pura, sem `localStorage`, para rodar no Node.
- `code-standards.md#9`: dados vindos de fora continuam validados ao carregar; versão desconhecida continua sendo ignorada.
- Memória do projeto: testes no navegador com Novo Jogo; **nunca** gravar sobre o espaço 1.
- Desvio: nenhum.
</rules>

<skills>
### Skills aplicáveis

Nenhuma.
</skills>

<requirements>
- RF5.1, RF5.2, RF5.3
</requirements>

## Subtarefas

- [x] 3.1 Em `src/heroes.js`: `toSave`/`loadSave` passam a gravar e ler os campos `base*` e `equip`, chamando `recalcEquip()` ao carregar.
- [x] 3.2 Em `src/save.js`: `SAVE_VERSION = 2` e `migrateSave(data)` pura (v1 → v2: renomeia os atributos para `base*` e acrescenta as armas iniciais).
- [x] 3.3 `readSave` passa a devolver `migrateSave(data)`; versão desconhecida continua devolvendo `null`. Nada é reescrito no disco automaticamente.
- [x] 3.4 Conferir `newGame` e `loadGame` no `game.js`: heróis novos nascem com a arma inicial e os carregados recalculam o bônus.
- [x] 3.5 Criar `tests/save.test.mjs` com `TU-11`, `TU-12`, `TU-13` e `TU-15`, usando um save v1 realista (nível 6, com ouro e bolsa).
- [x] 3.6 Rodar `npm test` e os E2E-11 e E2E-12, com um save v1 **fabricado pelo teste** num espaço livre (2 ou 3).

## Detalhes de implementação

Ver `techspec.md` → "Migração de save (v1 → v2)" e "Estado do herói e save". Como as armas iniciais não dão bônus, os atributos do save v1 viram a base diretamente e a força fica idêntica — é o que o `TU-12` prova.

## Critérios de aceitação relacionados

- CA-13, CA-14

## Testes da tarefa

### Unidade
- [x] TU-11 — conversão de um save v1: nível, ouro, bolsa, flags e mapa preservados; atributos viram base
- [x] TU-12 — herói convertido tem os mesmos atributos efetivos do save v1
- [x] TU-13 — versão desconhecida devolve `null`; save já na v2 passa adiante sem mexer
- [x] TU-15 — `toSave`/`loadSave` na v2: equipamento e bases preservados na ida e volta

### Integração de conteúdo
- Nenhum novo.

### Ponta a ponta (navegador)
- [x] E2E-11 — save v1 fabricado num espaço livre → recarregar → Continuar: campanha igual, sem erro no console
- [x] E2E-12 — trocar equipamento (por `window.game`) → salvar no cristal → recarregar → Continuar: mesmas peças e atributos

## Arquivos relevantes

- `src/save.js`, `src/heroes.js`, `src/game.js`
- `tests/save.test.mjs` (novo)
