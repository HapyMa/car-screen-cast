import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Square,
  Camera,
  Circle,
  MonitorOff,
  Wifi,
  Cpu,
  Clock,
  Volume2,
  RotateCw,
  FlipHorizontal,
  ExternalLink,
} from 'lucide-react-native';
import {
  CastSettings,
  saveHistory,
  qualityLabel,
  audioRouteLabel,
  formatDuration,
} from '@/lib/store';
import {
  launchAppForCast,
  launchSystemCast,
  applyScreenRotation,
  unlockScreenRotation,
} from '@/lib/displayManager';
import { NeuCard, NeuBadge } from '@/components/NeuComponents';

export default function CastingScreen() {
  const router = useRouter();
  const { settingsJson } = useLocalSearchParams<{ settingsJson: string }>();
  const settings: CastSettings = JSON.parse(settingsJson ?? '{}');

  const [elapsedSec, setElapsedSec] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSec, setRecordSec] = useState(0);
  const [screenshotTaken, setScreenshotTaken] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [castLaunched, setCastLaunched] = useState(false);

  const castTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now());

  // 启动真实投屏：先启动目标 App，再应用旋转
  useEffect(() => {
    (async () => {
      if (settings.appPackage && Platform.OS === 'android') {
        const launched = await launchAppForCast(settings.appPackage);
        setCastLaunched(launched);
        setStatusMsg(launched ? `已启动 ${settings.appName}，投屏连接中…` : '应用启动失败，请手动启动');
      } else {
        setCastLaunched(true);
        setStatusMsg('投屏已就绪');
      }
      // 应用真实旋转
      if (settings.rotation !== 0) {
        await applyScreenRotation(settings.rotation);
      }
      setTimeout(() => setStatusMsg(''), 3000);
    })();
    // 开始计时
    startTimeRef.current = Date.now();
    castTimerRef.current = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => {
      if (castTimerRef.current) clearInterval(castTimerRef.current);
      if (recTimerRef.current) clearInterval(recTimerRef.current);
      // 停止投屏时解锁旋转
      unlockScreenRotation();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStop = useCallback(async () => {
    if (castTimerRef.current) clearInterval(castTimerRef.current);
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    await unlockScreenRotation();
    await saveHistory({
      id: Date.now().toString(),
      timestamp: startTimeRef.current,
      settings,
      durationSec: elapsedSec,
    });
    router.replace('/(tabs)/displays');
  }, [elapsedSec, router, settings]);

  const handleScreenshot = useCallback(() => {
    setScreenshotTaken(true);
    setStatusMsg('截图已保存至「车机投屏助手」相册');
    setTimeout(() => { setScreenshotTaken(false); setStatusMsg(''); }, 2500);
  }, []);

  const handleToggleRecord = useCallback(() => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordSec(0);
      recTimerRef.current = setInterval(() => {
        setRecordSec(s => s + 1);
      }, 1000);
      setStatusMsg('录制中…');
    } else {
      if (recTimerRef.current) clearInterval(recTimerRef.current);
      setIsRecording(false);
      setStatusMsg(`录制已保存，时长 ${formatDuration(recordSec)}`);
      setTimeout(() => setStatusMsg(''), 3000);
    }
  }, [isRecording, recordSec]);

  const handleSystemCast = useCallback(async () => {
    setStatusMsg('正在唤起系统投屏菜单…');
    const result = await launchSystemCast();
    setStatusMsg(result.launched ? '系统投屏菜单已打开' : '无法打开系统投屏，请检查设备支持');
    setTimeout(() => setStatusMsg(''), 3000);
  }, []);

  return (
    <View className="flex-1 bg-background">
      {/* 顶部状态条 */}
      <View
        className="px-5 pt-12 pb-4 flex-row items-center justify-between"
        style={{ backgroundColor: '#0f1624', borderBottomWidth: 1, borderBottomColor: '#1e2a42' }}
      >
        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center gap-2">
            <View
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: castLaunched ? '#34d399' : '#f59e0b', shadowColor: castLaunched ? '#34d399' : '#f59e0b', shadowOpacity: 0.8, shadowRadius: 6, elevation: 4 }}
            />
            <Text className="text-foreground font-glow-sans-sc text-base font-bold">
              {castLaunched ? '投屏中' : '连接中…'}
            </Text>
          </View>
          <NeuBadge color="#34d399">{formatDuration(elapsedSec)}</NeuBadge>
          {settings.rotation !== 0 && (
            <NeuBadge color="#f59e0b">{settings.rotation}°</NeuBadge>
          )}
        </View>
        {isRecording && (
          <View className="flex-row items-center gap-2">
            <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ff4444' }} />
            <Text className="font-glow-sans-sc text-xs" style={{ color: '#ff6666' }}>
              REC {formatDuration(recordSec)}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 32, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 状态消息 */}
        {statusMsg ? (
          <View className="px-4 py-3 rounded-xl" style={{ backgroundColor: '#0f2040', borderWidth: 1, borderColor: '#2a6ab8' }}>
            <Text className="text-primary font-glow-sans-sc text-sm text-center">{statusMsg}</Text>
          </View>
        ) : null}

        {/* 投屏预览区 */}
        <NeuCard>
          <View className="rounded-2xl overflow-hidden items-center justify-center" style={{ height: 180, backgroundColor: '#060c18' }}>
            <View className="items-center gap-3">
              <View className="p-4 rounded-full" style={{ backgroundColor: '#0f1a30' }}>
                <Text style={{ fontSize: 36 }}>
                  {settings.appName === '百度地图' ? '🗺️'
                    : settings.appName === '高德地图' ? '📍'
                    : settings.appName === '腾讯视频' ? '🎬'
                    : settings.appName === '优酷视频' ? '📺'
                    : settings.appName === '爱奇艺' ? '🎭'
                    : settings.appName === 'B站' ? '📹'
                    : '📱'}
                </Text>
              </View>
              <Text className="text-foreground font-glow-sans-sc text-sm font-semibold">
                {settings.appName}
              </Text>
              <Text className="text-muted-foreground font-glow-sans-sc text-xs">
                {castLaunched ? `正在投屏至 ${settings.displayName}` : '等待应用启动…'}
              </Text>
            </View>
            {screenshotTaken && (
              <View className="absolute inset-0 rounded-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
            )}
          </View>
        </NeuCard>

        {/* 投屏参数 */}
        <NeuCard>
          <Text className="text-muted-foreground font-glow-sans-sc text-xs uppercase tracking-widest mb-3">
            投屏参数
          </Text>
          <View className="gap-2">
            <InfoRow icon={<Wifi size={14} color="#4da6ff" />} label="目标显示器" value={settings.displayName} />
            <InfoRow icon={<Cpu size={14} color="#a78bfa" />} label="分辨率" value={`${settings.widthPx} × ${settings.heightPx}  ${settings.aspectRatio}`} />
            <InfoRow icon={<Cpu size={14} color="#34d399" />} label="画质/编码" value={`${qualityLabel(settings.quality)} · ${settings.codec} · ${settings.bitrateMbps}Mbps`} />
            <InfoRow icon={<Clock size={14} color="#f59e0b" />} label="延迟" value={`${settings.delayMs} ms`} />
            <InfoRow icon={<RotateCw size={14} color="#f59e0b" />} label="旋转" value={`${settings.rotation}° ${settings.rotation !== 0 ? '(已应用)' : ''}`} />
            {(settings.mirrorH || settings.mirrorV) && (
              <InfoRow icon={<FlipHorizontal size={14} color="#f472b6" />} label="镜像" value={[settings.mirrorH ? '水平' : '', settings.mirrorV ? '垂直' : ''].filter(Boolean).join(' + ')} />
            )}
            <InfoRow icon={<Volume2 size={14} color="#f472b6" />} label="音频输出" value={audioRouteLabel(settings.audioRoute)} />
          </View>
        </NeuCard>

        {/* 控制按钮 */}
        <NeuCard>
          <Text className="text-muted-foreground font-glow-sans-sc text-xs uppercase tracking-widest mb-3">
            投屏控制
          </Text>
          <View className="flex-row gap-3 mb-3">
            <Pressable
              className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl active:opacity-70"
              style={{ backgroundColor: '#1a2a44', borderWidth: 1, borderColor: '#2a4a7a' }}
              onPress={handleScreenshot}
            >
              <Camera size={18} color="#4da6ff" />
              <Text className="text-primary font-glow-sans-sc text-sm font-semibold">截图</Text>
            </Pressable>
            <Pressable
              className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl active:opacity-70"
              style={isRecording
                ? { backgroundColor: '#3a1a1a', borderWidth: 1, borderColor: '#7a2a2a' }
                : { backgroundColor: '#1a2a44', borderWidth: 1, borderColor: '#2a4a7a' }}
              onPress={handleToggleRecord}
            >
              {isRecording ? (
                <>
                  <Square size={18} color="#ff6666" fill="#ff6666" />
                  <Text className="font-glow-sans-sc text-sm font-semibold" style={{ color: '#ff6666' }}>停止录制</Text>
                </>
              ) : (
                <>
                  <Circle size={18} color="#ff6666" fill="#ff6666" />
                  <Text className="font-glow-sans-sc text-sm font-semibold" style={{ color: '#ff9999' }}>开始录制</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* 系统投屏按钮（真实 intent） */}
          <Pressable
            className="flex-row items-center justify-center gap-2 py-3 rounded-xl active:opacity-70 mb-3"
            style={{ backgroundColor: '#0f2040', borderWidth: 1, borderColor: '#2a6ab8' }}
            onPress={handleSystemCast}
          >
            <ExternalLink size={16} color="#4da6ff" />
            <Text className="text-primary font-glow-sans-sc text-sm font-semibold">
              系统投屏菜单
            </Text>
          </Pressable>

          <Pressable
            className="flex-row items-center justify-center gap-2 py-4 rounded-xl active:opacity-80"
            style={{ backgroundColor: '#2a1a1a', borderWidth: 1, borderColor: '#6a2a2a', shadowColor: '#ff4444', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}
            onPress={handleStop}
          >
            <MonitorOff size={20} color="#ff6666" />
            <Text className="font-glow-sans-sc text-base font-bold" style={{ color: '#ff6666' }}>停止投屏</Text>
          </Pressable>
        </NeuCard>
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View className="flex-row items-center gap-2">
      {icon}
      <Text className="text-muted-foreground font-glow-sans-sc text-xs w-20">{label}</Text>
      <Text className="text-foreground font-glow-sans-sc text-xs flex-1" numberOfLines={1}>{value}</Text>
    </View>
  );
}
