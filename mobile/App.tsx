import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { loadPet, savePet, deleteSave } from './src/storage/petStorage';
import { Pet } from './src/game/pet.js';
import { THEMES, Theme } from './src/theme';
import NavBar, { NavTab } from './src/components/NavBar';

import AdoptScreen      from './src/screens/AdoptScreen';
import MainScreen       from './src/screens/MainScreen';
import FeedScreen       from './src/screens/FeedScreen';
import TrainScreen      from './src/screens/TrainScreen';
import EvolveScreen     from './src/screens/EvolveScreen';
import CompendiumScreen from './src/screens/CompendiumScreen';
import SettingsScreen   from './src/screens/SettingsScreen';
import BattleScreen     from './src/screens/BattleScreen';
import ExpeditionScreen from './src/screens/ExpeditionScreen';

type SubScreen = 'battle' | 'expedition' | 'adopt' | null;

export default function App() {
  const [pet,        setPet]        = useState<Pet | null>(null);
  const [loaded,     setLoaded]     = useState(false);
  const [activeTab,  setActiveTab]  = useState<NavTab>('main');
  const [subScreen,  setSubScreen]  = useState<SubScreen>(null);
  const [subPet,     setSubPet]     = useState<Pet | null>(null);
  const [themeName,  setThemeName]  = useState<string>('ink');

  const theme: Theme = THEMES[themeName] ?? THEMES.ink;

  // Load pet on mount + apply time decay
  useEffect(() => {
    loadPet().then(p => {
      if (p) {
        p.applyTimeDecay();
        savePet(p);
      }
      setPet(p);
      setLoaded(true);
    });
  }, []);

  const handlePetUpdate = (updated: Pet) => {
    setPet(updated);
  };

  const handleAdopted = async () => {
    const p = await loadPet();
    setPet(p);
    setSubScreen(null);
    setActiveTab('main');
  };

  const handleRelease = async () => {
    await deleteSave();
    setPet(null);
    setSubScreen('adopt');
  };

  const handleBattle = (p: Pet) => {
    setSubPet(p);
    setSubScreen('battle');
  };

  const handleExpedition = (p: Pet) => {
    setSubPet(p);
    setSubScreen('expedition');
  };

  const handleSubBack = async (updatedPet: Pet) => {
    await savePet(updatedPet);
    setPet(new Pet(updatedPet.toJSON()));
    setSubScreen(null);
    setActiveTab('train');
  };

  // Current time string for status bar
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  if (!loaded) {
    return (
      <SafeAreaProvider>
        <View style={[styles.loadingScreen, { backgroundColor: theme.bg }]}>
          <Text style={[styles.loadingText, { color: theme.textMuted }]}>加载中...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  // Sub-screens (full screen, no nav bar)
  if (subScreen === 'adopt' || (!pet && loaded)) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AdoptScreen onAdopted={handleAdopted} theme={theme} />
      </SafeAreaProvider>
    );
  }

  if (subScreen === 'battle' && subPet) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <BattleScreen pet={subPet} onBack={handleSubBack} theme={theme} />
      </SafeAreaProvider>
    );
  }

  if (subScreen === 'expedition' && subPet) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <ExpeditionScreen pet={subPet} onBack={handleSubBack} theme={theme} />
      </SafeAreaProvider>
    );
  }

  // Main tab navigation
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={[styles.root, { backgroundColor: theme.bg }]}>
        {/* Status bar strip */}
        <View style={[styles.statusStrip, { backgroundColor: theme.bgCard, borderBottomColor: theme.border }]}>
          <Text style={[styles.statusTime, { color: theme.textMuted }]}>{timeStr}</Text>
          <Text style={[styles.statusCoins, { color: theme.accent }]}>💎 {pet?.coins ?? 0}</Text>
        </View>

        {/* Tab content */}
        <View style={styles.content}>
          {activeTab === 'main' && pet && (
            <MainScreen
              pet={pet}
              theme={theme}
              onPetUpdate={handlePetUpdate}
              onBattle={handleBattle}
              onExpedition={handleExpedition}
              onAdopt={() => setSubScreen('adopt')}
            />
          )}
          {activeTab === 'feed' && pet && (
            <FeedScreen
              pet={pet}
              theme={theme}
              onPetUpdate={handlePetUpdate}
            />
          )}
          {activeTab === 'train' && pet && (
            <TrainScreen
              pet={pet}
              theme={theme}
              onBattle={handleBattle}
              onExpedition={handleExpedition}
              onPetUpdate={handlePetUpdate}
            />
          )}
          {activeTab === 'evolve' && pet && (
            <EvolveScreen pet={pet} theme={theme} />
          )}
          {activeTab === 'compend' && pet && (
            <CompendiumScreen pet={pet} theme={theme} />
          )}
          {activeTab === 'settings' && (
            <SettingsScreen
              pet={pet}
              theme={theme}
              themeName={themeName}
              onTheme={setThemeName}
              onRelease={handleRelease}
            />
          )}
        </View>

        {/* Bottom NavBar */}
        <NavBar screen={activeTab} setScreen={setActiveTab} theme={theme} />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1 },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText:   { fontSize: 16 },
  statusStrip:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
  statusTime:    { fontSize: 13, fontWeight: '500' },
  statusCoins:   { fontSize: 13, fontWeight: '700' },
  content:       { flex: 1 },
});
