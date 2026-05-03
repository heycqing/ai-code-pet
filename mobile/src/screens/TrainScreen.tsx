import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pet } from '../game/pet.js';
import { savePet } from '../storage/petStorage';
import { Theme } from '../theme';

interface Props {
  pet: Pet;
  theme: Theme;
  onBattle: (pet: Pet) => void;
  onExpedition: (pet: Pet) => void;
  onPetUpdate: (pet: Pet) => void;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export default function TrainScreen({ pet, theme, onBattle, onExpedition, onPetUpdate }: Props) {
  const [msg, setMsg] = useState('');

  const showMsg = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(''), 2000);
  };

  const handleMeditate = async () => {
    if (pet.isDead) { showMsg('宠物已离开'); return; }
    if (pet.energy < 10) { showMsg('精力不足！'); return; }
    pet.energy    = clamp(pet.energy    - 10, 0, 100);
    pet.bond      = clamp(pet.bond      +  3, 0, 100);
    pet.gainExp(15);
    await savePet(pet);
    onPetUpdate(new Pet(pet.toJSON()));
    showMsg(`${pet.name}静心修炼，领悟加深！`);
  };

  const handleForage = async () => {
    if (pet.isDead) { showMsg('宠物已离开'); return; }
    if (pet.energy < 15) { showMsg('精力不足！'); return; }
    pet.energy    = clamp(pet.energy    - 15, 0, 100);
    pet.coins     = (pet.coins ?? 0) + 20;
    pet.bond      = clamp(pet.bond      +  2, 0, 100);
    pet.gainExp(10);
    await savePet(pet);
    onPetUpdate(new Pet(pet.toJSON()));
    showMsg(`${pet.name}野外觅食，获得 20 灵石！`);
  };

  const canBattle = pet.energy >= 30 && !pet.isDead;
  const expeditionOngoing = !!pet.expedition;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>训练</Text>

        {msg ? (
          <View style={[styles.msgBox, { backgroundColor: theme.bgPanel, borderColor: theme.border }]}>
            <Text style={[styles.msgText, { color: theme.success }]}>{msg}</Text>
          </View>
        ) : null}

        {/* Section 1: Battle */}
        <Text style={[styles.sectionLabel, { color: theme.accent }]}>战斗训练</Text>
        <View style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>⚔️</Text>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>实战对决</Text>
              <Text style={[styles.cardDesc, { color: theme.textMuted }]}>
                与敌方数码宝贝对战，磨砺战斗技巧
              </Text>
            </View>
          </View>
          <View style={styles.tagRow}>
            <View style={[styles.tag, { backgroundColor: theme.bgPanel, borderColor: theme.border }]}>
              <Text style={[styles.tagText, { color: theme.textMuted }]}>需要精力 ≥ 30</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: theme.bgPanel, borderColor: theme.border }]}>
              <Text style={[styles.tagText, { color: theme.success }]}>EXP+</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.btn,
              { backgroundColor: canBattle ? theme.accent : theme.btnBg,
                borderColor: canBattle ? theme.accent : theme.btnBorder },
              !canBattle && styles.btnDisabled,
            ]}
            onPress={() => canBattle && onBattle(pet)}
            activeOpacity={canBattle ? 0.8 : 1}
          >
            <Text style={[styles.btnText, { color: canBattle ? '#fff' : theme.textDim }]}>
              {!pet.isDead && pet.energy < 30 ? `精力不足 (${Math.round(pet.energy)}/30)` : '出战 →'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section 2: Expedition */}
        <Text style={[styles.sectionLabel, { color: theme.accent }]}>远征探险</Text>
        <View style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🗺️</Text>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                {expeditionOngoing ? `${pet.name} 远征中...` : '远征'}
              </Text>
              <Text style={[styles.cardDesc, { color: theme.textMuted }]}>
                {expeditionOngoing
                  ? '点击查看远征状态和收益'
                  : '派遣宠物前往远方，带回丰厚战利品'}
              </Text>
            </View>
          </View>
          {expeditionOngoing && (
            <View style={[styles.tag, { backgroundColor: theme.accentSoft, borderColor: theme.accent, alignSelf: 'flex-start', marginBottom: 8 }]}>
              <Text style={[styles.tagText, { color: theme.accent }]}>进行中</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: theme.btnBg, borderColor: theme.btnBorder }]}
            onPress={() => onExpedition(pet)}
            activeOpacity={0.8}
          >
            <Text style={[styles.btnText, { color: theme.btnText }]}>
              {expeditionOngoing ? '查看状态 →' : '出发 →'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section 3: Daily activities */}
        <Text style={[styles.sectionLabel, { color: theme.accent }]}>日常修炼</Text>

        {/* Meditate */}
        <View style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🧘</Text>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>冥想</Text>
              <Text style={[styles.cardDesc, { color: theme.textMuted }]}>静心修炼，恢复心神</Text>
            </View>
          </View>
          <View style={styles.tagRow}>
            <View style={[styles.tag, { backgroundColor: theme.bgPanel, borderColor: theme.border }]}>
              <Text style={[styles.tagText, { color: theme.danger }]}>精力 -10</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: theme.bgPanel, borderColor: theme.border }]}>
              <Text style={[styles.tagText, { color: theme.success }]}>EXP +15</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: theme.bgPanel, borderColor: theme.border }]}>
              <Text style={[styles.tagText, { color: theme.success }]}>羁绊 +3</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: theme.btnBg, borderColor: theme.btnBorder }]}
            onPress={handleMeditate}
            activeOpacity={0.8}
          >
            <Text style={[styles.btnText, { color: theme.btnText }]}>修炼</Text>
          </TouchableOpacity>
        </View>

        {/* Forage */}
        <View style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🌿</Text>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>觅食</Text>
              <Text style={[styles.cardDesc, { color: theme.textMuted }]}>野外探索，获取灵石</Text>
            </View>
          </View>
          <View style={styles.tagRow}>
            <View style={[styles.tag, { backgroundColor: theme.bgPanel, borderColor: theme.border }]}>
              <Text style={[styles.tagText, { color: theme.danger }]}>精力 -15</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: theme.bgPanel, borderColor: theme.border }]}>
              <Text style={[styles.tagText, { color: theme.success }]}>EXP +10</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: theme.bgPanel, borderColor: theme.border }]}>
              <Text style={[styles.tagText, { color: theme.accent }]}>💎 +20</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: theme.btnBg, borderColor: theme.btnBorder }]}
            onPress={handleForage}
            activeOpacity={0.8}
          >
            <Text style={[styles.btnText, { color: theme.btnText }]}>出发</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1 },
  scroll:       { padding: 16, paddingBottom: 32 },
  pageTitle:    { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  msgBox:       { borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 12, alignItems: 'center' },
  msgText:      { fontSize: 14 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginTop: 8 },
  card:         { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 14 },
  cardHeader:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  cardIcon:     { fontSize: 28, marginRight: 12 },
  cardInfo:     { flex: 1 },
  cardTitle:    { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  cardDesc:     { fontSize: 13 },
  tagRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  tag:          { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  tagText:      { fontSize: 11, fontWeight: '500' },
  btn:          { borderRadius: 10, borderWidth: 1, paddingVertical: 10, alignItems: 'center' },
  btnDisabled:  { opacity: 0.5 },
  btnText:      { fontSize: 14, fontWeight: '600' },
});
