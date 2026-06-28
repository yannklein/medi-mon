import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function LogbookLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.navy },
        headerTintColor: Colors.biolumCyan,
        headerTitleStyle: { color: Colors.sandy, fontSize: 18, fontWeight: '700' },
        // @ts-ignore — valid NativeStack option, not in TS types for this SDK version
        headerBackTitleVisible: false,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
