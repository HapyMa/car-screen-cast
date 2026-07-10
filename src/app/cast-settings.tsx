import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  FlatList,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Settings2,
  Sliders,
  AppWindow,
  RotateCw,
  Volume2,
  BookmarkPlus,
  BookOpen,
  Play,
  X,
  Check,
  ChevronDown,
} from 'lucide-react-native';
import { MOCK_APPS, AppInfo } from '@/lib/mockData';
import { getRealPrimaryDisplay, RealDisplayInfo } from '@/lib/displayManager';
import {
  CastSettings,
  DEFAULT_CAST_SETTINGS,
  loadPresets,
  savePreset,
  deletePreset,
  PresetScheme,
  qualityLabel,
  audioRouteLabel,
} from '@/lib/store';
import { NeuCard, SectionLabel, NeuBadge } from '@/components/NeuComponents';

type Quality = CastSettings['quality'];
type Codec = CastSettings['codec'];
type AudioRoute = CastSettings['audioRoute'];
type Rotation = 0 | 90 | 180 | 270;

const QUALITY_OPTIONS: Quality[] = ['smooth', 'sd', 'hd', 'fhd'];
const CODEC_OPTIONS: Codec[] = ['H.264', 'H.265'];
const RATIO_OPTIONS = ['16:9', '4:3', '21:9', '1:1'];
const AUDIO_OPTIONS: AudioRoute[] = ['main', 'display', 'both'];
const ROTATION_OPTIONS: Rotation[] = [0, 90, 180, 270];

