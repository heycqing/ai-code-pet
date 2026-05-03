import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pet } from '../game/pet.js';
import { savePet } from '../storage/petStorage';
import { createBattle, tickBattle } from '../game/battle.js';
import PetSprite from '../components/PetSprite';
import StatBar from '../components/StatBar';
import { Theme } from '../theme';

interface Props {
  pet: Pet;
  onBack: (pet: Pet) => void;
  theme?: Theme;
}

type Phase = 'player_turn' | 'won' | 'lost' | 'fled' | 'cannot';

export default function BattleScreen({ pet: initialPet, onBack, theme }: Props) {
  const bg       = theme?.bg       ?? '#0d1117';
  const bgCard   = theme?.bgCard   ?? '#161b22';
  const bgPanel  = theme?.bgPanel  ?? '#1f2937';
  const accent   = theme?.accent   ?? '#7c3aed';
  const textColor= theme?.text     ?? '#e5e7eb';
  const textMuted= theme?.textMuted?? '#9ca3af';
  const border   = theme?.border   ?? '#374151';
  const success  = theme?.success  ?? '#34d399';
  const danger   = theme?.danger   ?? '#f87171';
  const [pet]         = useState(() => new Pet(initialPet.toJSON()));
  const [state, setState] = useState<any>(null);
  const [phase, setPhase] = useState<Phase>('player_turn');
  const [cannotMsg, setCannotMsg]   = useState('');

  useEffect(() => {
    const s = createBattle(pet) as any;
    if (s.cannotFight) {
      setPhase('cannot');
      setCannotMsg(s.msg);
    } else {
      setState({ ...s });
      setPhase(s.phase as Phase);
    }
  }, []);

  const handleAction = (action: 'a' | 's' | 'd' | 'f') => {
    if (!state || phase !== 'player_turn') return;
    const next = tickBattle(state, action, pet.energy);
    if (next.result?.energyUsed) {
      pet.energy = Math.max(0, pet.energy - next.result.energyUsed);
    }
    setState({ ...next, log: [...next.log] });
    setPhase(next.phase as Phase);
  };

  const handleEnd = async () => {
    if (state?.result?.won) {
      pet.wins   = (pet.wins   ?? 0) + 1;
      pet.coins  = (pet.coins  ?? 0) + (state.result.coinGain ?? 0);
      pet.gainExp(state.result.expGain ?? 0);
    } else if (state?.result && !state.result.fled) {
      pet.losses = (pet.losses ?? 0) + 1;
    }
    await savePet(pet);
    onBack(pet);
  };

  if (phase === 'cannot') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
        <View style={styles.center}>
          <Text style={[styles.cannotText, { color: textMuted }]}>{cannotMsg}</Text>
          <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: accent }]} onPress={() => onBack(pet)}>
            <Text style={styles.btnText}>返回</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!state) return null;

  const { player, enemy, log } = state;
  const recentLog: string[] = log.slice(-4);
  const isDone = phase === 'won' || phase === 'lost' || phase === 'fled';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: accent }]}>⚔  神兽对战  ⚔</Text>

        {/* Sprites */}
        <View style={styles.spriteRow}>
          <View style={styles.fighter}>
            <Text style={[styles.fighterName, { color: theme?.special ?? '#60a5fa' }]}>{player.name}</Text>
            <StatBar label="HP" value={player.hp} max={player.maxHp} color={theme?.special ?? '#60a5fa'} bgColor={bgPanel} labelColor={textMuted} valueColor={textColor} />
            <PetSprite type={player.type} stageIndex={player.stageIndex} state="idle" pixelSize={5} />
          </View>
          <Text style={[styles.vs, { color: textMuted }]}>VS</Text>
          <View style={styles.fighter}>
            <Text style={[styles.fighterName, { color: danger }]}>{enemy.name}</Text>
            <StatBar label="HP" value={enemy.hp} max={enemy.maxHp} color={danger} bgColor={bgPanel} labelColor={textMuted} valueColor={textColor} />
            <PetSprite type={enemy.type} stageIndex={enemy.stageIndex} state="idle" pixelSize={5} />
          </View>
        </View>

        {/* Battle log */}
        <View style={[styles.logBox, { backgroundColor: bgCard, borderColor: border, borderWidth: 1 }]}>
          {recentLog.map((line, i) => (
            <Text key={i} style={[styles.logLine, { color: textColor }]}>{line}</Text>
          ))}
        </View>

        {/* Actions or Result */}
        {isDone ? (
          <View style={styles.resultBox}>
            <Text style={[styles.resultText, { color: phase === 'won' ? success : danger }]}>
              {phase === 'won'
                ? `★ 胜利！+${state.result?.expGain ?? 0} EXP  💎 +${state.result?.coinGain ?? 0}`
                : phase === 'fled' ? '成功逃脱' : '败北了...'}
            </Text>
            <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: accent }]} onPress={handleEnd}>
              <Text style={styles.btnText}>返回</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.btnAction, { backgroundColor: bgPanel }]} onPress={() => handleAction('a')}>
              <Text style={styles.btnEmoji}>⚔️</Text>
              <Text style={[styles.btnLabel, { color: textColor }]}>攻击</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnAction, { backgroundColor: bgPanel }, pet.energy < 20 && styles.btnDisabled]}
              onPress={() => handleAction('s')}
            >
              <Text style={styles.btnEmoji}>✨</Text>
              <Text style={[styles.btnLabel, { color: textColor }]}>特技</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnAction, { backgroundColor: bgPanel }]} onPress={() => handleAction('d')}>
              <Text style={styles.btnEmoji}>🛡️</Text>
              <Text style={[styles.btnLabel, { color: textColor }]}>防御</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnAction, { backgroundColor: bgCard }]} onPress={() => handleAction('f')}>
              <Text style={styles.btnEmoji}>🏃</Text>
              <Text style={[styles.btnLabel, { color: textColor }]}>逃跑</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1 },
  scroll:       { padding: 20, alignItems: 'center' },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title:        { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  spriteRow:    { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', width: '100%', marginBottom: 16 },
  fighter:      { alignItems: 'center', flex: 1 },
  fighterName:  { fontSize: 13, fontWeight: '600', marginBottom: 4, textAlign: 'center' },
  vs:           { fontSize: 18, fontWeight: 'bold', marginHorizontal: 8 },
  logBox:       { width: '100%', borderRadius: 10, padding: 12, minHeight: 100, marginBottom: 16 },
  logLine:      { fontSize: 13, marginVertical: 2 },
  actionRow:    { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
  btnAction:    { width: 80, height: 72, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnDisabled:  { opacity: 0.4 },
  btnEmoji:     { fontSize: 24 },
  btnLabel:     { fontSize: 12, marginTop: 2 },
  resultBox:    { alignItems: 'center', marginTop: 8 },
  resultText:   { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  btnPrimary:   { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 },
  btnText:      { color: '#fff', fontSize: 15, fontWeight: '600' },
  cannotText:   { fontSize: 15, textAlign: 'center', marginBottom: 20 },
});
