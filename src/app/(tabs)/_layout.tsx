import { Tabs } from 'expo-router';
import { Monitor, History, Wifi } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4da6ff',
        tabBarInactiveTintColor: '#6b7a99',
        tabBarStyle: {
          backgroundColor: '#0f1624',
          borderTopColor: '#1e2a42',
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarLabelStyle: {
          fontFamily: 'Glow Sans SC',
          fontSize: 12,
        },
      }}
      initialRouteName="displays"
    >
      <Tabs.Screen
        name="displays"
        options={{
          title: '显示器',
          tabBarIcon: ({ color, size }) => <Monitor size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: '历史记录',
          tabBarIcon: ({ color, size }) => <History size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="remote"
        options={{
          title: '远程投屏',
          tabBarIcon: ({ color, size }) => <Wifi size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