export default function CastSettingsScreen() {
  const router = useRouter();
  const { displayId } = useLocalSearchParams<{ displayId: string }>();

  // 使用真实主屏信息作为fallback；副屏信息由 displays.tsx 检测后传入 displayId
  const primary = getRealPrimaryDisplay();
  const display: RealDisplayInfo = {
    ...primary,
    id: Number(displayId) || primary.id,
    name: Number(displayId) === 0 || !displayId
      ? primary.name
      : `外接显示器 #${displayId}`,
  };

  const [widthPx, setWidthPx] = useState(String(DEFAULT_CAST_SETTINGS.widthPx));
  const [heightPx, setHeightPx] = useState(String(DEFAULT_CAST_SETTINGS.heightPx));
  const [aspectRatio, setAspectRatio] = useState(DEFAULT_CAST_SETTINGS.aspectRatio);
  const [quality, setQuality] = useState<Quality>(DEFAULT_CAST_SETTINGS.quality);
  const [codec, setCodec] = useState<Codec>(DEFAULT_CAST_SETTINGS.codec);
  const [bitrate, setBitrate] = useState(DEFAULT_CAST_SETTINGS.bitrateMbps);
  const [delay, setDelay] = useState(DEFAULT_CAST_SETTINGS.delayMs);
  const [rotation, setRotation] = useState<Rotation>(DEFAULT_CAST_SETTINGS.rotation);
  const [mirrorH, setMirrorH] = useState(DEFAULT_CAST_SETTINGS.mirrorH);
  const [mirrorV, setMirrorV] = useState(DEFAULT_CAST_SETTINGS.mirrorV);
  const [audioRoute, setAudioRoute] = useState<AudioRoute>(DEFAULT_CAST_SETTINGS.audioRoute);
  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null);

  const [appPickerVisible, setAppPickerVisible] = useState(false);
  const [presetModalVisible, setPresetModalVisible] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [presetsListVisible, setPresetsListVisible] = useState(false);
  const [presets, setPresets] = useState<PresetScheme[]>([]);
  const [appSearch, setAppSearch] = useState('');

  const loadPresetsList = useCallback(async () => {
    const list = await loadPresets();
    setPresets(list);
  }, []);

  const handleOpenPresets = () => {
    loadPresetsList();
    setPresetsListVisible(true);
  };

  const handleSavePreset = async () => {
    if (!presetNameInput.trim()) return;
    const scheme: PresetScheme = {
      id: Date.now().toString(),
      name: presetNameInput.trim(),
      createdAt: Date.now(),
      settings: buildSettings(),
    };
    await savePreset(scheme);
    setPresetModalVisible(false);
    setPresetNameInput('');
  };

  const handleLoadPreset = (p: PresetScheme) => {
    const s = p.settings;
    setWidthPx(String(s.widthPx));
    setHeightPx(String(s.heightPx));
    setAspectRatio(s.aspectRatio);
    setQuality(s.quality);
    setCodec(s.codec);
    setBitrate(s.bitrateMbps);
    setDelay(s.delayMs);
    setRotation(s.rotation);
    setMirrorH(s.mirrorH);
    setMirrorV(s.mirrorV);
    setAudioRoute(s.audioRoute);
    setPresetsListVisible(false);
  };

  const handleDeletePreset = async (id: string) => {
    const updated = await deletePreset(id);
    setPresets(updated);
  };

  const buildSettings = (): CastSettings => ({
    displayId: display.id,
    displayName: display.name,
    appPackage: selectedApp?.packageName ?? '',
    appName: selectedApp?.appName ?? '',
    widthPx: Number(widthPx) || 1920,
    heightPx: Number(heightPx) || 1080,
    aspectRatio,
    quality,
    codec,
    bitrateMbps: bitrate,
    delayMs: delay,
    rotation,
    mirrorH,
    mirrorV,
    audioRoute,
  });

  const canStart = selectedApp !== null;

  const handleStart = () => {
    if (!canStart) return;
    router.push({
      pathname: '/casting',
      params: { settingsJson: JSON.stringify(buildSettings()) },
    });
  };

  const filteredApps = MOCK_APPS.filter(
    a =>
      a.appName.includes(appSearch) ||
      a.packageName.includes(appSearch)
  );

  return (
    <View className="flex-1 bg-background">
      {/* 顶部 */}
      <View className="px-5 pt-12 pb-4 flex-row items-center gap-3" style={{ backgroundColor: '#0f1624' }}>
        <Pressable onPress={() => router.back()} className="p-2">
          <X size={20} color="#94a3b8" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-foreground font-glow-sans-sc text-xl font-bold">
            投屏设置
          </Text>
          <Text className="text-muted-foreground font-glow-sans-sc text-xs">
            目标：{display?.name} · {display?.widthPx}×{display?.heightPx}
          </Text>
        </View>
        <Pressable onPress={handleOpenPresets} className="p-2 rounded-xl active:opacity-60" style={neuBtn}>
          <BookOpen size={18} color="#4da6ff" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 32, paddingTop: 16, gap: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 分辨率 */}
        <NeuCard>
          <View className="flex-row items-center gap-2 mb-3">
            <Settings2 size={16} color="#4da6ff" />
            <SectionLabel label="分辨率与比例" />
          </View>
          <View className="flex-row gap-3 mb-3">
            <View className="flex-1">
              <Text className="text-muted-foreground font-glow-sans-sc text-xs mb-1">宽度 (px)</Text>
              <TextInput
                value={widthPx}
                onChangeText={setWidthPx}
                keyboardType="numeric"
                className="text-foreground font-glow-sans-sc text-sm px-3 py-2 rounded-xl"
                style={inputStyle}
                placeholderTextColor="#6b7a99"
              />
            </View>
            <View className="flex-1">
              <Text className="text-muted-foreground font-glow-sans-sc text-xs mb-1">高度 (px)</Text>
              <TextInput
                value={heightPx}
                onChangeText={setHeightPx}
                keyboardType="numeric"
                className="text-foreground font-glow-sans-sc text-sm px-3 py-2 rounded-xl"
                style={inputStyle}
                placeholderTextColor="#6b7a99"
              />
            </View>
          </View>
          <Text className="text-muted-foreground font-glow-sans-sc text-xs mb-2">显示比例</Text>
          <View className="flex-row flex-wrap gap-2">
            {RATIO_OPTIONS.map(r => (
              <Pressable key={r} onPress={() => setAspectRatio(r)}>
                <View
                  className="px-4 py-2 rounded-xl"
                  style={aspectRatio === r ? activeChipStyle : chipStyle}
                >
                  <Text
                    className="font-glow-sans-sc text-sm font-semibold"
                    style={{ color: aspectRatio === r ? '#4da6ff' : '#6b7a99' }}
                  >
                    {r}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </NeuCard>

        {/* 画质与编码 */}
        <NeuCard>
          <View className="flex-row items-center gap-2 mb-3">
            <Sliders size={16} color="#a78bfa" />
            <SectionLabel label="画质与编码" />
          </View>
          <Text className="text-muted-foreground font-glow-sans-sc text-xs mb-2">画质档位</Text>
          <View className="flex-row gap-2 mb-4">
            {QUALITY_OPTIONS.map(q => (
              <Pressable key={q} onPress={() => setQuality(q)} style={{ flex: 1 }}>
                <View
                  className="py-2 rounded-xl items-center"
                  style={quality === q ? activeChipStyle : chipStyle}
                >
                  <Text
                    className="font-glow-sans-sc text-xs font-semibold"
                    style={{ color: quality === q ? '#4da6ff' : '#6b7a99' }}
                  >
                    {qualityLabel(q)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
          <Text className="text-muted-foreground font-glow-sans-sc text-xs mb-2">编码格式</Text>
          <View className="flex-row gap-2 mb-4">
            {CODEC_OPTIONS.map(c => (
              <Pressable key={c} onPress={() => setCodec(c)} style={{ flex: 1 }}>
                <View
                  className="py-2 rounded-xl items-center"
                  style={codec === c ? activeChipStyle : chipStyle}
                >
                  <Text
                    className="font-glow-sans-sc text-sm font-semibold"
                    style={{ color: codec === c ? '#4da6ff' : '#6b7a99' }}
                  >
                    {c}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
          <Text className="text-muted-foreground font-glow-sans-sc text-xs mb-2">
            码率：{bitrate} Mbps
          </Text>
          <SliderRow value={bitrate} min={1} max={20} step={1} onChange={setBitrate} />
        </NeuCard>

        {/* 延迟调整 */}
        <NeuCard>
          <View className="flex-row items-center gap-2 mb-3">
            <Sliders size={16} color="#34d399" />
            <SectionLabel label="延迟调整" />
          </View>
          <Text className="text-muted-foreground font-glow-sans-sc text-xs mb-2">
            延迟：{delay} ms
            {delay < 80 && (
              <Text style={{ color: '#f59e0b' }}> · 极低延迟</Text>
            )}
          </Text>
          <SliderRow value={delay} min={0} max={500} step={10} onChange={setDelay} />
          <View className="flex-row gap-2 mt-3">
            {[0, 50, 100, 200].map(v => (
              <Pressable key={v} onPress={() => setDelay(v)} style={{ flex: 1 }}>
                <View className="py-1.5 rounded-lg items-center" style={delay === v ? activeChipStyle : chipStyle}>
                  <Text className="font-glow-sans-sc text-xs" style={{ color: delay === v ? '#4da6ff' : '#6b7a99' }}>
                    {v}ms
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </NeuCard>

        {/* 旋转与镜像 */}
        <NeuCard>
          <View className="flex-row items-center gap-2 mb-3">
            <RotateCw size={16} color="#f59e0b" />
            <SectionLabel label="旋转与镜像" />
          </View>
          <Text className="text-muted-foreground font-glow-sans-sc text-xs mb-2">旋转角度</Text>
          <View className="flex-row gap-2 mb-4">
            {ROTATION_OPTIONS.map(r => (
              <Pressable key={r} onPress={() => setRotation(r)} style={{ flex: 1 }}>
                <View className="py-2 rounded-xl items-center" style={rotation === r ? activeChipStyle : chipStyle}>
                  <Text className="font-glow-sans-sc text-xs font-semibold" style={{ color: rotation === r ? '#4da6ff' : '#6b7a99' }}>
                    {r}°
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
          <View className="flex-row gap-3">
            <Pressable onPress={() => setMirrorH(!mirrorH)} style={{ flex: 1 }}>
              <View className="py-2.5 rounded-xl items-center" style={mirrorH ? activeChipStyle : chipStyle}>
                <Text className="font-glow-sans-sc text-sm font-semibold" style={{ color: mirrorH ? '#4da6ff' : '#6b7a99' }}>
                  ↔ 水平镜像
                </Text>
              </View>
            </Pressable>
            <Pressable onPress={() => setMirrorV(!mirrorV)} style={{ flex: 1 }}>
              <View className="py-2.5 rounded-xl items-center" style={mirrorV ? activeChipStyle : chipStyle}>
                <Text className="font-glow-sans-sc text-sm font-semibold" style={{ color: mirrorV ? '#4da6ff' : '#6b7a99' }}>
                  ↕ 垂直镜像
                </Text>
              </View>
            </Pressable>
          </View>
        </NeuCard>

        {/* 音频路由 */}
        <NeuCard>
          <View className="flex-row items-center gap-2 mb-3">
            <Volume2 size={16} color="#f472b6" />
            <SectionLabel label="音频路由" />
          </View>
          <View className="gap-2">
            {AUDIO_OPTIONS.map(a => (
              <Pressable key={a} onPress={() => setAudioRoute(a)}>
                <View
                  className="flex-row items-center px-4 py-3 rounded-xl"
                  style={audioRoute === a ? activeChipStyle : chipStyle}
                >
                  <View
                    className="w-4 h-4 rounded-full mr-3 items-center justify-center"
                    style={{ borderWidth: 2, borderColor: audioRoute === a ? '#4da6ff' : '#3a4a60' }}
                  >
                    {audioRoute === a && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4da6ff' }} />}
                  </View>
                  <Text className="font-glow-sans-sc text-sm" style={{ color: audioRoute === a ? '#4da6ff' : '#94a3b8' }}>
                    {audioRouteLabel(a)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </NeuCard>

        {/* 选择投屏应用 */}
        <NeuCard>
          <View className="flex-row items-center gap-2 mb-3">
            <AppWindow size={16} color="#4da6ff" />
            <SectionLabel label="选择投屏应用" />
          </View>
          {selectedApp ? (
            <View className="flex-row items-center gap-3 p-3 rounded-xl mb-3" style={{ backgroundColor: '#0f2040' }}>
              <Text style={{ fontSize: 28 }}>{selectedApp.icon}</Text>
              <View className="flex-1">
                <Text className="text-foreground font-glow-sans-sc text-sm font-semibold">
                  {selectedApp.appName}
                </Text>
                <Text className="text-muted-foreground font-glow-sans-sc text-xs">
                  {selectedApp.packageName}
                </Text>
              </View>
              <Pressable onPress={() => setSelectedApp(null)}>
                <X size={16} color="#6b7a99" />
              </Pressable>
            </View>
          ) : (
            <Text className="text-muted-foreground font-glow-sans-sc text-sm mb-3">
              尚未选择应用
            </Text>
          )}
          <Pressable
            className="flex-row items-center justify-center gap-2 py-3 rounded-xl active:opacity-70"
            style={{ backgroundColor: '#1a2a44', borderWidth: 1, borderColor: '#2a4a7a' }}
            onPress={() => setAppPickerVisible(true)}
          >
            <ChevronDown size={16} color="#4da6ff" />
            <Text className="text-primary font-glow-sans-sc text-sm font-semibold">
              {selectedApp ? '重新选择应用' : '选择要投屏的应用'}
            </Text>
          </Pressable>
        </NeuCard>

        {/* 底部按钮 */}
        <View className="flex-row gap-3 pt-2">
          <Pressable
            className="flex-row items-center gap-2 px-4 py-3 rounded-xl active:opacity-70"
            style={{ backgroundColor: '#1a2a44', borderWidth: 1, borderColor: '#2a4a7a' }}
            onPress={() => setPresetModalVisible(true)}
          >
            <BookmarkPlus size={16} color="#4da6ff" />
            <Text className="text-primary font-glow-sans-sc text-sm">保存预设</Text>
          </Pressable>
          <Pressable
            className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl active:opacity-80"
            style={canStart ? startBtnStyle : disabledBtnStyle}
            onPress={handleStart}
            disabled={!canStart}
          >
            <Play size={18} color={canStart ? '#131928' : '#6b7a99'} fill={canStart ? '#131928' : 'transparent'} />
            <Text
              className="font-glow-sans-sc text-base font-bold"
              style={{ color: canStart ? '#131928' : '#6b7a99' }}
            >
              开始投屏
            </Text>
          </Pressable>
        </View>
        {!canStart && (
          <Text className="text-center text-muted-foreground font-glow-sans-sc text-xs">
            请先选择要投屏的应用
          </Text>
        )}
      </ScrollView>

      {/* 应用选择弹窗 */}
      <Modal visible={appPickerVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <View
            style={{
              flex: 1,
              marginTop: 80,
              backgroundColor: '#0f1624',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingHorizontal: 16,
              paddingTop: 16,
            }}
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-foreground font-glow-sans-sc text-xl font-bold">选择应用</Text>
              <Pressable onPress={() => setAppPickerVisible(false)}>
                <X size={22} color="#94a3b8" />
              </Pressable>
            </View>
            <TextInput
              value={appSearch}
              onChangeText={setAppSearch}
              placeholder="搜索应用名称…"
              placeholderTextColor="#6b7a99"
              className="text-foreground font-glow-sans-sc text-sm px-4 py-3 rounded-xl mb-3"
              style={inputStyle}
            />
            <FlatList
              data={filteredApps}
              keyExtractor={item => item.packageName}
              contentContainerStyle={{ gap: 10, paddingBottom: 32 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setSelectedApp(item);
                    setAppPickerVisible(false);
                    setAppSearch('');
                  }}
                >
                  {({ pressed }) => (
                    <View
                      className="flex-row items-center gap-3 px-4 py-3 rounded-2xl"
                      style={{
                        backgroundColor: pressed ? '#1a2a44' : '#151e30',
                        borderWidth: 1,
                        borderColor: selectedApp?.packageName === item.packageName ? '#2a6ab8' : '#1e2a42',
                      }}
                    >
                      <Text style={{ fontSize: 26 }}>{item.icon}</Text>
                      <View className="flex-1">
                        <Text className="text-foreground font-glow-sans-sc text-sm font-semibold">
                          {item.appName}
                        </Text>
                        <NeuBadge color={CATEGORY_COLOR[item.category]}>
                          {CATEGORY_LABEL[item.category]}
                        </NeuBadge>
                      </View>
                      {selectedApp?.packageName === item.packageName && (
                        <Check size={18} color="#4da6ff" />
                      )}
                    </View>
                  )}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* 保存预设弹窗 */}
      <Modal visible={presetModalVisible} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#151e30', borderRadius: 24, padding: 24, width: '100%', gap: 16, borderWidth: 1, borderColor: '#1e2a42' }}>
            <Text className="text-foreground font-glow-sans-sc text-xl font-bold">保存为预设方案</Text>
            <TextInput
              value={presetNameInput}
              onChangeText={setPresetNameInput}
              placeholder="输入预设名称（如：导航标配）"
              placeholderTextColor="#6b7a99"
              className="text-foreground font-glow-sans-sc text-sm px-4 py-3 rounded-xl"
              style={inputStyle}
            />
            <View className="flex-row gap-3">
              <Pressable
                className="flex-1 py-3 rounded-xl items-center active:opacity-70"
                style={{ backgroundColor: '#1a1e30', borderWidth: 1, borderColor: '#2a3a55' }}
                onPress={() => setPresetModalVisible(false)}
              >
                <Text className="text-muted-foreground font-glow-sans-sc text-sm">取消</Text>
              </Pressable>
              <Pressable
                className="flex-1 py-3 rounded-xl items-center active:opacity-80"
                style={{ backgroundColor: '#1a4a8a', borderWidth: 1, borderColor: '#2a6ab8' }}
                onPress={handleSavePreset}
              >
                <Text className="text-primary font-glow-sans-sc text-sm font-semibold">保存</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 预设列表弹窗 */}
      <Modal visible={presetsListVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <View style={{ flex: 1, marginTop: 100, backgroundColor: '#0f1624', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 16 }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-foreground font-glow-sans-sc text-xl font-bold">已保存预设</Text>
              <Pressable onPress={() => setPresetsListVisible(false)}>
                <X size={22} color="#94a3b8" />
              </Pressable>
            </View>
            {presets.length === 0 ? (
              <View className="flex-1 items-center justify-center gap-3">
                <BookOpen size={40} color="#6b7a99" />
                <Text className="text-muted-foreground font-glow-sans-sc text-sm">暂无保存的预设方案</Text>
              </View>
            ) : (
              <FlatList
                data={presets}
                keyExtractor={p => p.id}
                contentContainerStyle={{ gap: 12, paddingBottom: 32 }}
                renderItem={({ item }) => (
                  <View className="flex-row items-center gap-3 px-4 py-3 rounded-2xl" style={{ backgroundColor: '#151e30', borderWidth: 1, borderColor: '#1e2a42' }}>
                    <View className="flex-1">
                      <Text className="text-foreground font-glow-sans-sc text-sm font-semibold">{item.name}</Text>
                      <Text className="text-muted-foreground font-glow-sans-sc text-xs">
                        {item.settings.widthPx}×{item.settings.heightPx} · {qualityLabel(item.settings.quality)} · {item.settings.codec}
                      </Text>
                    </View>
                    <Pressable
                      className="px-3 py-1.5 rounded-lg active:opacity-70"
                      style={{ backgroundColor: '#1a2a44', borderWidth: 1, borderColor: '#2a4a7a' }}
                      onPress={() => handleLoadPreset(item)}
                    >
                      <Text className="text-primary font-glow-sans-sc text-xs">载入</Text>
                    </Pressable>
                    <Pressable
                      className="p-1.5 rounded-lg active:opacity-70"
                      onPress={() => handleDeletePreset(item.id)}
                    >
                      <X size={14} color="#6b7a99" />
                    </Pressable>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// 简易步进滑块（用按钮模拟）
function SliderRow({ value, min, max, step, onChange }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <View className="flex-row items-center gap-3">
      <Pressable
        onPress={() => onChange(Math.max(min, value - step))}
        className="w-8 h-8 rounded-full items-center justify-center active:opacity-60"
        style={chipStyle}
      >
        <Text className="text-foreground font-glow-sans-sc text-base">−</Text>
      </Pressable>
      <View className="flex-1 h-2 rounded-full" style={{ backgroundColor: '#1e2a42' }}>
        <View
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: '#4da6ff' }}
        />
      </View>
      <Pressable
        onPress={() => onChange(Math.min(max, value + step))}
        className="w-8 h-8 rounded-full items-center justify-center active:opacity-60"
        style={chipStyle}
      >
        <Text className="text-foreground font-glow-sans-sc text-base">+</Text>
      </Pressable>
    </View>
  );
}

const CATEGORY_COLOR: Record<string, string> = {
  navigation: '#4da6ff', video: '#a78bfa', game: '#f472b6',
  music: '#34d399', social: '#f59e0b', other: '#94a3b8',
};
const CATEGORY_LABEL: Record<string, string> = {
  navigation: '导航', video: '视频', game: '游戏',
  music: '音乐', social: '社交', other: '其他',
};

const inputStyle = {
  backgroundColor: '#0f1624',
  borderWidth: 1,
  borderColor: '#1e2a42',
  color: '#e2e8f0',
};
const chipStyle = {
  backgroundColor: '#151e30',
  borderWidth: 1,
  borderColor: '#1e2a42',
};
const activeChipStyle = {
  backgroundColor: '#0f2040',
  borderWidth: 1,
  borderColor: '#2a6ab8',
};
const neuBtn = {
  backgroundColor: '#151e30',
  borderWidth: 1,
  borderColor: '#1e2a42',
  shadowColor: '#000',
  shadowOffset: { width: 2, height: 3 },
  shadowOpacity: 0.4,
  shadowRadius: 5,
  elevation: 3,
};
const startBtnStyle = {
  backgroundColor: '#4da6ff',
  shadowColor: '#4da6ff',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.35,
  shadowRadius: 10,
  elevation: 8,
};
const disabledBtnStyle = {
  backgroundColor: '#1a2030',
  borderWidth: 1,
  borderColor: '#2a3a50',
};
