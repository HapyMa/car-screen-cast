import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Monitor,
  RefreshCw,
  CheckCircle2,
  ChevronRight,
  Star,
  Zap,
  Settings2,
  Cpu,
  Smartphone,
  ExternalLink,
  Signal,
} from 'lucide-react-native';
import {
  RealDisplayInfo,
  getRealPrimaryDisplay,
  detectSecondaryDisplays,
  setSecondaryDisplayResolution,
  subscribeDimensionChanges,
  launchSystemCast,
} from '@/lib/displayManager';
import { NeuCard, NeuBadge } from '@/components/NeuComponents';

const TYPE_COLOR: Record<string, string> = {
  HDMI: '#4da6ff',
  DP: '#a78bfa',
  VGA: '#94a3b8',
  'USB-C': '#34d399',
  internal: '#f59e0b',
  wireless: '#f472b6',
};

const PRESET_RESOLUTIONS = [
  { label: '1920×1080', w: 1920, h: 1080 },
  { label: '2560×1440', w: 2560, h: 1440 },
  { label: '3840×2160', w: 3840, h: 2160 },
  { label: '1280×720', w: 1280, h: 720 },
  { label: '1366×768', w: 1366, h: 768 },
];

export default function DisplaysScreen() {
  const router = useRouter();
  const [primary, setPrimary] = useState<RealDisplayInfo | null>(null);
  const [secondaries, setSecondaries] = useState<RealDisplayInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 副屏分辨率调整状态
  const [resizeTarget, setResizeTarget] = useState<RealDisplayInfo | null>(null);
  const [customW, setCustomW] = useState('1920');
  const [customH, setCustomH] = useState('1080');
  const [resizing, setResizing] = useState(false);
  const [resizeMsg, setResizeMsg] = useState('');

  // 投屏操作反馈
  const [castMsg, setCastMsg] = useState('');

  // 实时监听分辨率变化（Dimensions.addEventListener）
  const unsubRef = useRef<(() => void) | null>(null);

  const loadDisplays = useCallback(async () => {
    const p = getRealPrimaryDisplay();
    const secs = await detectSecondaryDisplays();
    setPrimary(p);
    setSecondaries(secs);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadDisplays();
      // 订阅真实分辨率变化
      unsubRef.current = subscribeDimensionChanges(updated => {
        setPrimary(updated);
      });
      return () => {
        unsubRef.current?.();
      };
    }, [loadDisplays])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadDisplays();
  };

  // 打开副屏分辨率调整面板
  const openResizePanel = (d: RealDisplayInfo) => {
    setResizeTarget(d);
    setCustomW(String(d.widthPx));
    setCustomH(String(d.heightPx));
    setResizeMsg('');
  };

  // 应用副屏分辨率（真实 API 或系统设置）
  const handleApplyResolution = async (w: number, h: number) => {
    if (!resizeTarget) return;
    setResizing(true);
    setResizeMsg('');
    const result = await setSecondaryDisplayResolution(resizeTarget.id, w, h);
    setResizing(false);
    setResizeMsg(result.message);

    if (result.success && result.method === 'native_api') {
      // 原生 API 成功：立即更新副屏列表中的分辨率
      setSecondaries(prev =>
        prev.map(d =>
          d.id === resizeTarget.id
            ? { ...d, widthPx: w, heightPx: h }
            : d
        )
      );
      setResizeTarget(prev => prev ? { ...prev, widthPx: w, heightPx: h } : prev);
    }
  };

  // 启动系统投屏
  const handleSystemCast = async () => {
    setCastMsg('正在唤起系统投屏…');
    const result = await launchSystemCast();
    setCastMsg(result.launched ? '系统投屏已启动' : '无法启动系统投屏，请手动操作');
    setTimeout(() => setCastMsg(''), 3000);
  };

  const allDisplays = primary ? [primary, ...secondaries] : secondaries;
  const connectedCount = allDisplays.filter(d => d.isConnected).length;
  // 推荐：分辨率最高的副屏
  const recommendedId =
    secondaries.length > 0
      ? secondaries.reduce((b, d) => d.widthPx * d.heightPx > b.widthPx * b.heightPx ? d : b).id
      : -1;

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center gap-4">
        <ActivityIndicator size="large" color="#4da6ff" />
        <Text className="text-muted-foreground font-glow-sans-sc text-sm">
          正在检测显示器…
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* 顶部栏 */}
      <View
        className="px-5 pt-12 pb-4 flex-row items-center justify-between"
        style={{ backgroundColor: '#0f1624' }}
      >
        <View>
          <Text className="text-foreground font-glow-sans-sc text-2xl font-bold">
            车机投屏助手
          </Text>
          <Text className="text-muted-foreground font-glow-sans-sc text-xs mt-1">
            检测到 {connectedCount} 个显示器 · {Platform.OS === 'android' ? 'Android' : 'Web预览'}
          </Text>
        </View>
        <View className="flex-row gap-2">
          {/* 系统投屏按钮 */}
          <Pressable
            onPress={handleSystemCast}
            className="p-3 rounded-2xl active:opacity-60"
            style={neuStyle}
          >
            <ExternalLink size={18} color="#34d399" />
          </Pressable>
          <Pressable
            onPress={handleRefresh}
            className="p-3 rounded-2xl active:opacity-60"
            style={neuStyle}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#4da6ff" />
            ) : (
              <RefreshCw size={18} color="#4da6ff" />
            )}
          </Pressable>
        </View>
      </View>

      {/* 系统投屏反馈 */}
      {castMsg ? (
        <View className="mx-4 mt-2 px-4 py-2 rounded-xl" style={{ backgroundColor: '#0f2040', borderWidth: 1, borderColor: '#2a6ab8' }}>
          <Text className="text-primary font-glow-sans-sc text-xs text-center">{castMsg}</Text>
        </View>
      ) : null}

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 24, paddingTop: 14, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 统计卡片 */}
        <View className="flex-row gap-3">
          <NeuCard style={{ flex: 1 }}>
            <View className="items-center gap-1">
              <Text className="text-primary font-glow-sans-sc text-3xl font-bold">{connectedCount}</Text>
              <Text className="text-muted-foreground font-glow-sans-sc text-xs">已连接</Text>
            </View>
          </NeuCard>
          <NeuCard style={{ flex: 1 }}>
            <View className="items-center gap-1">
              <Text className="text-foreground font-glow-sans-sc text-3xl font-bold">{secondaries.length}</Text>
              <Text className="text-muted-foreground font-glow-sans-sc text-xs">副屏数量</Text>
            </View>
          </NeuCard>
          <NeuCard style={{ flex: 1 }}>
            <View className="items-center gap-1">
              <Text className="font-glow-sans-sc text-3xl font-bold" style={{ color: '#34d399' }}>
                {primary ? `${primary.widthPx}` : '--'}
              </Text>
              <Text className="text-muted-foreground font-glow-sans-sc text-xs">主屏宽度</Text>
            </View>
          </NeuCard>
        </View>

        {/* 主屏信息（真实数据） */}
        {primary && (
          <NeuCard>
            <View className="flex-row items-center gap-2 mb-3">
              <Smartphone size={15} color="#f59e0b" />
              <Text className="text-muted-foreground font-glow-sans-sc text-xs uppercase tracking-widest">
                主屏幕 · 真实检测
              </Text>
              <NeuBadge color="#34d399">已连接</NeuBadge>
            </View>
            <View className="flex-row items-start gap-4">
              <View
                className="w-12 h-12 rounded-2xl items-center justify-center"
                style={{ backgroundColor: '#0f1624', ...neuInnerStyle }}
              >
                <Smartphone size={24} color="#f59e0b" />
              </View>
              <View className="flex-1 gap-2">
                <Text className="text-foreground font-glow-sans-sc text-base font-semibold">
                  {primary.name}
                </Text>
                <View className="flex-row flex-wrap gap-1.5">
                  <NeuBadge color={TYPE_COLOR.internal}>内置屏</NeuBadge>
                  <NeuBadge color="#4da6ff">{primary.widthPx} × {primary.heightPx}</NeuBadge>
                  <NeuBadge color="#6b7a99">{primary.diagonalInch}"</NeuBadge>
                  <NeuBadge color="#6b7a99">{primary.densityDpi} DPI</NeuBadge>
                  <NeuBadge color="#a78bfa">{primary.refreshRate}Hz</NeuBadge>
                </View>
                <View className="flex-row items-center gap-1">
                  <Signal size={11} color="#34d399" />
                  <Text className="font-glow-sans-sc text-xs" style={{ color: '#34d399' }}>
                    数据来源：{primary.source === 'dimensions' ? 'Dimensions API（真实）' : '原生模块'}
                  </Text>
                </View>
              </View>
            </View>
          </NeuCard>
        )}

        {/* 副屏列表（支持分辨率调整） */}
        {secondaries.length > 0 && (
          <>
            <View className="flex-row items-center gap-2 px-1">
              <Monitor size={13} color="#6b7a99" />
              <Text className="text-muted-foreground font-glow-sans-sc text-xs uppercase tracking-widest">
                外接显示器
              </Text>
            </View>
            {secondaries.map(display => (
              <NeuCard key={display.id}>
                <View className="flex-row items-start gap-4">
                  <View
                    className="w-12 h-12 rounded-2xl items-center justify-center"
                    style={{ backgroundColor: '#0f1624', ...neuInnerStyle }}
                  >
                    <Monitor size={24} color="#4da6ff" />
                  </View>
                  <View className="flex-1 gap-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-foreground font-glow-sans-sc text-base font-semibold flex-1" numberOfLines={1}>
                        {display.name}
                      </Text>
                      {display.id === recommendedId && (
                        <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: '#1a3a5c' }}>
                          <Star size={10} color="#f59e0b" fill="#f59e0b" />
                          <Text className="font-glow-sans-sc text-xs" style={{ color: '#f59e0b' }}>推荐</Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-row flex-wrap gap-1.5">
                      <NeuBadge color={TYPE_COLOR[display.type] ?? '#4da6ff'}>{display.type}</NeuBadge>
                      <NeuBadge color="#4da6ff">{display.widthPx} × {display.heightPx}</NeuBadge>
                      <NeuBadge color="#6b7a99">{display.diagonalInch}"</NeuBadge>
                      <NeuBadge color="#a78bfa">{display.refreshRate}Hz</NeuBadge>
                    </View>
                    <View className="flex-row items-center gap-1 mt-0.5">
                      <CheckCircle2 size={12} color="#34d399" />
                      <Text className="font-glow-sans-sc text-xs" style={{ color: '#34d399' }}>
                        {display.source === 'native' ? '已连接 · 原生API检测' : '已连接'}
                      </Text>
                    </View>
                  </View>
                </View>

                {display.id === recommendedId && (
                  <View className="mt-3 flex-row items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: '#0f2040' }}>
                    <Zap size={13} color="#4da6ff" />
                    <Text className="text-primary font-glow-sans-sc text-xs flex-1">
                      系统推荐：分辨率最高，适合视频/游戏投屏
                    </Text>
                  </View>
                )}

                {/* 副屏操作按钮 */}
                <View className="flex-row gap-2 mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: '#1e2a42' }}>
                  <Pressable
                    className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl active:opacity-70"
                    style={{ backgroundColor: '#1a2a44', borderWidth: 1, borderColor: '#2a4a7a' }}
                    onPress={() => openResizePanel(display)}
                  >
                    <Settings2 size={13} color="#4da6ff" />
                    <Text className="text-primary font-glow-sans-sc text-xs font-semibold">调整分辨率</Text>
                  </Pressable>
                  <Pressable
                    className="flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-xl active:opacity-70"
                    style={{ backgroundColor: '#0f2040', borderWidth: 1, borderColor: '#2a6ab8' }}
                    onPress={() => router.push({ pathname: '/cast-settings', params: { displayId: display.id } })}
                  >
                    <Cpu size={13} color="#4da6ff" />
                    <Text className="text-primary font-glow-sans-sc text-xs font-semibold">投屏设置</Text>
                  </Pressable>
                </View>
              </NeuCard>
            ))}
          </>
        )}

        {/* 无副屏提示 */}
        {secondaries.length === 0 && (
          <NeuCard>
            <View className="items-center py-6 gap-3">
              <Monitor size={44} color="#3a4a60" />
              <Text className="text-muted-foreground font-glow-sans-sc text-base">未检测到外接显示器</Text>
              <Text className="text-muted-foreground font-glow-sans-sc text-xs text-center">
                请连接 HDMI / USB-C 外接显示器后点击刷新{'\n'}
                {Platform.OS !== 'android' ? '（Web预览模式下无法检测真实副屏）' : ''}
              </Text>
              <Pressable
                className="flex-row items-center gap-2 px-4 py-2 rounded-xl active:opacity-70 mt-1"
                style={{ backgroundColor: '#1a2a44', borderWidth: 1, borderColor: '#2a4a7a' }}
                onPress={handleSystemCast}
              >
                <ExternalLink size={14} color="#4da6ff" />
                <Text className="text-primary font-glow-sans-sc text-sm">启动系统无线投屏</Text>
              </Pressable>
            </View>
          </NeuCard>
        )}
      </ScrollView>

      {/* 副屏分辨率调整面板 */}
      <Modal visible={!!resizeTarget} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' }}>
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: '#0f1624',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 24,
              gap: 16,
            }}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-foreground font-glow-sans-sc text-xl font-bold">
                调整副屏分辨率
              </Text>
              <Pressable onPress={() => setResizeTarget(null)} className="p-1">
                <Text className="text-muted-foreground font-glow-sans-sc text-base">✕</Text>
              </Pressable>
            </View>

            {resizeTarget && (
              <View className="px-3 py-2 rounded-xl" style={{ backgroundColor: '#151e30', borderWidth: 1, borderColor: '#1e2a42' }}>
                <Text className="text-muted-foreground font-glow-sans-sc text-xs">
                  当前：{resizeTarget.name}
                </Text>
                <Text className="text-foreground font-glow-sans-sc text-sm font-semibold">
                  {resizeTarget.widthPx} × {resizeTarget.heightPx} · {resizeTarget.refreshRate}Hz
                </Text>
              </View>
            )}

            {/* 预设分辨率 */}
            <View>
              <Text className="text-muted-foreground font-glow-sans-sc text-xs mb-2 uppercase tracking-widest">预设分辨率</Text>
              <View className="flex-row flex-wrap gap-2">
                {PRESET_RESOLUTIONS.map(r => (
                  <Pressable
                    key={r.label}
                    onPress={() => { setCustomW(String(r.w)); setCustomH(String(r.h)); }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 10,
                      backgroundColor: customW === String(r.w) && customH === String(r.h) ? '#0f2040' : '#151e30',
                      borderWidth: 1,
                      borderColor: customW === String(r.w) && customH === String(r.h) ? '#2a6ab8' : '#1e2a42',
                    }}
                  >
                    <Text
                      className="font-glow-sans-sc text-xs font-semibold"
                      style={{ color: customW === String(r.w) && customH === String(r.h) ? '#4da6ff' : '#6b7a99' }}
                    >
                      {r.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* 自定义分辨率 */}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-muted-foreground font-glow-sans-sc text-xs mb-1">宽度 (px)</Text>
                <TextInput
                  value={customW}
                  onChangeText={setCustomW}
                  keyboardType="numeric"
                  className="text-foreground font-glow-sans-sc text-sm px-3 py-2.5 rounded-xl"
                  style={{ backgroundColor: '#0f1624', borderWidth: 1, borderColor: '#1e2a42', color: '#e2e8f0' }}
                />
              </View>
              <View className="flex-1">
                <Text className="text-muted-foreground font-glow-sans-sc text-xs mb-1">高度 (px)</Text>
                <TextInput
                  value={customH}
                  onChangeText={setCustomH}
                  keyboardType="numeric"
                  className="text-foreground font-glow-sans-sc text-sm px-3 py-2.5 rounded-xl"
                  style={{ backgroundColor: '#0f1624', borderWidth: 1, borderColor: '#1e2a42', color: '#e2e8f0' }}
                />
              </View>
            </View>

            {/* 反馈消息 */}
            {resizeMsg ? (
              <View className="px-4 py-3 rounded-xl" style={{ backgroundColor: '#0f2040', borderWidth: 1, borderColor: '#2a6ab8' }}>
                <Text className="text-primary font-glow-sans-sc text-xs text-center">{resizeMsg}</Text>
              </View>
            ) : null}

            {/* 应用按钮 */}
            <Pressable
              className="flex-row items-center justify-center gap-2 py-4 rounded-2xl active:opacity-80"
              style={
                resizing
                  ? { backgroundColor: '#1a2a44', borderWidth: 1, borderColor: '#2a4a7a', opacity: 0.7 }
                  : { backgroundColor: '#4da6ff', shadowColor: '#4da6ff', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 }
              }
              onPress={() => handleApplyResolution(Number(customW) || 1920, Number(customH) || 1080)}
              disabled={resizing}
            >
              {resizing
                ? <ActivityIndicator size="small" color="#4da6ff" />
                : <Settings2 size={18} color="#131928" />}
              <Text className="font-glow-sans-sc text-base font-bold" style={{ color: resizing ? '#4da6ff' : '#131928' }}>
                {resizing ? '正在应用…' : `应用 ${customW}×${customH}`}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// 内联软立体样式
const neuStyle = {
  backgroundColor: '#151e30',
  shadowColor: '#000',
  shadowOffset: { width: 4, height: 4 },
  shadowOpacity: 0.5,
  shadowRadius: 8,
  elevation: 6,
};

const neuInnerStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 2, height: 2 },
  shadowOpacity: 0.4,
  shadowRadius: 4,
  elevation: 3,
};
