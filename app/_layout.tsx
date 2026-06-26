import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { loadCreatures } from '@/services/seedService';

export default function RootLayout() {
  useEffect(() => {
    loadCreatures();
  }, []);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modals" options={{ presentation: 'modal' }} />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
