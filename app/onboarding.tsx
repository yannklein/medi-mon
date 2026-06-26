import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useUIStore } from '@/stores/uiStore';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';

// const { width } = Dimensions.get('window');

const SLIDES = [
  {
    emoji: '🐙',
    title: 'Discover the Mediterranean',
    body: 'Browse a catalog of marine species found in the Mediterranean Sea — from octopus to sea turtles.',
    color: Colors.ocean,
  },
  {
    emoji: '🤿',
    title: 'Log Every Dive',
    body: 'Record your dives with depth, conditions, and all the creatures you encountered.',
    color: '#7B2FBE',
  },
  {
    emoji: '🌊',
    title: 'Build Your Ocean',
    body: "Track which species you've spotted and grow your personal field guide over time.",
    color: '#00897B',
  },
];

export default function OnboardingScreen() {
  const [slide, setSlide] = useState(0);
  const setHasOnboarded = useUIStore((s) => s.setHasOnboarded);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const isLast = slide === SLIDES.length - 1;
  const current = SLIDES[slide];

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.spring(fadeAnim, { toValue: 1, useNativeDriver: true }).start();
  }, [slide]);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isLast) {
      setHasOnboarded(true);
      router.replace('/(tabs)/catalog');
    } else {
      setSlide((s) => s + 1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[current.color + '33', Colors.navy]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.emoji}>{current.emoji}</Text>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.body}>{current.body}</Text>
      </Animated.View>

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === slide && styles.dotActive]}
          />
        ))}
      </View>

      {/* CTA */}
      <View style={styles.footer}>
        <Pressable style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextText}>{isLast ? 'Get Started →' : 'Next →'}</Text>
        </Pressable>
        {!isLast && (
          <Pressable onPress={() => { setHasOnboarded(true); router.replace('/(tabs)/catalog'); }}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  emoji: {
    fontSize: 80,
    marginBottom: Spacing.md,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 34,
  },
  body: {
    color: Colors.textMuted,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.navyLight,
  },
  dotActive: {
    backgroundColor: Colors.biolumCyan,
    width: 24,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  nextBtn: {
    width: '100%',
    backgroundColor: Colors.ocean,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  nextText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  skipText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
});
