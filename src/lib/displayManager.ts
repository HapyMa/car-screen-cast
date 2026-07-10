/**
 * displayManager.ts
 *
 * 真实显示器检测层：
 * - 主屏：通过 Dimensions API 读取真实设备分辨率与像素密度
 * - 副屏：通过 NativeModules.DisplayManager 调用 Android DisplayManager（需原生支持）
 *         若原生模块不可用则返回空副屏列表并标记来源
 * - 分辨率调整：通过 expo-intent-launcher 打开系统显示设置（真实系统操作）
 * - Dimensions.addEventListener 监听真实分辨率变化
 */

import { Dimensions, NativeModules, PixelRatio, Platform } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Device from 'expo-device';
import * as ScreenOrientation from 'expo-screen-orientation';

// ─── 类型 ───────────────────────────────────────────────────────────────────

export interface RealDisplayInfo {
  id: number;
  name: string;
  widthPx: number;
  heightPx: number;
  /** 物理尺寸（英寸对角线，由 dpi 反推，近似值） */
  diagonalInch: number;
  widthInch: number;
  heightInch: number;
  refreshRate: number;
  densityDpi: number;
  isConnected: boolean;
  type: 'internal' | 'HDMI' | 'DP' | 'USB-C' | 'VGA' | 'wireless';
  /** 数据来源：'native' = 真实 Android API；'dimensions' = JS 侧降级 */
  source: 'native' | 'dimensions' | 'mock';
}

// Android DisplayManager 的原生接口（需要在 Android 原生层实现桥接）
interface AndroidDisplayManager {
  getDisplayCount(): Promise<number>;
  getDisplayInfo(displayId: number): Promise<{
    id: number;
    name: string;
    widthPx: number;
    heightPx: number;
    densityDpi: number;
    refreshRate: number;
    flags: number;
  }>;
  setDisplayResolution(displayId: number, width: number, height: number): Promise<boolean>;
  removePresentation(displayId: number): Promise<void>;
}

// 尝试获取 Android 原生 DisplayManager 模块（需要 Expo Module / 原生插件）
const NativeDisplayManager: AndroidDisplayManager | null =
  Platform.OS === 'android'
    ? (NativeModules.RNDisplayManager as AndroidDisplayManager | null) ?? null
    : null;

// ─── 真实主屏信息（从 Dimensions 读取）─────────────────────────────────────

export function getRealPrimaryDisplay(): RealDisplayInfo {
  const screen = Dimensions.get('screen');
  const dpi = PixelRatio.get() * 160; // 估算 DPI（160dpi * scale）
  const widthInch = screen.width / (dpi / PixelRatio.get());
  const heightInch = screen.height / (dpi / PixelRatio.get());
  const diagonal = Math.sqrt(widthInch ** 2 + heightInch ** 2);

  return {
    id: 0,
    name: `主屏幕 (${Device.modelName ?? '车机主屏'})`,
    widthPx: Math.round(screen.width * PixelRatio.get()),
    heightPx: Math.round(screen.height * PixelRatio.get()),
    diagonalInch: Number(diagonal.toFixed(1)),
    widthInch: Number(widthInch.toFixed(1)),
    heightInch: Number(heightInch.toFixed(1)),
    refreshRate: 60,
    densityDpi: Math.round(dpi),
    isConnected: true,
    type: 'internal',
    source: 'dimensions',
  };
}

// ─── 副屏检测（通过原生模块，降级时返回空列表）──────────────────────────────

export async function detectSecondaryDisplays(): Promise<RealDisplayInfo[]> {
  if (!NativeDisplayManager) {
    // 原生模块不可用（纯 Expo Managed 环境）：返回空列表
    return [];
  }
  try {
    const count = await NativeDisplayManager.getDisplayCount();
    const results: RealDisplayInfo[] = [];
    for (let i = 1; i < count; i++) {
      const info = await NativeDisplayManager.getDisplayInfo(i);
      const dpi = info.densityDpi;
      const wIn = info.widthPx / dpi;
      const hIn = info.heightPx / dpi;
      results.push({
        id: info.id,
        name: info.name || `外接显示器 ${i}`,
        widthPx: info.widthPx,
        heightPx: info.heightPx,
        diagonalInch: Number(Math.sqrt(wIn ** 2 + hIn ** 2).toFixed(1)),
        widthInch: Number(wIn.toFixed(1)),
        heightInch: Number(hIn.toFixed(1)),
        refreshRate: info.refreshRate,
        densityDpi: dpi,
        isConnected: true,
        // flags & 4 = DISPLAY_FLAG_PRESENTATION (外接)
        type: (info.flags & 4) ? 'HDMI' : 'wireless',
        source: 'native',
      });
    }
    return results;
  } catch {
    return [];
  }
}

