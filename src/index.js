import chalk from 'chalk';
import { Pet } from './pet.js';
import { loadPet, savePet } from './storage.js';
import {
  renderPet,
  renderMenu,
  renderMessage,
  renderLevelUp,
  renderFeedMenu,
  renderAdoptScreen,
  setupKeyInput,
} from './ui.js';

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
  // Refresh every 10 seconds to show stat decay in real-time
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

  switch (key) {
    case '1': {
      isInSubMenu = true;
      render(); // show current state first
      const foodType = await renderFeedMenu();
      isInSubMenu = false;
      if (foodType) {
        const prevLevel = pet.level;
        result = pet.feed(foodType);
        leveledUp = pet.level > prevLevel;
      } else {
        result = { success: false, msg: '取消喂食' };
      }
      break;
    }
    case '2': {
      const prevLevel = pet.level;
      result = pet.play();
      leveledUp = pet.level > prevLevel;
      break;
    }
    case '3': {
      const prevLevel = pet.level;
      result = pet.sleep();
      leveledUp = pet.level > prevLevel;
      break;
    }
    case '4': {
      const prevLevel = pet.level;
      result = pet.heal();
      leveledUp = pet.level > prevLevel;
      break;
    }
    case '5': {
      const prevLevel = pet.level;
      result = pet.clean();
      leveledUp = pet.level > prevLevel;
      break;
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

  if (leveledUp) {
    renderLevelUp(pet.level);
  }
}

async function adoptNewPet() {
  isInSubMenu = true;
  if (refreshTimer) clearInterval(refreshTimer);

  const result = await renderAdoptScreen();

  isInSubMenu = false;

  if (result) {
    pet = new Pet({ type: result.type, name: result.name });
    savePet(pet);
    setMessage(`欢迎 ${result.name} 来到你的家！`, false);
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
  console.log(chalk.bold.yellow('\n  ✦ 欢迎来到 ASCII 宠物乐园！✦\n'));
  console.log(chalk.dim('  你还没有宠物，先领养一只吧！\n'));

  const result = await renderAdoptScreen();
  isInSubMenu = false;

  if (!result) {
    console.log(chalk.yellow('\n  好吧，下次再来！'));
    process.exit(0);
  }

  pet = new Pet({ type: result.type, name: result.name });
  savePet(pet);
  setMessage(`欢迎 ${result.name} 来到你的家！`, false);
}

async function main() {
  // Load or create pet
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

  // Set up keyboard input
  setupKeyInput((str) => {
    if (str) {
      handleAction(str.toLowerCase());
    }
  });

  // Graceful exit on signals
  process.on('SIGINT', quit);
  process.on('SIGTERM', quit);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
