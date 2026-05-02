import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  label: string;
  value: number;
  max?: number;
  color?: string;
}

export default function StatBar({ label, value, max = 100, color = '#4ade80' }: Props) {
  const ratio = Math.max(0, Math.min(value / max, 1));
  const barColor = ratio > 0.5 ? color : ratio > 0.25 ? '#facc15' : '#f87171';

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${ratio * 100}%` as any, backgroundColor: barColor }]} />
      </View>
      <Text style={styles.value}>{Math.round(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', marginVertical: 3 },
  label: { width: 52, color: '#9ca3af', fontSize: 12 },
  track: { flex: 1, height: 8, backgroundColor: '#1f2937', borderRadius: 4, overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: 4 },
  value: { width: 32, textAlign: 'right', color: '#e5e7eb', fontSize: 12 },
});
