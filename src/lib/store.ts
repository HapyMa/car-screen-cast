import AsyncStorage from '@react-native-async-storage/async-storage';

// ===================== 类型定义 =====================

export interface CastSettings {
  displayId: number;
  displayName: string;
  appPackage: string;
  appName: string;
  widthPx: number;
  heightPx: number;
  aspectRatio: string; // '16:9' | '4:3' | '自定义'
  quality: 'smooth' | 'sd' | 'hd' | 'fhd';
  codec: 'H.264' | 'H.265';
  bitrateMbps: number;
  delayMs: number;
  rotation: 0 | 90 | 180 | 270;
  mirrorH: boolean;
  mirrorV: boolean;
  audioRoute: 'main' | 'display' | 'both';
}

export interface HistoryRecord {
  id: string;
  timestamp: number;
  settings: CastSettings;
  durationSec: number;
}

export interface PresetScheme {
  id: string;
  name: string;
  settings: CastSettings;
  createdAt: number;
}

// ===================== 默认投屏参数 =====================

export const DEFAULT_CAST_SETTINGS: Omit<CastSettings, 'displayId' | 'displayName' | 'appPackage' | 'appName'> = {
  widthPx: 1920,
  heightPx: 1080,
  aspectRatio: '16:9',
  quality: 'hd',
  codec: 'H.265',
  bitrateMbps: 8,
  delayMs: 100,
  rotation: 0,
  mirrorH: false,
  mirrorV: false,
  audioRoute: 'display',
};

// ===================== 历史记录 =====================

const HISTORY_KEY = '@car_cast_history';
const MAX_HISTORY = 100;

export async function loadHistory(): Promise<HistoryRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveHistory(record: HistoryRecord): Promise<void> {
  try {
    const list = await loadHistory();
    const updated = [record, ...list].slice(0, MAX_HISTORY);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch { /* ignore */ }
}

export async function deleteHistory(id: string): Promise<HistoryRecord[]> {
  const list = await loadHistory();
  const updated = list.filter(r => r.id !== id);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return updated;
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}

// ===================== 预设方案 =====================

const PRESETS_KEY = '@car_cast_presets';

export async function loadPresets(): Promise<PresetScheme[]> {
  try {
    const raw = await AsyncStorage.getItem(PRESETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function savePreset(preset: PresetScheme): Promise<void> {
  const list = await loadPresets();
  const updated = [...list, preset];
  await AsyncStorage.setItem(PRESETS_KEY, JSON.stringify(updated));
}

export async function deletePreset(id: string): Promise<PresetScheme[]> {
  const list = await loadPresets();
  const updated = list.filter(p => p.id !== id);
  await AsyncStorage.setItem(PRESETS_KEY, JSON.stringify(updated));
  return updated;
}

// ===================== 辅助函数 =====================

export function qualityLabel(q: CastSettings['quality']): string {
  const map = { smooth: '流畅', sd: '标清', hd: '高清', fhd: '超清' };
  return map[q];
}

export function audioRouteLabel(r: CastSettings['audioRoute']): string {
  const map = { main: '主屏扬声器', display: '投屏扬声器', both: '同时输出' };
  return map[r];
}

export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}分${s.toString().padStart(2, '0')}秒`;
}
