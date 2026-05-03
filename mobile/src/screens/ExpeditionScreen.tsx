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
import { Theme } from '../theme';

interface Props {
  pet: Pet;
  onBack: (pet: Pet) => void;
  theme?: Theme;
}

type Phase = 'select' | 'ongoing' | 'result';

interface Result {
  events: string[];
  totals: Record<string, number>;
  zone: (typeof ZONES)[number];
}

export default function ExpeditionScreen({ pet: initialPet, onBack, theme }: Props) {
  const bg        = theme?.bg        ?? '#0d1117';
  const bgCard    = theme?.bgCard    ?? '#161b22';
  const bgPanel   = theme?.bgPanel   ?? '#1f2937';
  const accent    = theme?.accent    ?? '#7c3aed';
  const textColor = theme?.text      ?? '#e5e7eb';
  const textMuted = theme?.textMuted ?? '#9ca3af';
  const border    = theme?.border    ?? '#374151';
  const success   = theme?.success   ?? '#34d399';
  const danger    = theme?.danger    ?? '#f87171';
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
        setRemaining(status.remaining ?? 0);
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
      <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[styles.title, { color: accent }]}>🗺️  选择远征区域</Text>
          {msg ? <Text style={[styles.errText, { color: danger }]}>{msg}</Text> : null}
          {ZONES.map((z, i) => {
            const locked = pet.level < z.minLevel;
            return (
              <TouchableOpacity
                key={z.key}
                style={[styles.zoneCard, { backgroundColor: bgCard, borderColor: border, borderWidth: 1 }, locked && styles.zoneLocked]}
                onPress={() => !locked && handleSelect(z.key)}
                activeOpacity={locked ? 1 : 0.7}
              >
                <View style={styles.zoneHeader}>
                  <Text style={styles.zoneEmoji}>{z.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.zoneName, { color: locked ? textMuted : textColor }]}>{z.name}</Text>
                    <Text style={[styles.zoneDesc, { color: textMuted }]}>{z.desc}</Text>
                  </View>
                  {locked && <Text style={styles.lockIcon}>🔒</Text>}
                </View>
                <View style={styles.zoneMeta}>
                  <Text style={[styles.metaItem, { color: textMuted, backgroundColor: bgPanel }]}>⏱ {formatDuration(z.duration)}</Text>
                  <Text style={[styles.metaItem, { color: textMuted, backgroundColor: bgPanel }]}>Lv.{z.minLevel}+</Text>
                  <Text style={[styles.metaItem, { color: textMuted, backgroundColor: bgPanel }]}>风险 {z.risk}</Text>
                  <Text style={[styles.metaItem, { color: success, backgroundColor: bgPanel }]}>
                    EXP {z.expRange[0]}–{z.expRange[1]}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={styles.btnBack} onPress={() => onBack(pet)}>
            <Text style={[styles.btnBackText, { color: textMuted }]}>返回</Text>
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
      <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
        <View style={[styles.center, { backgroundColor: bg }]}>
          <Text style={styles.bigEmoji}>{zone?.emoji ?? '🗺️'}</Text>
          <Text style={[styles.title, { color: accent }]}>{pet.name} 正在远征</Text>
          <Text style={[styles.zoneBig, { color: textColor }]}>{zone?.name}</Text>
          <Text style={[styles.timeText, { color: textMuted }]}>剩余时间  {timeStr}</Text>
          {msg ? <Text style={[styles.errText, { color: danger }]}>{msg}</Text> : null}
          <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: accent }]} onPress={handleCheckReturn}>
            <Text style={styles.btnText}>检查归来</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnBack} onPress={() => onBack(pet)}>
            <Text style={[styles.btnBackText, { color: textMuted }]}>先回主页</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Result ───────────────────────────────────────────────────
  if (phase === 'result' && result) {
    const { events, totals, zone } = result;
    const statRows: { label: string; key: string }[] = [
      { label: '饱食度', key: 'hunger'    },
      { label: '快乐值', key: 'happiness' },
      { label: '精力值', key: 'energy'    },
      { label: '健康值', key: 'health'    },
    ];
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[styles.resultTitle, { color: success }]}>
            {zone.emoji} {pet.name} 从 {zone.name} 回来了！
          </Text>
          <Text style={[styles.sectionLabel, { color: accent }]}>── 远征日记 ──</Text>
          {events.map((ev: string, i: number) => (
            <Text key={i} style={[styles.eventLine, { color: textColor }]}>· {ev}</Text>
          ))}
          <Text style={[styles.sectionLabel, { color: accent }]}>── 收获 ──</Text>
          <View style={[styles.rewardBox, { backgroundColor: bgCard, borderColor: border, borderWidth: 1 }]}>
            <Text style={[styles.expGain, { color: accent }]}>经验值  +{totals.exp}</Text>
            {statRows.map(r => {
              const v = totals[r.key];
              if (!v) return null;
              return (
                <Text key={r.key} style={[styles.statGain, { color: v > 0 ? success : danger }]}>
                  {r.label}  {v > 0 ? '+' : ''}{v}
                </Text>
              );
            })}
          </View>
          <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: accent }]} onPress={() => onBack(pet)}>
            <Text style={styles.btnText}>返回主页</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  safe:         { flex: 1 },
  scroll:       { padding: 20, alignItems: 'center' },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title:        { fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  bigEmoji:     { fontSize: 56, marginBottom: 12 },
  zoneBig:      { fontSize: 22, fontWeight: '600', marginBottom: 8 },
  timeText:     { fontSize: 15, marginBottom: 24 },
  errText:      { fontSize: 14, marginBottom: 12, textAlign: 'center' },
  zoneCard:     { width: '100%', borderRadius: 12, padding: 14, marginBottom: 12 },
  zoneLocked:   { opacity: 0.45 },
  zoneHeader:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  zoneEmoji:    { fontSize: 28 },
  zoneName:     { fontSize: 16, fontWeight: '600' },
  zoneDesc:     { fontSize: 12, marginTop: 2 },
  lockIcon:     { fontSize: 18 },
  zoneMeta:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaItem:     { fontSize: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  resultTitle:  { fontSize: 17, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  sectionLabel: { fontSize: 14, fontWeight: '600', marginVertical: 10, alignSelf: 'flex-start' },
  eventLine:    { fontSize: 13, marginBottom: 6, alignSelf: 'flex-start' },
  rewardBox:    { width: '100%', borderRadius: 10, padding: 14, marginBottom: 20 },
  expGain:      { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  statGain:     { fontSize: 14, marginBottom: 4 },
  btnPrimary:   { paddingHorizontal: 32, paddingVertical: 13, borderRadius: 10, marginTop: 8 },
  btnText:      { color: '#fff', fontSize: 15, fontWeight: '600' },
  btnBack:      { marginTop: 16, paddingVertical: 8 },
  btnBackText:  { fontSize: 14 },
});
