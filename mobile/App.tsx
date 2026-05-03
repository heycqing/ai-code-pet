import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { loadPet } from './src/storage/petStorage';
import { Pet } from './src/game/pet.js';
import HomeScreen from './src/screens/HomeScreen';
import AdoptScreen from './src/screens/AdoptScreen';
import BattleScreen from './src/screens/BattleScreen';
import ExpeditionScreen from './src/screens/ExpeditionScreen';

type Screen = 'home' | 'adopt' | 'battle' | 'expedition';

export default function App() {
  const [screen, setScreen]       = useState<Screen>('home');
  const [activePet, setActivePet] = useState<Pet | null>(null);

  // On launch: decide whether to show adopt or home
  useEffect(() => {
    loadPet().then(p => setScreen(p ? 'home' : 'adopt'));
  }, []);

  const goHome       = () => setScreen('home');
  const goAdopt      = () => setScreen('adopt');
  const goBattle     = (pet: Pet) => { setActivePet(pet); setScreen('battle'); };
  const goExpedition = (pet: Pet) => { setActivePet(pet); setScreen('expedition'); };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {screen === 'adopt'      && <AdoptScreen onAdopted={goHome} />}
      {screen === 'home'       && <HomeScreen onAdopt={goAdopt} onBattle={goBattle} onExpedition={goExpedition} />}
      {screen === 'battle'     && activePet && <BattleScreen pet={activePet} onBack={goHome} />}
      {screen === 'expedition' && activePet && <ExpeditionScreen pet={activePet} onBack={goHome} />}
    </SafeAreaProvider>
  );
}
