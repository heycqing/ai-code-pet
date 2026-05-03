import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pet } from '../game/pet.js';
import { DIGIMON, STAGE_LABELS } from '../game/ascii.js';
import { Theme } from '../theme';
import PetSprite from '../components/PetSprite';

interface Props {
  pet: Pet;
  theme: Theme;
}

const STAGE_REQS = [
  '年龄 < 2分钟',
  'Lv.1–2',
  'Lv.3–5',
  'Lv.6–10',
  'Lv.11–17',
  'Lv.18+',
];

export default function EvolveScreen({ pet, theme }: Props) {
  const currentStage = pet.stageIndex;
  const expNeeded = pet.level * 50;
  const evoPercent = Math.min(100, Math.round((pet.exp / expNeeded) * 100));
  const digimon = (DIGIMON as Record<string, any>)[pet.type];
  const stages: any[] = digimon?.stages ?? [];

  const totalAgeStr = pet.getAgeString();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>进化路线</Text>

        {/* Battle record + age */}
        <View style={[styles.infoRow, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          <View style={styles.infoCell}>
            <Text style={[styles.infoValue, { color: theme.accent }]}>{pet.wins}</Text>
            <Text style={[styles.infoLabel, { color: theme.textMuted }]}>胜场</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.infoCell}>
            <Text style={[styles.infoValue, { color: theme.danger }]}>{pet.losses}</Text>
            <Text style={[styles.infoLabel, { color: theme.textMuted }]}>败场</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.infoCell}>
            <Text style={[styles.infoValue, { color: theme.text }]}>{totalAgeStr}</Text>
            <Text style={[styles.infoLabel, { color: theme.textMuted }]}>年龄</Text>
          </View>
        </View>

        {/* Stage list */}
        {stages.map((stage: any, i: number) => {
          const isCurrent = i === currentStage;
          const isUnlocked = i <= currentStage;
          return (
            <View
              key={i}
              style={[
                styles.stageCard,
                { backgroundColor: theme.bgCard, borderColor: isCurrent ? theme.accent : theme.border },
                !isUnlocked && styles.lockedCard,
              ]}
            >
              <View style={styles.stageRow}>
                {/* Sprite */}
                <View style={[styles.spriteBox, { backgroundColor: theme.bgPanel, borderColor: theme.border, opacity: isUnlocked ? 1 : 0.35 }]}>
                  <PetSprite type={pet.type} stageIndex={i} state="idle" pixelSize={3} />
                </View>

                {/* Info */}
                <View style={styles.stageInfo}>
                  <View style={styles.stageLabelRow}>
                    <Text style={[styles.stageLabel, { color: isUnlocked ? theme.accent : theme.textDim }]}>
                      {(STAGE_LABELS as string[])[i]}
                    </Text>
                    {isCurrent && (
                      <View style={[styles.currentBadge, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
                        <Text style={[styles.currentBadgeText, { color: theme.accent }]}>当前</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.stageName, { color: isUnlocked ? theme.text : theme.textDim }]}>
                    {stage.chineseName}  ·  {stage.name}
                  </Text>
                  <Text style={[styles.stageReq, { color: theme.textMuted }]}>
                    解锁条件：{STAGE_REQS[i]}
                  </Text>

                  {isCurrent && (
                    <View style={styles.evoProgressRow}>
                      <Text style={[styles.evoProgressLabel, { color: theme.textMuted }]}>
                        进化进度 {evoPercent}%
                      </Text>
                      <View style={[styles.evoTrack, { backgroundColor: theme.statBg }]}>
                        <View style={[styles.evoFill, { width: `${evoPercent}%` as any, backgroundColor: theme.statFill }]} />
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1 },
  scroll:           { padding: 16, paddingBottom: 32 },
  pageTitle:        { fontSize: 20, fontWeight: 'bold', marginBottom: 14 },
  infoRow:          { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16, alignItems: 'center' },
  infoCell:         { flex: 1, alignItems: 'center' },
  infoValue:        { fontSize: 20, fontWeight: 'bold' },
  infoLabel:        { fontSize: 12, marginTop: 2 },
  divider:          { width: 1, height: 32 },
  stageCard:        { borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 10 },
  lockedCard:       { opacity: 0.5 },
  stageRow:         { flexDirection: 'row', alignItems: 'center' },
  spriteBox:        { borderRadius: 10, borderWidth: 1, padding: 6, marginRight: 12, overflow: 'hidden' },
  stageInfo:        { flex: 1 },
  stageLabelRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  stageLabel:       { fontSize: 13, fontWeight: '700' },
  currentBadge:     { borderRadius: 6, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 1 },
  currentBadgeText: { fontSize: 10, fontWeight: '600' },
  stageName:        { fontSize: 14, fontWeight: '600', marginBottom: 3 },
  stageReq:         { fontSize: 11, marginBottom: 6 },
  evoProgressRow:   { marginTop: 4 },
  evoProgressLabel: { fontSize: 11, marginBottom: 3 },
  evoTrack:         { height: 6, borderRadius: 3, overflow: 'hidden', width: '100%' },
  evoFill:          { height: '100%', borderRadius: 3 },
});
