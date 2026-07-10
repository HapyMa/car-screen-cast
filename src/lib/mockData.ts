// 模拟显示器数据
export interface DisplayInfo {
  id: number;
  name: string;
  widthPx: number;
  heightPx: number;
  widthInch: number;
  heightInch: number;
  refreshRate: number;
  isConnected: boolean;
  type: 'HDMI' | 'DP' | 'VGA' | 'USB-C' | 'internal';
}

export const MOCK_DISPLAYS: DisplayInfo[] = [
  {
    id: 0,
    name: '主屏幕',
    widthPx: 1920,
    heightPx: 720,
    widthInch: 12.3,
    heightInch: 4.6,
    refreshRate: 60,
    isConnected: true,
    type: 'internal',
  },
  {
    id: 1,
    name: '副驾娱乐屏',
    widthPx: 1280,
    heightPx: 800,
    widthInch: 10.1,
    heightInch: 6.3,
    refreshRate: 60,
    isConnected: true,
    type: 'HDMI',
  },
  {
    id: 2,
    name: '后排娱乐屏',
    widthPx: 1920,
    heightPx: 1080,
    widthInch: 13.3,
    heightInch: 7.5,
    refreshRate: 60,
    isConnected: true,
    type: 'HDMI',
  },
  {
    id: 3,
    name: 'HUD 抬头显示',
    widthPx: 800,
    heightPx: 480,
    widthInch: 8.0,
    heightInch: 4.8,
    refreshRate: 30,
    isConnected: false,
    type: 'USB-C',
  },
];

// 模拟已安装应用列表
export interface AppInfo {
  packageName: string;
  appName: string;
  icon: string; // emoji 代替图标
  category: 'navigation' | 'video' | 'game' | 'music' | 'social' | 'other';
}

export const MOCK_APPS: AppInfo[] = [
  { packageName: 'com.baidu.maps', appName: '百度地图', icon: '🗺️', category: 'navigation' },
  { packageName: 'com.autonavi.minimap', appName: '高德地图', icon: '📍', category: 'navigation' },
  { packageName: 'com.tencent.qqlive', appName: '腾讯视频', icon: '🎬', category: 'video' },
  { packageName: 'com.youku.phone', appName: '优酷视频', icon: '📺', category: 'video' },
  { packageName: 'com.iqiyi.video', appName: '爱奇艺', icon: '🎭', category: 'video' },
  { packageName: 'com.bilibili.app', appName: 'B站', icon: '📹', category: 'video' },
  { packageName: 'com.netease.cloudmusic', appName: '网易云音乐', icon: '🎵', category: 'music' },
  { packageName: 'com.tencent.qqmusic', appName: 'QQ音乐', icon: '🎶', category: 'music' },
  { packageName: 'com.ximalaya.ting.android', appName: '喜马拉雅', icon: '🎙️', category: 'music' },
  { packageName: 'com.tencent.mm', appName: '微信', icon: '💬', category: 'social' },
  { packageName: 'com.sina.weibo', appName: '微博', icon: '🌐', category: 'social' },
  { packageName: 'com.activision.callofduty', appName: '使命召唤手游', icon: '🎮', category: 'game' },
  { packageName: 'com.mihoyo.ys', appName: '原神', icon: '⚔️', category: 'game' },
  { packageName: 'com.ss.android.ugc.aweme', appName: '抖音', icon: '🎵', category: 'social' },
  { packageName: 'com.xunlei.downloadprovider', appName: '迅雷', icon: '⚡', category: 'other' },
];
