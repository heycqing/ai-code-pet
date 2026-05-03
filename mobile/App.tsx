import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
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

function AppInner() {
  const insets = useSafeAreaInsets();
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

  if (!loaded) {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: theme.bg }]}>
        <Text style={[styles.loadingText, { color: theme.textMuted }]}>加载中...</Text>
      </View>
    );
  }

  // Sub-screens (full screen, no nav bar)
  if (subScreen === 'adopt' || (!pet && loaded)) {
    return (
      <>
        <StatusBar style="light" />
        <AdoptScreen onAdopted={handleAdopted} theme={theme} />
      </>
    );
  }

  if (subScreen === 'battle' && subPet) {
    return (
      <>
        <StatusBar style="light" />
        <BattleScreen pet={subPet} onBack={handleSubBack} theme={theme} />
      </>
    );
  }

  if (subScreen === 'expedition' && subPet) {
    return (
      <>
        <StatusBar style="light" />
        <ExpeditionScreen pet={subPet} onBack={handleSubBack} theme={theme} />
      </>
    );
  }

  // Main tab navigation
  return (
    <>
      <StatusBar style="light" />
      <View style={[styles.root, { backgroundColor: theme.bg }]}>
        {/* Coins strip — pushed below system status bar */}
        <View style={[
          styles.statusStrip,
          { backgroundColor: theme.bgCard, borderBottomColor: theme.border, paddingTop: insets.top + 4 },
        ]}>
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
        <NavBar screen={activeTab} setScreen={setActiveTab} theme={theme} bottomInset={insets.bottom} />
      </View>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppInner />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1 },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText:   { fontSize: 16 },
  statusStrip:   { paddingHorizontal: 16, paddingBottom: 8, borderBottomWidth: 1, alignItems: 'flex-end' },
  statusCoins:   { fontSize: 13, fontWeight: '700' },
  content:       { flex: 1 },
});
