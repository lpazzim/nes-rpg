# Prompt 5 — Equipamentos

Uso: `/criar-prd --arquivo prompts/05-equipamentos.md` (slug: `equipamentos`)
Pré-requisito: `loja-e-estalagem` concluído.

## Contexto

A aba **Equip.** do menu existe, mas está vazia. Esta funcionalidade adiciona **arma, armadura e acessório** por herói, com efeito nos atributos, à venda nas lojas e como recompensa de chefes.

## O que queremos

- Três espaços por herói: arma (só do estilo do herói: katana, adagas ou catalisador), armadura, acessório.
- Cada peça altera atributos (ataque, defesa, velocidade, crítico, MP máximo) e pode ter um efeito simples (ex.: +10% de PODER por golpe).
- Na aba Equip.: escolher o espaço, ver as peças compatíveis da bolsa e a **comparação** dos atributos antes de confirmar (verde melhora, vermelho piora).
- Lojas vendem equipamentos; o Treant Ancião deixa uma peça especial.
- Atributos mostrados no Status já somam o equipamento.
- Persistência no save (incrementar `SAVE_VERSION` com migração dos saves existentes).

## Objetivos

- Trocar a arma de um herói pela loja e pelo menu em menos de 1 minuto.
- Cálculo de atributos coberto por testes de unidade (base + nível + equipamento).

## Fora do escopo

- Aparência dos sprites mudando com o equipamento.
- Melhoria/forja de equipamentos.

## Arte

- Opcional: ícones 16x16 de armas e armaduras.
