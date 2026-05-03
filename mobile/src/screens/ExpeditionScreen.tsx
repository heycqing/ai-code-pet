import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pet } from '../game/pet.js';
import { savePet } from '../storage/petStorage';
import {
  ZONES,
  startExpedition,
  checkExpedition,
  applyExpeditionResult,
  formatDuration,
} from '../game/expedition.js';

interface Props {
  pet: Pet;
  onBack: (pet: Pet) => void;
}

type Phase = 'select' | 'ongoing' | 'result';

interface Result {
  events: string[];
  totals: Record<string, number>;
  zone: (typeof ZONES)[number];
}

export default function ExpeditionScreen({ pet: initialPet, onBack }: Props) {
  const [pet]       = useState(() => new Pet(initialPet.toJSON()));
  const [phase, setPhase] = useState<Phase>(() => (initialPet.expedition ? 'ongoing' : 'select'));
  const [remaining, setRemaining] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [msg, setMsg] = useState('');

  // Tick remaining time while ongoing
  useEffect(() => {
    if (phase !== 'ongoing') return;
    const tick = () => {
      const status = checkExpedition(pet);
      if (!status) { setPhase('select'); return; }
      if (!status.ongoing) {
        const gain = applyExpeditionResult(pet, status.result);
        savePet(pet);
        setResult(status.result as Result);
        setPhase('result');
      } else {
        setRemaining(status.remaining);
      }
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [phase]);

  const handleSelect = (zoneKey: string) => {
    const res = startExpedition(pet, zoneKey);
    if (!res.success) { setMsg(res.msg); return; }
    savePet(pet);
    setMsg('');
    setPhase('ongoing');
  };

  const handleCheckReturn = () => {
    const status = checkExpedition(pet);
    if (!status) { onBack(pet); return; }
    if (!status.ongoing) {
      applyExpeditionResult(pet, status.result);
      savePet(pet);
      setResult(status.result as Result);
      setPhase('result');
    } else {
      setMsg(`${pet.name}还没回来呢，再等等！`);
    }
  };

  // ── Zone selection ──────────────────────────────────────────
  if (phase === 'select') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>🗺️  选择远征区域</Text>
          {msg ? <Text style={styles.errText}>{msg}</Text> : null}
          {ZONES.map((z, i) => {
            const locked = pet.level < z.minLevel;
            return (
              <TouchableOpacity
                key={z.key}
                style={[styles.zoneCard, locked && styles.zoneLocked]}
                onPress={() => !locked && handleSelect(z.key)}
                activeOpacity={locked ? 1 : 0.7}
              >
                <View style={styles.zoneHeader}>
                  <Text style={styles.zoneEmoji}>{z.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.zoneName, locked && styles.dimText]}>{z.name}</Text>
                    <Text style={styles.zoneDesc}>{z.desc}</Text>
                  </View>
                  {locked && <Text style={styles.lockIcon}>🔒</Text>}
                </View>
                <View style={styles.zoneMeta}>
                  <Text style={styles.metaItem}>⏱ {formatDuration(z.duration)}</Text>
                  <Text style={styles.metaItem}>Lv.{z.minLevel}+</Text>
                  <Text style={styles.metaItem}>风险 {z.risk}</Text>
                  <Text style={[styles.metaItem, styles.expText]}>
                    EXP {z.expRange[0]}–{z.expRange[1]}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={styles.btnBack} onPress={() => onBack(pet)}>
            <Text style={styles.btnBackText}>返回</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Ongoing ─────────────────────────────────────────────────
  if (phase === 'ongoing') {
    const zone = ZONES.find(z => z.key === pet.expedition?.zone);
    const timeStr = remaining > 0 ? formatDuration(remaining) : '即将归来...';
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.bigEmoji}>{zone?.emoji ?? '🗺️'}</Text>
          <Text style={styles.title}>{pet.name} 正在远征</Text>
          <Text style={styles.zoneBig}>{zone?.name}</Text>
          <Text style={styles.timeText}>剩余时间  {timeStr}</Text>
          {msg ? <Text style={styles.errText}>{msg}</Text> : null}
          <TouchableOpacity style={styles.btnPrimary} onPress={handleCheckReturn}>
            <Text style={styles.btnText}>检查归来</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnBack} onPress={() => onBack(pet)}>
            <Text style={styles.btnBackText}>先回主页</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Result ───────────────────────────────────────────────────
  if (phase === 'result' && result) {
    const { events, totals, zone } = result;
    const statRows: { label: string; key: string; color: string }[] = [
      { label: '饱食度', key: 'hunger',    color: '#f87171' },
      { label: '快乐值', key: 'happiness', color: '#818cf8' },
      { label: '精力值', key: 'energy',    color: '#34d399' },
      { label: '健康值', key: 'health',    color: '#60a5fa' },
    ];
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.resultTitle}>
            {zone.emoji} {pet.name} 从 {zone.name} 回来了！
          </Text>
          <Text style={styles.sectionLabel}>── 远征日记 ──</Text>
          {events.map((ev, i) => (
            <Text key={i} style={styles.eventLine}>· {ev}</Text>
          ))}
          <Text style={styles.sectionLabel}>── 收获 ──</Text>
          <View style={styles.rewardBox}>
            <Text style={styles.expGain}>经验值  +{totals.exp}</Text>
            {statRows.map(r => {
              const v = totals[r.key];
              if (!v) return null;
              return (
                <Text key={r.key} style={[styles.statGain, { color: v > 0 ? '#34d399' : '#f87171' }]}>
                  {r.label}  {v > 0 ? '+' : ''}{v}
                </Text>
              );
            })}
          </View>
          <TouchableOpacity style={styles.btnPrimary} onPress={() => onBack(pet)}>
            <Text style={styles.btnText}>返回主页</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#0d1117' },
  scroll:       { padding: 20, alignItems: 'center' },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#0d1117' },
  title:        { fontSize: 18, fontWeight: 'bold', color: '#fbbf24', marginBottom: 12, textAlign: 'center' },
  bigEmoji:     { fontSize: 56, marginBottom: 12 },
  zoneBig:      { fontSize: 22, color: '#e5e7eb', fontWeight: '600', marginBottom: 8 },
  timeText:     { fontSize: 15, color: '#9ca3af', marginBottom: 24 },
  errText:      { color: '#f87171', fontSize: 14, marginBottom: 12, textAlign: 'center' },
  zoneCard:     { width: '100%', backgroundColor: '#161b22', borderRadius: 12, padding: 14, marginBottom: 12 },
  zoneLocked:   { opacity: 0.45 },
  zoneHeader:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  zoneEmoji:    { fontSize: 28 },
  zoneName:     { fontSize: 16, color: '#e5e7eb', fontWeight: '600' },
  zoneDesc:     { fontSize: 12, color: '#6b7280', marginTop: 2 },
  dimText:      { color: '#4b5563' },
  lockIcon:     { fontSize: 18 },
  zoneMeta:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaItem:     { fontSize: 12, color: '#9ca3af', backgroundColor: '#1f2937', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  expText:      { color: '#34d399' },
  resultTitle:  { fontSize: 17, fontWeight: 'bold', color: '#34d399', marginBottom: 16, textAlign: 'center' },
  sectionLabel: { color: '#fbbf24', fontSize: 14, fontWeight: '600', marginVertical: 10, alignSelf: 'flex-start' },
  eventLine:    { color: '#d1d5db', fontSize: 13, marginBottom: 6, alignSelf: 'flex-start' },
  rewardBox:    { width: '100%', backgroundColor: '#161b22', borderRadius: 10, padding: 14, marginBottom: 20 },
  expGain:      { color: '#fbbf24', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  statGain:     { fontSize: 14, marginBottom: 4 },
  btnPrimary:   { backgroundColor: '#7c3aed', paddingHorizontal: 32, paddingVertical: 13, borderRadius: 10, marginTop: 8 },
  btnText:      { color: '#fff', fontSize: 15, fontWeight: '600' },
  btnBack:      { marginTop: 16, paddingVertical: 8 },
  btnBackText:  { color: '#6b7280', fontSize: 14 },
});
