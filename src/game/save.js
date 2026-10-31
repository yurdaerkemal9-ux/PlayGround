const SAVE_KEY = 'littleGhostCat.save.v1';
const SETTINGS_KEY = 'littleGhostCat.settings.v1';

export const DEFAULT_SETTINGS = {
  music: 0.68,
  sfx: 0.8,
  sensitivity: 1.0,
  cameraDistance: 3.4,
  bloom: true,
  hints: true,
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...(parsed && typeof parsed === 'object' ? parsed : {}) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function storeSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch { /* storage may be unavailable */ }
}

export function hasSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    return !!data && data.version === 1;
  } catch {
    return false;
  }
}

export function readSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.version !== 1) return null;
    return data;
  } catch {
    return null;
  }
}

export function writeSave(data) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch { /* noop */ }
}

export function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m ${s % 60}s`;
}
