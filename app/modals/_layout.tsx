import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.navyLight },
        headerTintColor: Colors.biolumCyan,
        headerTitleStyle: { color: Colors.sandy, fontSize: 18, fontWeight: '700' },
        headerShadowVisible: false,
      }}
    />
  );
}
