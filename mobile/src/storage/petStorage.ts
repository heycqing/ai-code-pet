import * as FileSystem from 'expo-file-system/legacy';
import { Pet } from '../game/pet.js';

const SAVE_PATH = FileSystem.documentDirectory + 'pet_save.json';

export async function loadPet(): Promise<Pet | null> {
  try {
    const info = await FileSystem.getInfoAsync(SAVE_PATH);
    if (!info.exists) return null;
    const raw = await FileSystem.readAsStringAsync(SAVE_PATH);
    return new Pet(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function savePet(pet: Pet): Promise<void> {
  await FileSystem.writeAsStringAsync(SAVE_PATH, JSON.stringify(pet.toJSON()));
}

export async function deleteSave(): Promise<void> {
  await FileSystem.deleteAsync(SAVE_PATH, { idempotent: true });
}
