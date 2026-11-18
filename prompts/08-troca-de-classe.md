# Prompt 8 — Troca de classe

Uso: `/criar-prd --arquivo prompts/08-troca-de-classe.md` (slug: `troca-de-classe`)
Pré-requisito: `aventura-2-reino-de-pedra` concluída.

## Contexto

Uma marca dos RPGs de ação da era SNES que inspiram o projeto: ao atingir certos níveis, cada herói escolhe entre dois caminhos de classe, um "luz" e um "sombra", que mudam atributos e golpes.

## O que queremos

- Primeira troca no nível 10 e segunda no nível 25 (valores a confirmar no PRD).
- Em cada troca, duas opções por herói, com descrição e prévia dos atributos.
- Cada classe muda multiplicadores de atributos e melhora ou troca **um** golpe (ex.: Kaito "Mestre da Lâmina" → Iaido com 2 cortes; "Ronin Sombrio" → Corte Pesado que rouba vida).
- A troca acontece num local especial (ex.: um altar em cada cidade), com uma animação de luz.
- Classe mostrada no menu de Status; persistida no save.

## Objetivos

- Toda classe tem um efeito perceptível em combate.
- Regras de atributos por classe cobertas por testes de unidade.

## Fora do escopo

- Novos sprites por classe (as cores podem mudar via paleta, se for simples).

## Arte

- Opcional: quadros extras de golpe por classe.
