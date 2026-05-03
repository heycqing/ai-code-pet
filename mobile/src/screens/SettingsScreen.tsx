import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pet } from '../game/pet.js';
import { Theme } from '../theme';

interface Props {
  pet: Pet | null;
  theme: Theme;
  themeName: string;
  onTheme: (name: string) => void;
  onRelease: () => void;
}

const THEME_OPTIONS: { id: string; label: string; swatch: string }[] = [
  { id: 'ink',   label: '水墨古典', swatch: '#c8941a' },
  { id: 'dark',  label: '暗黑现代', swatch: '#8060f0' },
  { id: 'rouge', label: '丹砂朱色', swatch: '#d04828' },
];

export default function SettingsScreen({ pet, theme, themeName, onTheme, onRelease }: Props) {
  const handleRelease = () => {
    Alert.alert(
      '放走宠物',
      `确定要放走 ${pet?.name ?? '宠物'} 吗？此操作无法撤销。`,
      [
        { text: '取消', style: 'cancel' },
        { text: '确定放走', style: 'destructive', onPress: onRelease },
      ]
    );
  };

  const createdAt = pet?.createdAt
    ? new Date(pet.createdAt).toLocaleDateString('zh-CN')
    : '未知';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>设置</Text>

        {/* Theme selection */}
        <Text style={[styles.sectionLabel, { color: theme.accent }]}>主题</Text>
        <View style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          {THEME_OPTIONS.map(opt => {
            const active = opt.id === themeName;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.themeRow,
                  active && { backgroundColor: theme.bgPanel },
                ]}
                onPress={() => onTheme(opt.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.swatch, { backgroundColor: opt.swatch }]} />
                <Text style={[styles.themeLabel, { color: active ? theme.accent : theme.text }]}>
                  {opt.label}
                </Text>
                {active && (
                  <View style={[styles.activeDot, { backgroundColor: theme.accent }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Pet info */}
        <Text style={[styles.sectionLabel, { color: theme.accent }]}>宠物信息</Text>
        {pet ? (
          <View style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
            <InfoRow label="名字" value={pet.name} theme={theme} />
            <InfoRow label="类型" value={(pet.petInfo?.chineseName ?? pet.type)} theme={theme} />
            <InfoRow label="阶段" value={pet.stageName} theme={theme} />
            <InfoRow label="等级" value={`Lv.${pet.level}`} theme={theme} />
            <InfoRow label="年龄" value={pet.getAgeString()} theme={theme} />
            <InfoRow label="领养日期" value={createdAt} theme={theme} />
            <InfoRow label="战绩" value={`${pet.wins}胜 / ${pet.losses}负`} theme={theme} />
            <InfoRow label="灵石" value={`💎 ${pet.coins}`} theme={theme} last />
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
            <Text style={[styles.noPetText, { color: theme.textMuted }]}>暂无宠物</Text>
          </View>
        )}

        {/* Danger zone */}
        {pet && !pet.isDead && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.danger }]}>危险操作</Text>
            <View style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.danger + '60' }]}>
              <Text style={[styles.dangerDesc, { color: theme.textMuted }]}>
                放走宠物后，所有存档数据将被清除，无法恢复。
              </Text>
              <TouchableOpacity
                style={[styles.dangerBtn, { borderColor: theme.danger }]}
                onPress={handleRelease}
                activeOpacity={0.8}
              >
                <Text style={[styles.dangerBtnText, { color: theme.danger }]}>放走宠物</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, theme, last }: { label: string; value: string; theme: Theme; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
      <Text style={[styles.infoLabel, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1 },
  scroll:       { padding: 16, paddingBottom: 40 },
  pageTitle:    { fontSize: 20, fontWeight: 'bold', marginBottom: 14 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginTop: 8 },
  card:         { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 14 },
  themeRow:     { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  swatch:       { width: 20, height: 20, borderRadius: 10 },
  themeLabel:   { flex: 1, fontSize: 15, fontWeight: '500' },
  activeDot:    { width: 8, height: 8, borderRadius: 4 },
  infoRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  infoLabel:    { fontSize: 13 },
  infoValue:    { fontSize: 13, fontWeight: '500' },
  noPetText:    { padding: 16, textAlign: 'center', fontSize: 14 },
  dangerDesc:   { fontSize: 13, padding: 14, paddingBottom: 8 },
  dangerBtn:    { margin: 12, marginTop: 4, borderRadius: 10, borderWidth: 1, paddingVertical: 12, alignItems: 'center' },
  dangerBtnText:{ fontSize: 14, fontWeight: '600' },
});
