import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pet } from '../game/pet.js';
import { loadPet, savePet } from '../storage/petStorage';
import PetSprite from '../components/PetSprite';
import StatBar from '../components/StatBar';

interface Props {
  onAdopt: () => void;
  onBattle: (pet: Pet) => void;
}

const FOOD_TYPES = [
  { key: 'normal', label: '普通餐' },
  { key: 'meat',   label: '肉类' },
  { key: 'snack',  label: '零食' },
  { key: 'veggie', label: '蔬菜' },
];

export default function HomeScreen({ onAdopt, onBattle }: Props) {
  const [pet, setPet]         = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showFeed, setShowFeed] = useState(false);

  const flash = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const refresh = useCallback(async () => {
    try {
      const p = await loadPet();
      if (!p) { setLoading(false); return; }
      p.applyTimeDecay();
      await savePet(p);
      setPet(new Pet(p.toJSON()));
    } catch (e) {
      console.warn('refresh error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 10_000);
    return () => clearInterval(timer);
  }, [refresh]);

  const act = async (fn: () => { success: boolean; msg: string }) => {
    if (!pet) return;
    const result = fn();
    flash(result.msg);
    await savePet(pet);
    setPet(new Pet(pet.toJSON()));
  };

  const handleFeed = (foodType: string) => {
    setShowFeed(false);
    act(() => pet!.feed(foodType));
  };

  const handleDelete = () => {
    Alert.alert('确认', '确定要放走这只宠物吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '放走', style: 'destructive',
        onPress: async () => { setPet(null); onAdopt(); },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color="#7c3aed" size="large" />
      </SafeAreaView>
    );
  }

  if (!pet) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emptyText}>还没有宠物</Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={onAdopt}>
          <Text style={styles.btnText}>领养一只</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const stageInfo = pet.stageInfo;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.petName}>{pet.name}</Text>
          <Text style={styles.stageBadge}>{pet.stageName} · Lv.{pet.level}</Text>
        </View>

        {/* Sprite */}
        <View style={styles.spriteWrap}>
          <PetSprite type={pet.type} stageIndex={pet.stageIndex} state={pet.getState() as any} />
        </View>

        {/* Stage name */}
        <Text style={styles.digiName}>{stageInfo?.chineseName ?? ''}</Text>
        <Text style={styles.mood}>{pet.getMood()}</Text>

        {/* Flash message */}
        {message ? <Text style={styles.flash}>{message}</Text> : null}

        {/* Stats */}
        <View style={styles.statsBox}>
          <StatBar label="饥饿" value={pet.hunger}    color="#f87171" />
          <StatBar label="快乐" value={pet.happiness} color="#818cf8" />
          <StatBar label="精力" value={pet.energy}    color="#34d399" />
          <StatBar label="健康" value={pet.health}    color="#60a5fa" />
          <View style={styles.expRow}>
            <Text style={styles.expLabel}>EXP</Text>
            <Text style={styles.expValue}>{pet.exp} / {pet.level * 50}</Text>
          </View>
        </View>

        {/* Actions */}
        {pet.isDead ? (
          <View style={styles.deadBox}>
            <Text style={styles.deadText}>宠物已离开...</Text>
            <TouchableOpacity style={styles.btnPrimary} onPress={handleDelete}>
              <Text style={styles.btnText}>重新领养</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {showFeed ? (
              <View style={styles.subMenu}>
                <Text style={styles.subTitle}>选择食物</Text>
                <View style={styles.grid2}>
                  {FOOD_TYPES.map(f => (
                    <TouchableOpacity key={f.key} style={styles.btnSecondary} onPress={() => handleFeed(f.key)}>
                      <Text style={styles.btnTextSm}>{f.label}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={[styles.btnSecondary, styles.btnCancel]} onPress={() => setShowFeed(false)}>
                    <Text style={styles.btnTextSm}>取消</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.grid2}>
                <TouchableOpacity style={styles.btnAction} onPress={() => setShowFeed(true)}>
                  <Text style={styles.btnEmoji}>🍖</Text>
                  <Text style={styles.btnLabel}>喂食</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnAction} onPress={() => act(() => pet.play())}>
                  <Text style={styles.btnEmoji}>🎮</Text>
                  <Text style={styles.btnLabel}>玩耍</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnAction} onPress={() => act(() => pet.sleep())}>
                  <Text style={styles.btnEmoji}>💤</Text>
                  <Text style={styles.btnLabel}>睡觉</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnAction} onPress={() => act(() => pet.heal())}>
                  <Text style={styles.btnEmoji}>💊</Text>
                  <Text style={styles.btnLabel}>治疗</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnAction} onPress={() => act(() => pet.clean())}>
                  <Text style={styles.btnEmoji}>🛁</Text>
                  <Text style={styles.btnLabel}>洗澡</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnAction} onPress={() => onBattle(pet)}>
                  <Text style={styles.btnEmoji}>⚔️</Text>
                  <Text style={styles.btnLabel}>战斗</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity style={styles.btnDanger} onPress={handleDelete}>
              <Text style={styles.btnTextSm}>放走宠物</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: '#0d1117' },
  scroll:     { padding: 20, alignItems: 'center' },
  center:     { flex: 1, backgroundColor: '#0d1117', alignItems: 'center', justifyContent: 'center' },
  header:     { alignItems: 'center', marginBottom: 8 },
  petName:    { fontSize: 24, fontWeight: 'bold', color: '#e5e7eb' },
  stageBadge: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  spriteWrap: { marginVertical: 16, borderRadius: 8, overflow: 'hidden' },
  digiName:   { fontSize: 14, color: '#a78bfa', marginTop: 4 },
  mood:       { fontSize: 13, color: '#9ca3af', marginBottom: 8 },
  flash:      { fontSize: 14, color: '#fbbf24', marginVertical: 8, textAlign: 'center' },
  statsBox:   { width: '100%', backgroundColor: '#161b22', borderRadius: 12, padding: 16, marginBottom: 20 },
  expRow:     { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  expLabel:   { color: '#9ca3af', fontSize: 12 },
  expValue:   { color: '#e5e7eb', fontSize: 12 },
  grid2:      { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, width: '100%' },
  btnAction:  { width: 90, height: 80, backgroundColor: '#1f2937', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnEmoji:   { fontSize: 28 },
  btnLabel:   { color: '#d1d5db', fontSize: 12, marginTop: 4 },
  btnPrimary: { backgroundColor: '#7c3aed', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10, marginTop: 16 },
  btnSecondary: { backgroundColor: '#1f2937', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  btnCancel:  { backgroundColor: '#374151' },
  btnDanger:  { marginTop: 24, paddingVertical: 8 },
  btnText:    { color: '#fff', fontSize: 15, fontWeight: '600' },
  btnTextSm:  { color: '#d1d5db', fontSize: 13 },
  subMenu:    { width: '100%', backgroundColor: '#161b22', borderRadius: 12, padding: 16, marginBottom: 12 },
  subTitle:   { color: '#9ca3af', fontSize: 13, marginBottom: 10 },
  deadBox:    { alignItems: 'center', marginTop: 16 },
  deadText:   { color: '#6b7280', fontSize: 15, marginBottom: 8 },
  emptyText:  { color: '#6b7280', fontSize: 16, marginBottom: 20 },
});
