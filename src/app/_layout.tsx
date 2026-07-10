import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';
import { PortalHost } from '@rn-primitives/portal';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import "../global.css";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Glow Sans SC': { uri: 'https://resource-static.cdn.bcebos.com/fonts/GlowSansSC-Normal-Regular.ttf' },
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#131928' }}>
        <ActivityIndicator size="large" color="#4da6ff" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" backgroundColor="#131928" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="cast-settings" />
        <Stack.Screen name="casting" />
      </Stack>
      <PortalHost />
    </GestureHandlerRootView>
  );
}