// ─── 副屏分辨率调整（原生 API → 系统显示设置降级）──────────────────────────

export interface ResolutionResult {
  success: boolean;
  method: 'native_api' | 'system_settings' | 'unsupported';
  message: string;
}

export async function setSecondaryDisplayResolution(
  displayId: number,
  width: number,
  height: number
): Promise<ResolutionResult> {
  // 方案一：原生模块直接设置
  if (NativeDisplayManager) {
    try {
      const ok = await NativeDisplayManager.setDisplayResolution(displayId, width, height);
      if (ok) {
        return { success: true, method: 'native_api', message: `副屏分辨率已设置为 ${width}×${height}` };
      }
    } catch { /* fallthrough */ }
  }

  // 方案二：调起 Android 系统显示设置（真实系统操作）
  if (Platform.OS === 'android') {
    try {
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.DISPLAY_SETTINGS
      );
      return {
        success: true,
        method: 'system_settings',
        message: '已打开系统显示设置，请在设置中调整分辨率',
      };
    } catch {
      return { success: false, method: 'unsupported', message: '无法打开显示设置' };
    }
  }

  return { success: false, method: 'unsupported', message: '当前平台不支持分辨率调整' };
}

// ─── 真实屏幕旋转（expo-screen-orientation）─────────────────────────────────

export async function applyScreenRotation(degrees: 0 | 90 | 180 | 270): Promise<void> {
  if (Platform.OS === 'web') return;
  const map: Record<number, ScreenOrientation.OrientationLock> = {
    0: ScreenOrientation.OrientationLock.PORTRAIT_UP,
    90: ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT,
    180: ScreenOrientation.OrientationLock.PORTRAIT_DOWN,
    270: ScreenOrientation.OrientationLock.LANDSCAPE_LEFT,
  };
  await ScreenOrientation.lockAsync(map[degrees]);
}

export async function unlockScreenRotation(): Promise<void> {
  if (Platform.OS === 'web') return;
  await ScreenOrientation.unlockAsync();
}

// ─── 真实投屏 Intent（系统级操作）──────────────────────────────────────────

export interface CastResult {
  launched: boolean;
  method: string;
}

/** 通过 Android Intent 启动系统投屏/无线显示 */
export async function launchSystemCast(): Promise<CastResult> {
  if (Platform.OS !== 'android') {
    return { launched: false, method: 'unsupported' };
  }
  // 依次尝试多个 Cast/WirelessDisplay intent
  const intents = [
    { action: 'android.settings.CAST_SETTINGS' },
    { action: 'android.settings.WIFI_DISPLAY_SETTINGS' },
    { action: IntentLauncher.ActivityAction.DISPLAY_SETTINGS },
  ];
  for (const intent of intents) {
    try {
      await IntentLauncher.startActivityAsync(intent.action);
      return { launched: true, method: intent.action };
    } catch { /* try next */ }
  }
  return { launched: false, method: 'all_failed' };
}

/** 通过 Android Intent 启动指定 App（真实投屏入口） */
export async function launchAppForCast(packageName: string): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    await IntentLauncher.startActivityAsync(
      'android.intent.action.MAIN',
      {
        packageName,
        flags: 0x10000000, // FLAG_ACTIVITY_NEW_TASK
      }
    );
    return true;
  } catch {
    return false;
  }
}

// ─── Dimensions 变化监听（真实分辨率变化通知）────────────────────────────────

type DimensionChangeCallback = (info: RealDisplayInfo) => void;

export function subscribeDimensionChanges(cb: DimensionChangeCallback) {
  const sub = Dimensions.addEventListener('change', () => {
    cb(getRealPrimaryDisplay());
  });
  return () => sub.remove();
}
