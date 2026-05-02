# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # run the game
npm run dev        # run with --watch (auto-restart on file change)
rm -rf .save       # reset save data (triggers first-time adoption flow on next start)
```

No test suite exists. The `Pet` class is pure logic and can be tested inline:

```js
import { Pet } from './src/pet.js';
const p = new Pet({ type: 'agumon', name: 'test' });
p.feed('meat');
console.assert(p.hunger < 20);
```

## Architecture

A Tamagotchi-style Digimon terminal game. Pure Node.js ESM (`"type": "module"` in package.json), Node ≥ 18, single runtime dependency: `chalk` (listed under `devDependencies`).

### Module responsibilities

| File | Role |
|---|---|
| `src/index.js` | Entry point. `main()` sets up stdin, loads save, starts `setInterval` auto-refresh (10 s). `handleAction(key)` routes keypresses. `adoptNewPet()` / `firstTimeSetup()` manage the adoption flow. |
| `src/pet.js` | `Pet` class. All stat mutations. Every action (`feed`, `play`, `sleep`, `heal`, `clean`) returns `{ success, msg }`. `applyTimeDecay()` uses wall-clock delta capped at 480 min. `stageIndex` is a getter derived from `level` + `age`. |
| `src/ui.js` | All terminal rendering (`renderPet`, `renderMenu`, `renderMessage`, `renderLevelUp`, `renderEvolution`). Owns the single stdin raw-mode pipeline via `setupKeyInput` + a `subMenuKeyHandler` slot. Sub-menus (feed, adopt, battle) all go through `setSubMenuHandler` rather than creating a second `readline.Interface`. |
| `src/ascii.js` | Digimon metadata: `DIGIMON` dict (3 lines × 6 stages), `getStageIndex(level, ageMinutes)`, battle stats per stage. No sprites here. |
| `src/pixels.js` | Raw pixel art grids (string arrays) for every Digimon × stage × state combination. |
| `src/pixelRenderer.js` | Converts pixel grids to ANSI-colored terminal strings. LCD background color `#9bbc0f`. `getSprite(type, stageIndex, state)` is the public API. |
| `src/battle.js` | Turn-based battle. Builds `player`/`enemy` fighter objects from `Pet` stats, runs an async loop with `waitForBattleKey()` via `setSubMenuHandler`. Returns `{ won, fled, expGain, cannotFight }`. |
| `src/storage.js` | `loadPet()` / `savePet()` / `deleteSave()` — reads/writes `.save/pet.json`. `loadPet()` returns a `Pet` instance or `null`. |

### Key design invariants

- **Single stdin path**: `setupKeyInput` in `ui.js` owns raw mode. Sub-menus swap in `subMenuKeyHandler`; the main key handler is bypassed while it's set. Never create a second `readline.Interface`.
- **Time-driven decay**: `applyTimeDecay()` computes `minutesPassed = (Date.now() - lastSaved) / 60000`, capped at 480 min. The 10 s timer only triggers a redraw + save; it is not the authoritative time source.
- **Pure action returns**: all `Pet` methods return `{ success, msg }`. `index.js` owns rendering after receiving the result.
- **Evolution is derived**: `pet.stageIndex` is a computed getter — do not store it. Thresholds: age < 2 min → egg; then level 1–2 baby, 3–5 in-training, 6–10 rookie, 11–17 champion, 18+ ultimate.

### Adding a new Digimon line

1. Add an entry to `DIGIMON` in `src/ascii.js` (6 stages, each with `battleStats`).
2. Add pixel sprites to `src/pixels.js` under the same key.
3. Add a `typeMap` entry in `renderAdoptScreen()` in `src/ui.js`.

### Adding a new action

1. Add a method returning `{ success, msg }` to `Pet` in `src/pet.js`.
2. Add a `case` in `handleAction()` in `src/index.js`.
3. Add an entry to the `actions` array in `renderMenu()` in `src/ui.js`.
