import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  label: string;
  value: number;
  max?: number;
  color?: string;
  bgColor?: string;
  labelColor?: string;
  valueColor?: string;
}

export default function StatBar({
  label,
  value,
  max = 100,
  color = '#4ade80',
  bgColor = '#1f2937',
  labelColor = '#9ca3af',
  valueColor = '#e5e7eb',
}: Props) {
  const ratio = Math.max(0, Math.min(value / max, 1));
  const barColor = ratio > 0.5 ? color : ratio > 0.25 ? '#facc15' : '#f87171';

  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      <View style={[styles.track, { backgroundColor: bgColor }]}>
        <View style={[styles.fill, { width: `${ratio * 100}%` as any, backgroundColor: barColor }]} />
      </View>
      <Text style={[styles.value, { color: valueColor }]}>{Math.round(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', marginVertical: 3 },
  label: { width: 52, fontSize: 12 },
  track: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: 4 },
  value: { width: 32, textAlign: 'right', fontSize: 12 },
});
