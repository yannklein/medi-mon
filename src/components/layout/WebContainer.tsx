import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useIsWide } from '@/hooks/useResponsive';
import { Colors } from '@/constants/theme';

interface Props {
  children: React.ReactNode;
  style?: object;
}

/**
 * On wide web screens, constrains content to a readable max-width and centers it.
 * On mobile (and narrow web), renders children without any constraint.
 */
export function WebContainer({ children, style }: Props) {
  const isWide = useIsWide();

  if (!isWide || Platform.OS !== 'web') {
    return <>{children}</>;
  }

  return (
    <View style={styles.outer}>
      <View style={[styles.inner, style]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.navyDark,
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: 680,
    backgroundColor: Colors.navy,
    // Subtle side borders on web
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.oceanDark + '55',
  },
});
