import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useUIStore } from '@/stores/uiStore';
import { Colors, Spacing } from '@/constants/theme';

/**
 * Splash / landing screen.
 * Plays a brief entrance animation, waits for Zustand hydration,
 * then navigates to onboarding (first launch) or the catalog.
 */
export default function SplashScreen() {
  const hasOnboarded = useUIStore((s) => s.hasOnboarded);
  const hasHydrated = useUIStore((s) => s._hasHydrated);

  // Animations
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance sequence
    Animated.sequence([
      // Logo pops in
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Title fades in
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      // Tagline fades in
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      // Loading dots appear
      Animated.timing(dotsOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;

    // Hold for a beat so the splash is visible, then fade out and navigate
    const timer = setTimeout(() => {
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        if (hasOnboarded) {
          router.replace('/(tabs)/catalog');
        } else {
          router.replace('/onboarding');
        }
      });
    }, 800);

    return () => clearTimeout(timer);
  }, [hasHydrated]);

  return (
    <Animated.View style={[styles.root, { opacity: screenOpacity }]}>
      <LinearGradient
        colors={[Colors.navyDark, Colors.navy, '#0D2A4A']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Glow */}
      <View style={styles.glowRing} />

      {/* Logo circle */}
      <Animated.View
        style={[
          styles.logoCircle,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        <Text style={styles.logoEmoji}>🌊</Text>
      </Animated.View>

      {/* App name */}
      <Animated.Text style={[styles.appName, { opacity: titleOpacity }]}>
        MediMon
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Mediterranean Sea Life Field Guide
      </Animated.Text>

      {/* Loading indicator */}
      <Animated.View style={[styles.loadingRow, { opacity: dotsOpacity }]}>
        <PulsingDot delay={0} />
        <PulsingDot delay={150} />
        <PulsingDot delay={300} />
      </Animated.View>

      {/* Bottom label */}
      <Animated.Text style={[styles.credit, { opacity: taglineOpacity }]}>
        170+ Mediterranean species
      </Animated.Text>
    </Animated.View>
  );
}

function PulsingDot({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return <Animated.View style={[styles.dot, { opacity: anim }]} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.navyDark,
    gap: Spacing.sm,
  },
  glowRing: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: Colors.ocean + '12',
    // soft outer glow via shadow
    shadowColor: Colors.biolumCyan,
    shadowOpacity: 0.25,
    shadowRadius: 80,
    shadowOffset: { width: 0, height: 0 },
  },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.navyLight,
    borderWidth: 2,
    borderColor: Colors.ocean,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    // inner glow
    shadowColor: Colors.biolumCyan,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  logoEmoji: {
    fontSize: 52,
  },
  appName: {
    color: Colors.textPrimary,
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  tagline: {
    color: Colors.textMuted,
    fontSize: 14,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  loadingRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.biolumCyan,
  },
  credit: {
    position: 'absolute',
    bottom: Spacing.xl,
    color: Colors.textMuted + '88',
    fontSize: 12,
    letterSpacing: 0.3,
  },
});
