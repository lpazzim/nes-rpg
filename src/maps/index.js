// =====================================================================
// REGISTRO DE MAPAS E AVENTURAS
// Para criar um mapa novo: escreva a função que o constrói (veja
// adventure1.js) e registre aqui com um nome.
// =====================================================================
import { buildVila, buildFloresta, buildBosque1, buildBosque2, buildBosqueBoss } from './adventure1.js';

export const MAPS = {
  vila:        { name: 'Vila de Pradaria',          adventure: 1, build: buildVila },
  floresta:    { name: 'Floresta Sussurrante',      adventure: 1, build: buildFloresta },
  bosque1:     { name: 'Raizes do Bosque - 1o andar', adventure: 1, build: buildBosque1 },
  bosque2:     { name: 'Raizes do Bosque - 2o andar', adventure: 1, build: buildBosque2 },
  bosque_boss: { name: 'Coracao do Bosque',         adventure: 1, build: buildBosqueBoss },
};

export const NEW_GAME = { map: 'vila', entry: 'inicio' };

export const ADVENTURES = [
  { id: 1, name: 'O Bosque Anciao', boss: 'bosque', ready: true },
  { id: 2, name: 'Reino de Pedra', boss: 'reino', ready: false },
  { id: 3, name: 'Neon', boss: 'neon', ready: false },
];
