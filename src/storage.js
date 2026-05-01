import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Pet } from './pet.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SAVE_DIR = join(__dirname, '..', '.save');
const SAVE_FILE = join(SAVE_DIR, 'pet.json');

export function loadPet() {
  try {
    if (!existsSync(SAVE_FILE)) return null;
    const raw = readFileSync(SAVE_FILE, 'utf-8');
    const data = JSON.parse(raw);
    return new Pet(data);
  } catch {
    return null;
  }
}

export function savePet(pet) {
  try {
    if (!existsSync(SAVE_DIR)) {
      mkdirSync(SAVE_DIR, { recursive: true });
    }
    writeFileSync(SAVE_FILE, JSON.stringify(pet.toJSON(), null, 2), 'utf-8');
  } catch (e) {
    // silently fail
  }
}

export function deleteSave() {
  try {
    if (existsSync(SAVE_FILE)) {
      writeFileSync(SAVE_FILE, '{}', 'utf-8');
    }
  } catch {}
}
