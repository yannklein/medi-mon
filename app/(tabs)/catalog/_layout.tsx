import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function CatalogLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.navy },
        headerTintColor: Colors.biolumCyan,
        headerTitleStyle: { color: Colors.sandy, fontSize: 18, fontWeight: '700' },
        headerBackTitleVisible: false,
        headerShadowVisible: false,
      }}
    />
  );
}
