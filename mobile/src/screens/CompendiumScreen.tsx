import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pet } from '../game/pet.js';
import { DIGIMON, STAGE_LABELS } from '../game/ascii.js';
import { Theme } from '../theme';
import PetSprite from '../components/PetSprite';

interface Props {
  pet: Pet;
  theme: Theme;
}

const TYPES = Object.keys(DIGIMON) as string[];

export default function CompendiumScreen({ pet, theme }: Props) {
  const [selectedType, setSelectedType] = useState<string>(pet.type);

  const info = (DIGIMON as Record<string, any>)[selectedType];
  const stages: any[] = info?.stages ?? [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>图鉴</Text>

        {/* Type tab switcher */}
        <View style={[styles.tabBar, { backgroundColor: theme.bgPanel, borderColor: theme.border }]}>
          {TYPES.map(type => {
            const d = (DIGIMON as Record<string, any>)[type];
            const active = type === selectedType;
            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeTab,
                  active && { backgroundColor: theme.bgCard, borderColor: theme.accent, borderWidth: 1 },
                ]}
                onPress={() => setSelectedType(type)}
              >
                <Text style={styles.typeEmoji}>{d.emoji}</Text>
                <Text style={[styles.typeLabel, { color: active ? theme.accent : theme.textMuted }]}>
                  {d.chineseName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Description */}
        <View style={[styles.descCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          <Text style={[styles.typeName, { color: theme.accent }]}>
            {info?.emoji}  {info?.chineseName}
          </Text>
          <Text style={[styles.typeDesc, { color: theme.textMuted }]}>{info?.description}</Text>
        </View>

        {/* Evolution stages horizontal scroll */}
        <Text style={[styles.sectionLabel, { color: theme.accent }]}>进化路线</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stagesRow}
        >
          {stages.map((stage: any, i: number) => {
            const isOwned = selectedType === pet.type && i <= pet.stageIndex;
            return (
              <View
                key={i}
                style={[
                  styles.stageCell,
                  { backgroundColor: theme.bgCard, borderColor: isOwned ? theme.accent : theme.border },
                  !isOwned && styles.stageLockedCell,
                ]}
              >
                <View style={[styles.spriteWrap, { backgroundColor: theme.bgPanel }]}>
                  <PetSprite type={selectedType} stageIndex={i} state="idle" pixelSize={3} />
                </View>
                <Text style={[styles.stageLabelText, { color: isOwned ? theme.accent : theme.textDim }]}>
                  {(STAGE_LABELS as string[])[i]}
                </Text>
                <Text style={[styles.stageNameText, { color: isOwned ? theme.text : theme.textDim }]}>
                  {stage.chineseName}
                </Text>
                <Text style={[styles.stageEnName, { color: theme.textMuted }]}>{stage.name}</Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Battle stats for current stage of selected type */}
        <Text style={[styles.sectionLabel, { color: theme.accent }]}>当前形态战斗参数</Text>
        {(() => {
          const stageIdx = selectedType === pet.type ? pet.stageIndex : 0;
          const bs = stages[stageIdx]?.battleStats;
          if (!bs) return null;
          const rows: [string, number][] = [
            ['HP', bs.hp],
            ['攻击', bs.attack],
            ['防御', bs.defense],
            ['速度', bs.speed],
            ['特攻威力', bs.specialPower],
          ];
          return (
            <View style={[styles.statsCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
              <Text style={[styles.specialName, { color: theme.special }]}>
                特技：{bs.special}
              </Text>
              <View style={styles.statsGrid}>
                {rows.map(([label, val]) => (
                  <View key={label} style={[styles.statItem, { borderColor: theme.border }]}>
                    <Text style={[styles.statItemLabel, { color: theme.textMuted }]}>{label}</Text>
                    <Text style={[styles.statItemValue, { color: theme.text }]}>{val}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1 },
  scroll:         { padding: 16, paddingBottom: 32 },
  pageTitle:      { fontSize: 20, fontWeight: 'bold', marginBottom: 14 },
  tabBar:         { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 4, marginBottom: 14, gap: 4 },
  typeTab:        { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
  typeEmoji:      { fontSize: 20 },
  typeLabel:      { fontSize: 11, marginTop: 3, fontWeight: '500' },
  descCard:       { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 16 },
  typeName:       { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  typeDesc:       { fontSize: 14 },
  sectionLabel:   { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, marginTop: 4 },
  stagesRow:      { gap: 10, paddingBottom: 4, paddingRight: 16 },
  stageCell:      { width: 100, borderRadius: 12, borderWidth: 1, padding: 8, alignItems: 'center' },
  stageLockedCell:{ opacity: 0.45 },
  spriteWrap:     { borderRadius: 8, padding: 6, marginBottom: 6, overflow: 'hidden' },
  stageLabelText: { fontSize: 10, fontWeight: '700', marginBottom: 2, textAlign: 'center' },
  stageNameText:  { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  stageEnName:    { fontSize: 10, textAlign: 'center', marginTop: 2 },
  statsCard:      { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 16 },
  specialName:    { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  statsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statItem:       { width: '45%', borderBottomWidth: 1, paddingVertical: 6, flexDirection: 'row', justifyContent: 'space-between' },
  statItemLabel:  { fontSize: 12 },
  statItemValue:  { fontSize: 13, fontWeight: '600' },
});
