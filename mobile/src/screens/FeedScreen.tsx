import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pet } from '../game/pet.js';
import { savePet } from '../storage/petStorage';
import { Theme } from '../theme';
import PetSprite from '../components/PetSprite';

interface FoodItem {
  id: string;
  name: string;
  icon: string;
  hunger?: number;
  happiness?: number;
  health?: number;
  energy?: number;
  bond?: number;
  coins: number;
  exp: number;
}

const FOODS: FoodItem[] = [
  { id:'herb',   name:'灵草',   icon:'🌿', hunger:-20, happiness:5,  bond:2,  coins:-10, exp:3  },
  { id:'fruit',  name:'仙果',   icon:'🍑', hunger:-35, happiness:15, bond:5,  coins:-25, exp:5  },
  { id:'elixir', name:'丹药',   icon:'💊', health:30,                          coins:-40, exp:10 },
  { id:'meat',   name:'神兽肉', icon:'🍖', hunger:-50, energy:10,    bond:8,  coins:-60, exp:8  },
  { id:'candy',  name:'灵糖',   icon:'🍬', hunger:-10, happiness:30, bond:10, coins:-15, exp:2  },
  { id:'tea',    name:'古茶',   icon:'🍵', hunger:-15, happiness:20, energy:8, bond:3,  coins:-20, exp:3  },
];

interface Props {
  pet: Pet;
  theme: Theme;
  onPetUpdate: (pet: Pet) => void;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function statEffectLabel(food: FoodItem): string[] {
  const parts: string[] = [];
  if (food.hunger    !== undefined && food.hunger    < 0) parts.push(`饱食 +${-food.hunger}`);
  if (food.happiness !== undefined && food.happiness > 0) parts.push(`心情 +${food.happiness}`);
  if (food.health    !== undefined && food.health    > 0) parts.push(`健康 +${food.health}`);
  if (food.energy    !== undefined && food.energy    > 0) parts.push(`精力 +${food.energy}`);
  if (food.bond      !== undefined && food.bond      > 0) parts.push(`羁绊 +${food.bond}`);
  parts.push(`经验 +${food.exp}`);
  return parts;
}

export default function FeedScreen({ pet, theme, onPetUpdate }: Props) {
  const [flashId, setFlashId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const handleFeed = async (food: FoodItem) => {
    if (pet.isDead) { setMsg('宠物已经离开了'); return; }
    const cost = Math.abs(food.coins);
    if (pet.coins < cost) { setMsg('灵石不足！'); return; }

    // Apply stats
    if (food.hunger    !== undefined) pet.hunger    = clamp(pet.hunger    + food.hunger,    0, 100);
    if (food.happiness !== undefined) pet.happiness = clamp(pet.happiness + food.happiness, 0, 100);
    if (food.health    !== undefined) pet.health    = clamp(pet.health    + food.health,    0, 100);
    if (food.energy    !== undefined) pet.energy    = clamp(pet.energy    + food.energy,    0, 100);
    if (food.bond      !== undefined) pet.bond      = clamp(pet.bond      + food.bond,      0, 100);
    pet.coins -= cost;
    pet.gainExp(food.exp);

    await savePet(pet);
    setFlashId(food.id);
    setMsg(`${pet.name}吃了${food.name}！`);
    setTimeout(() => setFlashId(null), 600);
    onPetUpdate(new Pet(pet.toJSON()));
  };

  const fullness = 100 - pet.hunger;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>喂食</Text>
            <Text style={[styles.headerSub, { color: theme.textMuted }]}>
              饱食度 {fullness}/100
            </Text>
          </View>
          <View style={[styles.coinBadge, { backgroundColor: theme.bgPanel, borderColor: theme.border }]}>
            <Text style={[styles.coinText, { color: theme.accent }]}>💎 {pet.coins}</Text>
          </View>
        </View>

        {/* Sprite preview */}
        <View style={[styles.spriteRow, { backgroundColor: theme.bgPanel, borderColor: theme.border }]}>
          <PetSprite
            type={pet.type}
            stageIndex={pet.stageIndex}
            state={flashId ? 'happy' : (pet.getState() as any)}
            pixelSize={5}
          />
        </View>

        {msg ? (
          <Text style={[styles.msg, { color: theme.success }]}>{msg}</Text>
        ) : null}

        {/* Food grid */}
        <View style={styles.grid}>
          {FOODS.map(food => {
            const cost = Math.abs(food.coins);
            const canAfford = pet.coins >= cost;
            const isFlash = flashId === food.id;
            return (
              <TouchableOpacity
                key={food.id}
                style={[
                  styles.foodCard,
                  { backgroundColor: isFlash ? theme.accentSoft : theme.bgCard, borderColor: isFlash ? theme.accent : theme.border },
                  !canAfford && styles.disabled,
                ]}
                onPress={() => handleFeed(food)}
                activeOpacity={canAfford ? 0.7 : 1}
              >
                <Text style={styles.foodIcon}>{food.icon}</Text>
                <Text style={[styles.foodName, { color: theme.text }]}>{food.name}</Text>
                <View style={styles.effectsCol}>
                  {statEffectLabel(food).map((e, i) => (
                    <Text key={i} style={[styles.effectText, { color: theme.success }]}>{e}</Text>
                  ))}
                </View>
                <Text style={[styles.costText, { color: canAfford ? theme.accent : theme.danger }]}>
                  💎 {cost}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1 },
  scroll:     { padding: 16, paddingBottom: 32 },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle:{ fontSize: 20, fontWeight: 'bold' },
  headerSub:  { fontSize: 13, marginTop: 2 },
  coinBadge:  { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  coinText:   { fontSize: 15, fontWeight: '700' },
  spriteRow:  { alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, paddingVertical: 20, marginBottom: 12 },
  msg:        { textAlign: 'center', fontSize: 13, marginBottom: 10 },
  grid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  foodCard:   { width: '47%', borderRadius: 12, borderWidth: 1, padding: 12, alignItems: 'center' },
  disabled:   { opacity: 0.5 },
  foodIcon:   { fontSize: 28, marginBottom: 4 },
  foodName:   { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  effectsCol: { alignItems: 'center', marginBottom: 6 },
  effectText: { fontSize: 11, marginBottom: 2 },
  costText:   { fontSize: 13, fontWeight: '700' },
});
