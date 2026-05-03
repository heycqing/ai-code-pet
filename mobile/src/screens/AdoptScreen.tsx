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
import { Theme } from '../theme';

interface Props {
  onAdopted: () => void;
  theme?: Theme;
}

const TYPES = Object.entries(DIGIMON).map(([key, info]: [string, any]) => ({
  key,
  chineseName: info.chineseName,
  emoji: info.emoji,
  description: info.description,
}));

export default function AdoptScreen({ onAdopted, theme }: Props) {
  const bg          = theme?.bg          ?? '#0d1117';
  const bgCard      = theme?.bgCard      ?? '#161b22';
  const accent      = theme?.accent      ?? '#7c3aed';
  const textColor   = theme?.text        ?? '#e5e7eb';
  const textMuted   = theme?.textMuted   ?? '#9ca3af';
  const border      = theme?.border      ?? '#374151';
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
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* keyboardShouldPersistTaps="handled" 让 iOS 单次点击直接触发按钮，不需要先收起键盘 */}
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: textColor }]}>领养数码宝贝</Text>

          {step === 'pick' ? (
            <>
              <Text style={[styles.subtitle, { color: textMuted }]}>选择你的伙伴</Text>
              {TYPES.map(t => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.card, { backgroundColor: bgCard, borderColor: selected === t.key ? accent : 'transparent' }]}
                  onPress={() => setSelected(t.key)}
                >
                  <View style={styles.cardSprite}>
                    <PetSprite type={t.key} stageIndex={3} state="idle" pixelSize={4} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.cardName, { color: textColor }]}>{t.emoji} {t.chineseName}</Text>
                    <Text style={[styles.cardDesc, { color: textMuted }]}>{t.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.btnPrimary, { backgroundColor: accent }, !selected && styles.btnDisabled]}
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
              <Text style={[styles.subtitle, { color: textMuted }]}>给它起个名字</Text>
              <TextInput
                style={[styles.input, { backgroundColor: bgCard, color: textColor, borderColor: border }]}
                value={name}
                onChangeText={setName}
                placeholder="宝贝的名字..."
                placeholderTextColor={textMuted}
                maxLength={10}
                autoFocus
              />
              <TouchableOpacity
                style={[styles.btnPrimary, { backgroundColor: accent }, (!name.trim() || saving) && styles.btnDisabled]}
                disabled={!name.trim() || saving}
                onPress={handleAdopt}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>开始养成！</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnBack} onPress={() => setStep('pick')}>
                <Text style={[styles.btnBackText, { color: textMuted }]}>返回</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1 },
  scroll:       { padding: 24, alignItems: 'center' },
  title:        { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  subtitle:     { fontSize: 14, marginBottom: 20 },
  card:         { flexDirection: 'row', borderRadius: 12, padding: 12, marginBottom: 12, width: '100%', borderWidth: 2 },
  cardSprite:   { marginRight: 12, borderRadius: 6, overflow: 'hidden' },
  cardInfo:     { flex: 1, justifyContent: 'center' },
  cardName:     { fontSize: 15, fontWeight: '600' },
  cardDesc:     { fontSize: 12, marginTop: 4 },
  preview:      { borderRadius: 10, overflow: 'hidden', marginBottom: 20 },
  input:        { width: '100%', fontSize: 16, borderRadius: 10, padding: 14, marginBottom: 20, borderWidth: 1 },
  btnPrimary:   { paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12, marginTop: 8, minHeight: 50, alignItems: 'center', justifyContent: 'center' },
  btnDisabled:  { opacity: 0.4 },
  btnText:      { color: '#fff', fontSize: 16, fontWeight: '600' },
  btnBack:      { marginTop: 16, padding: 8 },
  btnBackText:  { fontSize: 14 },
});
