import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useUIStore } from '@/stores/uiStore';
import { Colors } from '@/constants/theme';

/**
 * Entry point. Waits for Zustand persistence to hydrate from AsyncStorage,
 * then redirects to onboarding (first launch) or the catalog.
 */
export default function Index() {
  const hasOnboarded = useUIStore((s) => s.hasOnboarded);
  const hasHydrated = useUIStore((s) => s._hasHydrated);

  if (!hasHydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.navy }}>
        <ActivityIndicator color={Colors.biolumCyan} />
      </View>
    );
  }

  if (!hasOnboarded) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)/catalog" />;
}
