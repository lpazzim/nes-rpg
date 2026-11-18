# Prompt 4 — Loja e estalagem

Uso: `/criar-prd --arquivo prompts/04-loja-e-estalagem.md` (slug: `loja-e-estalagem`)
Pré-requisito: `npcs-e-dialogos` concluído.

## Contexto

O jogador já ganha ouro dos inimigos, mas não tem onde gastar. Esta funcionalidade cria o **sistema de compra e venda** e a **estalagem**, usando os NPCs e o diálogo com escolhas.

## O que queremos

- **Loja** (mercador): escolha Comprar / Vender / Sair.
  - Comprar: lista de itens com preço e quantidade na bolsa, descrição, quantidade a comprar (setas), confirmação e aviso de ouro insuficiente.
  - Vender: itens da bolsa pela metade do preço.
  - Estoque definido por loja (cada cidade terá a sua); a vila vende Poção, Poção Forte, Éter e Pena de Fênix.
- **Estalagem** (estalajadeiro): descansar por um preço (ex.: 20 G) recupera HP/MP e revive todos, com a tela escurecendo e clareando.
- Ouro sempre visível nas telas de compra.
- Tudo persiste no save (ouro e bolsa já persistem).

## Objetivos

- Comprar 3 poções a partir da vila em menos de 30 segundos.
- Impossível ficar com ouro negativo ou quantidades inválidas (testes de unidade).
- Saves antigos continuam funcionando.

## Fora do escopo

- Equipamentos à venda (prompt 5).
- Preços que variam com o progresso.

## Arte

- Opcional: ícones de itens 16x16 (folha em grade). Sem eles, a lista usa só texto e cores.
