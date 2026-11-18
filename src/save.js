// =====================================================================
// SAVE: 3 espaços guardados no navegador (localStorage)
// =====================================================================
import { STARTER } from './equipment.js';

const KEY = 'myrpg.save.';
export const SLOTS = [1, 2, 3];
export const SAVE_VERSION = 2;   // 2: heroi guarda base* + equipamento (antes: atributos somados)

// Converte um save antigo para o formato atual. Pura (sem localStorage) para
// poder ser testada no Node. Versao desconhecida continua sendo ignorada.
// v1 -> v2: os atributos do v1 nunca tiveram equipamento, entao viram a base
// direto; as armas iniciais nao dao bonus, logo a forca fica identica.
export function migrateSave(data) {
  if (!data || typeof data !== 'object') return null;
  if (data.v === SAVE_VERSION) return data;
  if (data.v !== 1) return null;
  return { ...data, v: SAVE_VERSION, heroes: (data.heroes || []).map(migrateHeroV1) };
}

function migrateHeroV1(h) {
  const { atk, defense, speed, crit, maxMp, ...rest } = h;
  return {
    ...rest,
    baseAtk: atk, baseDefense: defense, baseSpeed: speed, baseCrit: crit, baseMaxMp: maxMp,
    equip: { weapon: STARTER[h.id] ?? null, armor: null, accessory: null },
  };
}

export function readSave(slot) {
  try {
    const raw = localStorage.getItem(KEY + slot);
    const data = raw ? JSON.parse(raw) : null;
    return migrateSave(data);   // saves antigos sao convertidos ao carregar
  } catch { return null; }
}

export function writeSave(slot, data) {
  try { localStorage.setItem(KEY + slot, JSON.stringify({ ...data, v: SAVE_VERSION, savedAt: Date.now() })); return true; }
  catch { return false; }
}

export function listSaves() { return SLOTS.map((slot) => ({ slot, data: readSave(slot) })); }

export function latestSave() {
  return listSaves().filter((s) => s.data).sort((a, b) => b.data.savedAt - a.data.savedAt)[0] || null;
}

export function formatTime(sec) {
  const s = Math.floor(sec), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
