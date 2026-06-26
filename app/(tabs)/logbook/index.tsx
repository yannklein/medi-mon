import React from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useLogbookStore } from '@/stores/logbookStore';
import { DiveCard } from '@/components/logbook/DiveCard';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';
import type { DiveRecord } from '@/types/dive';

export default function LogbookScreen() {
  const dives = useLogbookStore((s) => s.dives);
  const getSightingsForDive = useLogbookStore((s) => s.getSightingsForDive);

  const sorted = [...dives].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleLogDive = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/modals/log-dive');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Logbook</Text>
          <Text style={styles.subtitle}>{dives.length} dive{dives.length !== 1 ? 's' : ''} recorded</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={handleLogDive}>
          <Text style={styles.addBtnText}>+ Log Dive</Text>
        </Pressable>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }: { item: DiveRecord }) => (
          <DiveCard
            dive={item}
            sightingCount={getSightingsForDive(item.id).length}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🤿</Text>
            <Text style={styles.emptyTitle}>No dives yet</Text>
            <Text style={styles.emptySubtitle}>Log your first dive to get started.</Text>
            <Pressable style={styles.emptyBtn} onPress={handleLogDive}>
              <Text style={styles.emptyBtnText}>Log a Dive</Text>
            </Pressable>
          </View>
        }
      />

      {/* FAB */}
      {dives.length > 0 && (
        <Pressable style={styles.fab} onPress={handleLogDive}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  addBtn: {
    backgroundColor: Colors.ocean,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  addBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  list: {
    paddingTop: Spacing.xs,
    paddingBottom: 100,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.sm },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  emptyBtn: {
    backgroundColor: Colors.ocean,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.sm,
  },
  emptyBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.ocean,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.biolumCyan,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  fabText: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
  },
});
