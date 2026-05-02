import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { loadPet } from './src/storage/petStorage';
import { Pet } from './src/game/pet.js';
import HomeScreen from './src/screens/HomeScreen';
import AdoptScreen from './src/screens/AdoptScreen';
import BattleScreen from './src/screens/BattleScreen';

type Screen = 'home' | 'adopt' | 'battle';

export default function App() {
  const [screen, setScreen]       = useState<Screen>('home');
  const [battlePet, setBattlePet] = useState<Pet | null>(null);

  // On launch: decide whether to show adopt or home
  useEffect(() => {
    loadPet().then(p => setScreen(p ? 'home' : 'adopt'));
  }, []);

  const goHome   = () => setScreen('home');
  const goAdopt  = () => setScreen('adopt');
  const goBattle = (pet: Pet) => { setBattlePet(pet); setScreen('battle'); };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {screen === 'adopt'  && <AdoptScreen onAdopted={goHome} />}
      {screen === 'home'   && <HomeScreen onAdopt={goAdopt} onBattle={goBattle} />}
      {screen === 'battle' && battlePet && (
        <BattleScreen pet={battlePet} onBack={goHome} />
      )}
    </SafeAreaProvider>
  );
}
