import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
} from 'react-native';
import {
  Wifi,
  Upload,
  Download,
  Link2,
  QrCode,
  Signal,
  Unlink,
  RefreshCw,
  Zap,
} from 'lucide-react-native';
import { NeuCard, SectionLabel, NeuBadge } from '@/components/NeuComponents';

type Mode = 'sender' | 'receiver';
type ConnStatus = 'idle' | 'connecting' | 'connected' | 'failed';

const MOCK_LOCAL_IP = '192.168.1.108';
const MOCK_PORT = '8899';

export default function RemoteScreen() {
  const [mode, setMode] = useState<Mode>('sender');
  const [targetIp, setTargetIp] = useState('');
  const [targetPort, setTargetPort] = useState('8899');
  const [connStatus, setConnStatus] = useState<ConnStatus>('idle');
  const [useQr, setUseQr] = useState(false);
  const [rtspEnabled, setRtspEnabled] = useState(false);
  const [streamQuality, setStreamQuality] = useState<'low' | 'mid' | 'high'>('mid');

  const handleConnect = () => {
    setConnStatus('connecting');
    setTimeout(() => {
      // 模拟连接成功（IP 格式正确则成功，否则失败）
      const isValidIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(targetIp.trim());
      setConnStatus(isValidIp ? 'connected' : 'failed');
    }, 2000);
  };

  const handleDisconnect = () => {
    setConnStatus('idle');
  };

  const qualityColor = { low: '#f59e0b', mid: '#4da6ff', high: '#34d399' };
  const qualityLabel = { low: '低延迟', mid: '均衡', high: '高质量' };

  return (
    <View className="flex-1 bg-background">
      {/* 顶部 */}
      <View
        className="px-5 pt-12 pb-4"
        style={{ backgroundColor: '#0f1624', borderBottomWidth: 1, borderBottomColor: '#1e2a42' }}
      >
        <Text className="text-foreground font-glow-sans-sc text-2xl font-bold">远程投屏</Text>
        <Text className="text-muted-foreground font-glow-sans-sc text-xs mt-0.5">
          通过局域网或互联网进行远程画面传输
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 32, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 模式选择 */}
        <NeuCard>
          <SectionLabel label="连接模式" />
          <View className="flex-row gap-3">
            <Pressable onPress={() => { setMode('sender'); setConnStatus('idle'); }} style={{ flex: 1 }}>
              <View
                className="py-4 rounded-2xl items-center gap-2"
                style={mode === 'sender' ? activeCard : inactiveCard}
              >
                <Upload size={24} color={mode === 'sender' ? '#4da6ff' : '#3a4a60'} />
                <Text className="font-glow-sans-sc text-sm font-semibold" style={{ color: mode === 'sender' ? '#4da6ff' : '#6b7a99' }}>
                  发送端
                </Text>
                <Text className="font-glow-sans-sc text-xs text-center" style={{ color: mode === 'sender' ? '#6a9acf' : '#3a4a60' }}>
                  车机发送画面
                </Text>
              </View>
            </Pressable>
            <Pressable onPress={() => { setMode('receiver'); setConnStatus('idle'); }} style={{ flex: 1 }}>
              <View
                className="py-4 rounded-2xl items-center gap-2"
                style={mode === 'receiver' ? activeCard : inactiveCard}
              >
                <Download size={24} color={mode === 'receiver' ? '#a78bfa' : '#3a4a60'} />
                <Text className="font-glow-sans-sc text-sm font-semibold" style={{ color: mode === 'receiver' ? '#a78bfa' : '#6b7a99' }}>
                  接收端
                </Text>
                <Text className="font-glow-sans-sc text-xs text-center" style={{ color: mode === 'receiver' ? '#9070c0' : '#3a4a60' }}>
                  车机接收画面
                </Text>
              </View>
            </Pressable>
          </View>
        </NeuCard>

        {/* 本机信息（发送端显示） */}
        {mode === 'sender' && (
          <NeuCard>
            <SectionLabel label="本机信息" />
            <View className="gap-3">
              <View className="flex-row items-center gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: '#0a1020' }}>
                <Wifi size={16} color="#4da6ff" />
                <Text className="text-muted-foreground font-glow-sans-sc text-xs">本机 IP</Text>
                <Text className="text-foreground font-glow-sans-sc text-sm font-semibold flex-1 text-right">
                  {MOCK_LOCAL_IP}
                </Text>
              </View>
              <View className="flex-row items-center gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: '#0a1020' }}>
                <Signal size={16} color="#34d399" />
                <Text className="text-muted-foreground font-glow-sans-sc text-xs">监听端口</Text>
                <Text className="text-foreground font-glow-sans-sc text-sm font-semibold flex-1 text-right">
                  {MOCK_PORT}
                </Text>
              </View>
            </View>

            {/* 二维码开关 */}
            <View className="flex-row items-center justify-between mt-3 px-1">
              <View className="flex-row items-center gap-2">
                <QrCode size={16} color="#f59e0b" />
                <Text className="text-muted-foreground font-glow-sans-sc text-sm">显示连接二维码</Text>
              </View>
              <Switch
                value={useQr}
                onValueChange={setUseQr}
                trackColor={{ false: '#1e2a42', true: '#1a4a8a' }}
                thumbColor={useQr ? '#4da6ff' : '#6b7a99'}
              />
            </View>

            {useQr && (
              <View className="mt-3 p-6 rounded-2xl items-center" style={{ backgroundColor: '#0a1020' }}>
                {/* 模拟二维码 */}
                <View style={{ width: 120, height: 120, backgroundColor: '#fff', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 60 }}>⬛</Text>
                </View>
                <Text className="text-muted-foreground font-glow-sans-sc text-xs mt-3 text-center">
                  接收端扫码连接
                </Text>
                <Text className="text-primary font-glow-sans-sc text-xs mt-1">
                  {MOCK_LOCAL_IP}:{MOCK_PORT}
                </Text>
              </View>
            )}
          </NeuCard>
        )}

        {/* 连接目标（接收端输入 / 发送端手动输入） */}
        <NeuCard>
          <SectionLabel label={mode === 'sender' ? '接收端地址' : '发送端地址'} />
          <View className="gap-3">
            <View>
              <Text className="text-muted-foreground font-glow-sans-sc text-xs mb-1">IP 地址</Text>
              <TextInput
                value={targetIp}
                onChangeText={setTargetIp}
                placeholder={mode === 'sender' ? '输入接收端 IP（如 192.168.1.200）' : '输入发送端 IP'}
                placeholderTextColor="#6b7a99"
                keyboardType="numeric"
                className="text-foreground font-glow-sans-sc text-sm px-4 py-3 rounded-xl"
                style={inputStyle}
                editable={connStatus !== 'connected'}
              />
            </View>
            <View>
              <Text className="text-muted-foreground font-glow-sans-sc text-xs mb-1">端口</Text>
              <TextInput
                value={targetPort}
                onChangeText={setTargetPort}
                keyboardType="numeric"
                className="text-foreground font-glow-sans-sc text-sm px-4 py-3 rounded-xl"
                style={inputStyle}
                editable={connStatus !== 'connected'}
              />
            </View>
          </View>
        </NeuCard>

        {/* 传输协议设置 */}
        <NeuCard>
          <SectionLabel label="传输设置" />
          <View className="flex-row items-center justify-between mb-3 px-1">
            <View className="flex-row items-center gap-2">
              <Zap size={15} color="#f59e0b" />
              <Text className="text-foreground font-glow-sans-sc text-sm">启用 RTSP 协议</Text>
            </View>
            <Switch
              value={rtspEnabled}
              onValueChange={setRtspEnabled}
              trackColor={{ false: '#1e2a42', true: '#1a4a8a' }}
              thumbColor={rtspEnabled ? '#4da6ff' : '#6b7a99'}
            />
          </View>
          <Text className="text-muted-foreground font-glow-sans-sc text-xs mb-2">网络画质</Text>
          <View className="flex-row gap-2">
            {(['low', 'mid', 'high'] as const).map(q => (
              <Pressable key={q} onPress={() => setStreamQuality(q)} style={{ flex: 1 }}>
                <View
                  className="py-2.5 rounded-xl items-center"
                  style={streamQuality === q
                    ? { backgroundColor: '#0f2040', borderWidth: 1, borderColor: '#2a6ab8' }
                    : { backgroundColor: '#151e30', borderWidth: 1, borderColor: '#1e2a42' }
                  }
                >
                  <Text
                    className="font-glow-sans-sc text-xs font-semibold"
                    style={{ color: streamQuality === q ? qualityColor[q] : '#6b7a99' }}
                  >
                    {qualityLabel[q]}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </NeuCard>

        {/* 连接状态 */}
        {connStatus !== 'idle' && (
          <NeuCard>
            <View className="flex-row items-center gap-3">
              <View
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor:
                    connStatus === 'connected' ? '#34d399'
                    : connStatus === 'failed' ? '#ff4444'
                    : '#f59e0b',
                }}
              />
              <Text
                className="font-glow-sans-sc text-sm flex-1"
                style={{
                  color:
                    connStatus === 'connected' ? '#34d399'
                    : connStatus === 'failed' ? '#ff6666'
                    : '#f59e0b',
                }}
              >
                {connStatus === 'connected' ? `已连接到 ${targetIp}:${targetPort}`
                  : connStatus === 'failed' ? '连接失败，请检查 IP 地址和网络'
                  : '正在连接中…'}
              </Text>
              {connStatus === 'connecting' && (
                <RefreshCw size={16} color="#f59e0b" />
              )}
            </View>
            {connStatus === 'connected' && (
              <View className="flex-row gap-2 mt-2">
                <NeuBadge color="#34d399">{mode === 'sender' ? '发送中' : '接收中'}</NeuBadge>
                <NeuBadge color="#4da6ff">{qualityLabel[streamQuality]}</NeuBadge>
                {rtspEnabled && <NeuBadge color="#f59e0b">RTSP</NeuBadge>}
              </View>
            )}
          </NeuCard>
        )}

        {/* 操作按钮 */}
        {connStatus !== 'connected' ? (
          <Pressable
            className="flex-row items-center justify-center gap-2 py-4 rounded-2xl active:opacity-80"
            style={
              connStatus === 'connecting'
                ? { backgroundColor: '#1a2a44', borderWidth: 1, borderColor: '#2a4a7a', opacity: 0.7 }
                : { backgroundColor: '#4da6ff', shadowColor: '#4da6ff', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 8 }
            }
            onPress={handleConnect}
            disabled={connStatus === 'connecting'}
          >
            <Link2 size={18} color="#131928" />
            <Text className="font-glow-sans-sc text-base font-bold" style={{ color: '#131928' }}>
              {connStatus === 'connecting' ? '连接中…' : '开始连接'}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            className="flex-row items-center justify-center gap-2 py-4 rounded-2xl active:opacity-80"
            style={{ backgroundColor: '#2a1a1a', borderWidth: 1, borderColor: '#6a2a2a' }}
            onPress={handleDisconnect}
          >
            <Unlink size={18} color="#ff6666" />
            <Text className="font-glow-sans-sc text-base font-bold" style={{ color: '#ff6666' }}>
              断开连接
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const inputStyle = {
  backgroundColor: '#0f1624',
  borderWidth: 1,
  borderColor: '#1e2a42',
  color: '#e2e8f0',
};
const activeCard = {
  backgroundColor: '#0f2040',
  borderWidth: 1,
  borderColor: '#2a6ab8',
  borderRadius: 16,
};
const inactiveCard = {
  backgroundColor: '#151e30',
  borderWidth: 1,
  borderColor: '#1e2a42',
  borderRadius: 16,
};
