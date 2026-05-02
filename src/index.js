import chalk from 'chalk';
import { Pet } from './pet.js';
import { loadPet, savePet } from './storage.js';
import { startBattle } from './battle.js';
import {
  renderPet,
  renderMenu,
  renderMessage,
  renderLevelUp,
  renderEvolution,
  renderFeedMenu,
  renderAdoptScreen,
  setupKeyInput,
} from './ui.js';
import { STAGE_LABELS } from './ascii.js';

let pet = null;
let lastMessage = '';
let lastMessageIsError = false;
let isInSubMenu = false;
let refreshTimer = null;

function setMessage(msg, isError = false) {
  lastMessage = msg;
  lastMessageIsError = isError;
}

function render() {
  if (isInSubMenu) return;
  renderPet(pet);
  renderMenu(pet);
  renderMessage(lastMessage, lastMessageIsError);
}

function startAutoRefresh() {
  refreshTimer = setInterval(() => {
    if (!isInSubMenu) {
      pet.applyTimeDecay();
      savePet(pet);
      render();
    }
  }, 10000);
}

async function handleAction(key) {
  if (isInSubMenu) return;

  if (pet.isDead) {
    if (key === 'r' || key === 'R') {
      await adoptNewPet();
    } else if (key === 'q' || key === 'Q') {
      quit();
    }
    return;
  }

  let result;
  let leveledUp = false;
  let evolved    = false;
  let newStage   = pet.stageIndex;

  switch (key) {
    case '1': {
      isInSubMenu = true;
      render();
      const foodType = await renderFeedMenu();
      isInSubMenu = false;
      if (foodType) {
        const prevLevel = pet.level;
        const prevStage = pet.stageIndex;
        result    = pet.feed(foodType);
        leveledUp = pet.level > prevLevel;
        evolved   = pet.stageIndex > prevStage;
        newStage  = pet.stageIndex;
      } else {
        result = { success: false, msg: '取消喂食' };
      }
      break;
    }
    case '2': {
      const prevLevel = pet.level;
      const prevStage = pet.stageIndex;
      result    = pet.play();
      leveledUp = pet.level > prevLevel;
      evolved   = pet.stageIndex > prevStage;
      newStage  = pet.stageIndex;
      break;
    }
    case '3': {
      const prevLevel = pet.level;
      const prevStage = pet.stageIndex;
      result    = pet.sleep();
      leveledUp = pet.level > prevLevel;
      evolved   = pet.stageIndex > prevStage;
      newStage  = pet.stageIndex;
      break;
    }
    case '4': {
      const prevLevel = pet.level;
      const prevStage = pet.stageIndex;
      result    = pet.heal();
      leveledUp = pet.level > prevLevel;
      evolved   = pet.stageIndex > prevStage;
      newStage  = pet.stageIndex;
      break;
    }
    case '5': {
      const prevLevel = pet.level;
      const prevStage = pet.stageIndex;
      result    = pet.clean();
      leveledUp = pet.level > prevLevel;
      evolved   = pet.stageIndex > prevStage;
      newStage  = pet.stageIndex;
      break;
    }
    case '6': {
      isInSubMenu = true;
      if (refreshTimer) clearInterval(refreshTimer);

      const battleResult = await startBattle(pet);

      isInSubMenu = false;

      if (battleResult.cannotFight) {
        setMessage(battleResult.msg, true);
      } else if (battleResult.fled) {
        setMessage(`${pet.name}逃跑了...`);
      } else if (battleResult.won) {
        pet.wins += 1;
        const prevLevel = pet.level;
        const prevStage = pet.stageIndex;
        const gain = pet.gainExp(battleResult.expGain);
        leveledUp = pet.level > prevLevel;
        evolved   = pet.stageIndex > prevStage;
        newStage  = pet.stageIndex;
        pet.happiness = Math.min(100, pet.happiness + 15);
        setMessage(`胜利！获得 ${battleResult.expGain} 经验值！`);
      } else {
        pet.losses += 1;
        pet.health    = Math.max(0, pet.health    - 15);
        pet.happiness = Math.max(0, pet.happiness - 10);
        setMessage(`${pet.name}输了... 下次加油！`, true);
      }

      pet.applyTimeDecay();
      savePet(pet);
      render();
      if (leveledUp) renderLevelUp(pet.level);
      if (evolved)   renderEvolution(STAGE_LABELS[newStage] ?? '');
      startAutoRefresh();
      return;
    }
    case 'r':
    case 'R': {
      await adoptNewPet();
      return;
    }
    case 'q':
    case 'Q': {
      quit();
      return;
    }
    default:
      return;
  }

  if (result) {
    setMessage(result.msg, !result.success);
  }

  pet.applyTimeDecay();
  savePet(pet);
  render();

  if (leveledUp) renderLevelUp(pet.level);
  if (evolved)   renderEvolution(STAGE_LABELS[newStage] ?? '');
}

async function adoptNewPet() {
  isInSubMenu = true;
  if (refreshTimer) clearInterval(refreshTimer);

  const result = await renderAdoptScreen();
  isInSubMenu = false;

  if (result) {
    pet = new Pet({ type: result.type, name: result.name });
    savePet(pet);
    setMessage(`欢迎 ${result.name} 来到你的身边！它还是一颗蛋，好好照顾吧！`);
  }

  render();
  startAutoRefresh();
}

function quit() {
  if (refreshTimer) clearInterval(refreshTimer);
  pet.applyTimeDecay();
  savePet(pet);

  console.log('\n');
  console.log(chalk.yellow(`  再见！${pet.name} 会等你回来的！`));
  console.log();
  process.exit(0);
}

async function firstTimeSetup() {
  isInSubMenu = true;
  console.clear();
  console.log(chalk.bold.yellow('\n  ✦ 欢迎来到数码宝贝养成！✦\n'));
  console.log(chalk.dim('  你还没有数码宝贝，先选一只孵化吧！\n'));

  const result = await renderAdoptScreen();
  isInSubMenu = false;

  if (!result) {
    console.log(chalk.yellow('\n  好吧，下次再来！'));
    process.exit(0);
  }

  pet = new Pet({ type: result.type, name: result.name });
  savePet(pet);
  setMessage(`欢迎 ${result.name} 来到你的身边！它还是一颗蛋，好好照顾吧！`);
}

async function main() {
  setupKeyInput((str) => {
    if (str) handleAction(str.toLowerCase());
  });

  const saved = loadPet();
  if (saved && saved.name) {
    pet = saved;
    pet.applyTimeDecay();
    savePet(pet);
    const elapsed = Math.floor((Date.now() - (saved.lastSaved || Date.now())) / 1000 / 60);
    if (elapsed > 5) {
      setMessage(`你离开了 ${elapsed} 分钟，${pet.name} 好想你！`);
    }
  } else {
    await firstTimeSetup();
  }

  render();
  startAutoRefresh();

  process.on('SIGINT',  quit);
  process.on('SIGTERM', quit);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
