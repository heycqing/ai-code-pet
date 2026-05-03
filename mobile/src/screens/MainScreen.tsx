import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pet } from '../game/pet.js';
import { savePet } from '../storage/petStorage';
import { Theme } from '../theme';
import PetSprite from '../components/PetSprite';
import StatBar from '../components/StatBar';

interface Props {
  pet: Pet | null;
  theme: Theme;
  onPetUpdate: (pet: Pet) => void;
  onBattle: (pet: Pet) => void;
  onExpedition: (pet: Pet) => void;
  onAdopt: () => void;
}

const MOOD_EMOJI: Record<string, string> = {
  idle:     '😌',
  happy:    '😄',
  hungry:   '😤',
  sick:     '🤒',
  sad:      '😔',
  sleeping: '😴',
  dead:     '💀',
};

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  const parts = ['清晨', '上午', '午后', '傍晚', '深夜'];
  return parts[Math.floor((hour / 24) * 5)];
}

export default function MainScreen({ pet, theme, onPetUpdate, onBattle, onExpedition, onAdopt }: Props) {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [floatAnim]);

  if (!pet) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
        <View style={styles.center}>
          <Text style={[styles.deadTitle, { color: theme.textMuted }]}>还没有宠物</Text>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.btnBg, borderColor: theme.btnBorder }]}
            onPress={onAdopt}
          >
            <Text style={[styles.actionBtnText, { color: theme.accent }]}>领养宠物</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const state = pet.getState();
  const moodEmoji = MOOD_EMOJI[state] ?? '😌';
  const timeOfDay = getTimeOfDay();
  const fullness = 100 - pet.hunger;
  const expNeeded = pet.level * 50;
  const evoPercent = Math.min(100, Math.round((pet.exp / expNeeded) * 100));

  const moodBubble = state === 'sleeping' ? '💤' : pet.hunger >= 80 ? '❓' : null;

  const isSleeping = state === 'sleeping';

  const handleAction = async (action: 'play' | 'heal' | 'clean' | 'sleep') => {
    let result: { success: boolean; msg: string };
    if (action === 'play')       result = pet.play();
    else if (action === 'heal')  result = pet.heal();
    else if (action === 'sleep') result = pet.sleep();
    else                         result = pet.clean();

    if (result.success) {
      await savePet(pet);
      onPetUpdate(new Pet(pet.toJSON()));
    }
  };

  if (pet.isDead) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
        <View style={styles.center}>
          <Text style={{ fontSize: 64 }}>💀</Text>
          <Text style={[styles.deadTitle, { color: theme.textMuted }]}>已离开</Text>
          <Text style={[styles.deadSub, { color: theme.textDim }]}>{pet.name} 已经离开了...</Text>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.btnBg, borderColor: theme.btnBorder, marginTop: 24 }]}
            onPress={onAdopt}
          >
            <Text style={[styles.actionBtnText, { color: theme.accent }]}>重新领养</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const stats = [
    { label: '饱食度', value: fullness,       key: 'fullness'  },
    { label: '心情',   value: pet.happiness,  key: 'happiness' },
    { label: '健康',   value: pet.health,     key: 'health'    },
    { label: '精力',   value: pet.energy,     key: 'energy'    },
    { label: '羁绊',   value: pet.bond,       key: 'bond'      },
    { label: '进化',   value: evoPercent,     key: 'evo'       },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Top info bar */}
        <View style={[styles.infoBar, { borderBottomColor: theme.border }]}>
          <View style={styles.infoLeft}>
            <Text style={[styles.petName, { color: theme.text }]}>{pet.name}</Text>
            <Text style={[styles.petMeta, { color: theme.textMuted }]}>
              {pet.petInfo?.chineseName ?? pet.type} · {pet.stageName} · Lv.{pet.level}
            </Text>
          </View>
          <View style={styles.infoRight}>
            <Text style={styles.moodEmoji}>{moodEmoji}</Text>
            <Text style={[styles.timeOfDay, { color: theme.textMuted }]}>{timeOfDay}</Text>
          </View>
        </View>

        {/* Sprite area */}
        <View style={[styles.spriteArea, { backgroundColor: theme.bgPanel, borderColor: theme.border }]}>
          {moodBubble && (
            <View style={[styles.moodBubble, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
              <Text style={styles.moodBubbleText}>{moodBubble}</Text>
            </View>
          )}
          <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
            <PetSprite type={pet.type} stageIndex={pet.stageIndex} state={state as any} pixelSize={7} />
          </Animated.View>
          {/* shadow */}
          <View style={[styles.spriteShadow, { backgroundColor: theme.accent + '20' }]} />
        </View>

        {/* Stats panel */}
        <View style={[styles.statsPanel, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.accent }]}>属性</Text>
          <View style={styles.statsGrid}>
            {stats.map(s => (
              <View key={s.key} style={styles.statCell}>
                <StatBar
                  label={s.label}
                  value={s.value}
                  color={theme.statFill}
                  bgColor={theme.statBg}
                  labelColor={theme.textMuted}
                  valueColor={theme.text}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.btnBg, borderColor: theme.btnBorder }, isSleeping && styles.btnDisabled]}
            onPress={() => !isSleeping && handleAction('play')}
            activeOpacity={isSleeping ? 1 : 0.7}
          >
            <Text style={styles.actionIcon}>🎮</Text>
            <Text style={[styles.actionBtnText, { color: theme.btnText }]}>玩耍</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.btnBg, borderColor: theme.btnBorder }, isSleeping && styles.btnDisabled]}
            onPress={() => !isSleeping && handleAction('heal')}
            activeOpacity={isSleeping ? 1 : 0.7}
          >
            <Text style={styles.actionIcon}>💊</Text>
            <Text style={[styles.actionBtnText, { color: theme.btnText }]}>治疗</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.btnBg, borderColor: theme.btnBorder }, isSleeping && styles.btnDisabled]}
            onPress={() => !isSleeping && handleAction('clean')}
            activeOpacity={isSleeping ? 1 : 0.7}
          >
            <Text style={styles.actionIcon}>🛁</Text>
            <Text style={[styles.actionBtnText, { color: theme.btnText }]}>清洁</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.btnBg, borderColor: theme.btnBorder }, pet.energy >= 90 && styles.btnDisabled]}
            onPress={() => pet.energy < 90 && handleAction('sleep')}
            activeOpacity={pet.energy >= 90 ? 1 : 0.7}
          >
            <Text style={styles.actionIcon}>💤</Text>
            <Text style={[styles.actionBtnText, { color: theme.btnText }]}>睡觉</Text>
          </TouchableOpacity>
        </View>

        {/* Mood text */}
        <Text style={[styles.moodText, { color: theme.textMuted }]}>{pet.getMood()}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1 },
  scroll:        { padding: 16, paddingBottom: 32 },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  infoBar:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1 },
  infoLeft:      { flex: 1 },
  infoRight:     { alignItems: 'flex-end' },
  petName:       { fontSize: 22, fontWeight: 'bold', letterSpacing: 0.5 },
  petMeta:       { fontSize: 13, marginTop: 3 },
  moodEmoji:     { fontSize: 26 },
  timeOfDay:     { fontSize: 12, marginTop: 2 },
  spriteArea:    { alignItems: 'center', justifyContent: 'center', borderRadius: 16, borderWidth: 1, paddingVertical: 28, marginBottom: 16, position: 'relative', overflow: 'hidden' },
  moodBubble:    { position: 'absolute', top: 12, right: 16, borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, zIndex: 2 },
  moodBubbleText:{ fontSize: 16 },
  spriteShadow:  { width: 80, height: 10, borderRadius: 40, marginTop: 8 },
  statsPanel:    { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 16 },
  sectionTitle:  { fontSize: 13, fontWeight: '700', letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' },
  statsGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 0 },
  statCell:      { width: '50%', paddingRight: 8 },
  actionsRow:    { flexDirection: 'row', gap: 8, marginBottom: 12 },
  actionBtn:     { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  btnDisabled:   { opacity: 0.3 },
  actionIcon:    { fontSize: 22, marginBottom: 4 },
  actionBtnText: { fontSize: 13, fontWeight: '600' },
  moodText:      { textAlign: 'center', fontSize: 13, marginTop: 4 },
  deadTitle:     { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  deadSub:       { fontSize: 14, marginBottom: 8 },
});
