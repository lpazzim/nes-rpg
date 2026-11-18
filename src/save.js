// =====================================================================
// SAVE: 3 espaços guardados no navegador (localStorage)
// =====================================================================
const KEY = 'myrpg.save.';
export const SLOTS = [1, 2, 3];
export const SAVE_VERSION = 1;

export function readSave(slot) {
  try {
    const raw = localStorage.getItem(KEY + slot);
    const data = raw ? JSON.parse(raw) : null;
    return data && data.v === SAVE_VERSION ? data : null;
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
