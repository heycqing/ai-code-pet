import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pet } from '../game/pet.js';
import { DIGIMON } from '../game/ascii.js';
import { savePet } from '../storage/petStorage';
import PetSprite from '../components/PetSprite';

interface Props {
  onAdopted: () => void;
}

const TYPES = Object.entries(DIGIMON).map(([key, info]: [string, any]) => ({
  key,
  chineseName: info.chineseName,
  emoji: info.emoji,
  description: info.description,
}));

export default function AdoptScreen({ onAdopted }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName]         = useState('');
  const [step, setStep]         = useState<'pick' | 'name'>('pick');
  const [saving, setSaving]     = useState(false);

  const handleAdopt = async () => {
    if (!selected || !name.trim() || saving) return;
    setSaving(true);
    try {
      const pet = new Pet({ type: selected, name: name.trim() });
      await savePet(pet);
      onAdopted();
    } catch (e) {
      console.error('adopt error', e);
      Alert.alert('出错了', String(e));
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* keyboardShouldPersistTaps="handled" 让 iOS 单次点击直接触发按钮，不需要先收起键盘 */}
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>领养数码宝贝</Text>

          {step === 'pick' ? (
            <>
              <Text style={styles.subtitle}>选择你的伙伴</Text>
              {TYPES.map(t => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.card, selected === t.key && styles.cardSelected]}
                  onPress={() => setSelected(t.key)}
                >
                  <View style={styles.cardSprite}>
                    <PetSprite type={t.key} stageIndex={3} state="idle" pixelSize={4} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{t.emoji} {t.chineseName}</Text>
                    <Text style={styles.cardDesc}>{t.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.btnPrimary, !selected && styles.btnDisabled]}
                disabled={!selected}
                onPress={() => setStep('name')}
              >
                <Text style={styles.btnText}>下一步</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.preview}>
                <PetSprite type={selected!} stageIndex={0} state="idle" pixelSize={6} />
              </View>
              <Text style={styles.subtitle}>给它起个名字</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="宝贝的名字..."
                placeholderTextColor="#4b5563"
                maxLength={10}
                autoFocus
              />
              <TouchableOpacity
                style={[styles.btnPrimary, (!name.trim() || saving) && styles.btnDisabled]}
                disabled={!name.trim() || saving}
                onPress={handleAdopt}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>开始养成！</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnBack} onPress={() => setStep('pick')}>
                <Text style={styles.btnBackText}>返回</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#0d1117' },
  scroll:       { padding: 24, alignItems: 'center' },
  title:        { fontSize: 22, fontWeight: 'bold', color: '#e5e7eb', marginBottom: 8 },
  subtitle:     { fontSize: 14, color: '#9ca3af', marginBottom: 20 },
  card:         { flexDirection: 'row', backgroundColor: '#161b22', borderRadius: 12, padding: 12, marginBottom: 12, width: '100%', borderWidth: 2, borderColor: 'transparent' },
  cardSelected: { borderColor: '#7c3aed' },
  cardSprite:   { marginRight: 12, borderRadius: 6, overflow: 'hidden' },
  cardInfo:     { flex: 1, justifyContent: 'center' },
  cardName:     { fontSize: 15, fontWeight: '600', color: '#e5e7eb' },
  cardDesc:     { fontSize: 12, color: '#6b7280', marginTop: 4 },
  preview:      { borderRadius: 10, overflow: 'hidden', marginBottom: 20 },
  input:        { width: '100%', backgroundColor: '#161b22', color: '#e5e7eb', fontSize: 16, borderRadius: 10, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#374151' },
  btnPrimary:   { backgroundColor: '#7c3aed', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12, marginTop: 8, minHeight: 50, alignItems: 'center', justifyContent: 'center' },
  btnDisabled:  { opacity: 0.4 },
  btnText:      { color: '#fff', fontSize: 16, fontWeight: '600' },
  btnBack:      { marginTop: 16, padding: 8 },
  btnBackText:  { color: '#6b7280', fontSize: 14 },
});
