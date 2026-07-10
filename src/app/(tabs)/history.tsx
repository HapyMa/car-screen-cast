import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  History,
  Trash2,
  Play,
  MonitorSmartphone,
  Clock,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react-native';
import {
  HistoryRecord,
  loadHistory,
  deleteHistory,
  clearHistory,
  qualityLabel,
  formatDuration,
} from '@/lib/store';
import { NeuCard, NeuBadge } from '@/components/NeuComponents';

function formatTime(ts: number): string {
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${mm}-${dd} ${hh}:${min}`;
}

export default function HistoryScreen() {
  const router = useRouter();
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        const list = await loadHistory();
        setRecords(list);
        setLoading(false);
      })();
    }, [])
  );

  const handleDelete = async (id: string) => {
    const updated = await deleteHistory(id);
    setRecords(updated);
  };

  const handleClearAll = async () => {
    await clearHistory();
    setRecords([]);
    setConfirmClear(false);
  };

  const handleQuickCast = (record: HistoryRecord) => {
    router.push({
      pathname: '/cast-settings',
      params: { displayId: record.settings.displayId },
    });
  };

  return (
    <View className="flex-1 bg-background">
      {/* 顶部栏 */}
      <View
        className="px-5 pt-12 pb-4 flex-row items-center justify-between"
        style={{ backgroundColor: '#0f1624', borderBottomWidth: 1, borderBottomColor: '#1e2a42' }}
      >
        <View>
          <Text className="text-foreground font-glow-sans-sc text-2xl font-bold">历史记录</Text>
          <Text className="text-muted-foreground font-glow-sans-sc text-xs mt-0.5">
            共 {records.length} 条投屏记录
          </Text>
        </View>
        {records.length > 0 && (
          <Pressable
            className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl active:opacity-70"
            style={{ backgroundColor: '#2a1a1a', borderWidth: 1, borderColor: '#5a2a2a' }}
            onPress={() => setConfirmClear(!confirmClear)}
          >
            <Trash2 size={14} color="#ff6666" />
            <Text className="font-glow-sans-sc text-xs" style={{ color: '#ff6666' }}>清空</Text>
          </Pressable>
        )}
      </View>

      {/* 确认清空提示 */}
      {confirmClear && (
        <View
          className="mx-4 mt-3 px-4 py-3 rounded-xl flex-row items-center gap-3"
          style={{ backgroundColor: '#2a1a1a', borderWidth: 1, borderColor: '#6a2a2a' }}
        >
          <AlertTriangle size={16} color="#ff6666" />
          <Text className="text-xs font-glow-sans-sc flex-1" style={{ color: '#ff9999' }}>
            确认清空所有历史记录？
          </Text>
          <Pressable
            className="px-3 py-1 rounded-lg active:opacity-70"
            style={{ backgroundColor: '#3a1a1a', borderWidth: 1, borderColor: '#7a2a2a' }}
            onPress={handleClearAll}
          >
            <Text className="font-glow-sans-sc text-xs" style={{ color: '#ff4444' }}>确认</Text>
          </Pressable>
          <Pressable
            className="px-3 py-1 rounded-lg active:opacity-70"
            style={{ backgroundColor: '#151e30', borderWidth: 1, borderColor: '#1e2a42' }}
            onPress={() => setConfirmClear(false)}
          >
            <Text className="text-muted-foreground font-glow-sans-sc text-xs">取消</Text>
          </Pressable>
        </View>
      )}

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground font-glow-sans-sc text-sm">加载中…</Text>
        </View>
      ) : records.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <View className="p-6 rounded-full" style={{ backgroundColor: '#151e30' }}>
            <History size={44} color="#3a4a60" />
          </View>
          <Text className="text-muted-foreground font-glow-sans-sc text-base text-center">
            暂无投屏记录
          </Text>
          <Text className="text-muted-foreground font-glow-sans-sc text-xs text-center">
            每次结束投屏后会自动保存记录
          </Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={r => r.id}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ padding: 16, gap: 12 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <HistoryItem
              record={item}
              onDelete={() => handleDelete(item.id)}
              onQuickCast={() => handleQuickCast(item)}
            />
          )}
        />
      )}
    </View>
  );
}

function HistoryItem({
  record,
  onDelete,
  onQuickCast,
}: {
  record: HistoryRecord;
  onDelete: () => void;
  onQuickCast: () => void;
}) {
  const s = record.settings;
  return (
    <NeuCard>
      <View className="flex-row items-start gap-3">
        <View
          className="w-10 h-10 rounded-2xl items-center justify-center"
          style={{ backgroundColor: '#0f1624' }}
        >
          <MonitorSmartphone size={20} color="#4da6ff" />
        </View>
        <View className="flex-1 gap-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-foreground font-glow-sans-sc text-sm font-semibold">
              {s.appName}
            </Text>
            <View className="flex-row items-center gap-1">
              <Clock size={11} color="#6b7a99" />
              <Text className="text-muted-foreground font-glow-sans-sc text-xs">
                {formatTime(record.timestamp)}
              </Text>
            </View>
          </View>

          <Text className="text-muted-foreground font-glow-sans-sc text-xs">
            → {s.displayName}
          </Text>

          <View className="flex-row flex-wrap gap-1.5 mt-1">
            <NeuBadge color="#4da6ff">{s.widthPx}×{s.heightPx}</NeuBadge>
            <NeuBadge color="#a78bfa">{qualityLabel(s.quality)}</NeuBadge>
            <NeuBadge color="#34d399">{s.codec}</NeuBadge>
            <NeuBadge color="#f59e0b">{formatDuration(record.durationSec)}</NeuBadge>
          </View>
        </View>
      </View>

      <View className="flex-row gap-2 mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: '#1e2a42' }}>
        <Pressable
          className="flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-xl active:opacity-70"
          style={{ backgroundColor: '#1a2a44', borderWidth: 1, borderColor: '#2a4a7a' }}
          onPress={onQuickCast}
        >
          <ChevronRight size={14} color="#4da6ff" />
          <Text className="text-primary font-glow-sans-sc text-xs font-semibold">快速投屏</Text>
        </Pressable>
        <Pressable
          className="px-4 py-2 rounded-xl active:opacity-70"
          style={{ backgroundColor: '#1e1414', borderWidth: 1, borderColor: '#3a2020' }}
          onPress={onDelete}
        >
          <Trash2 size={14} color="#ff6666" />
        </Pressable>
      </View>
    </NeuCard>
  );
}
