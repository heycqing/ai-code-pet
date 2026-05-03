import chalk from 'chalk';
import { Pet } from './pet.js';
import { loadPet, savePet } from './storage.js';
import { startBattle } from './battle.js';
import { startExpedition, checkExpedition, applyExpeditionResult } from './expedition.js';
import {
  renderPet,
  renderMenu,
  renderMessage,
  renderLevelUp,
  renderEvolution,
  renderFeedMenu,
  renderAdoptScreen,
  renderExpeditionMenu,
  renderExpeditionResult,
  waitForAnyKey,
  setupKeyInput,
} from './ui.js';
import { STAGE_LABELS } from './ascii.js';

let pet = null;
let lastMessage = '';
let lastMessageIsError = false;
let lastMessageIsSpeech = false;
let isInSubMenu = false;
let refreshTimer = null;
let speechCooldown = 0;

const PET_SPEECH = {
  critical_hunger: ['肚子咕咕叫好久了！！', '快饿晕了...快来喂我！', '我要饿死了...呜呜...'],
  critical_health: ['好难受...我快撑不住了...', '身体越来越差了，需要帮助...', '呜...感觉很痛...'],
  hungry:    ['好像有点饿了呢...', '能给我点吃的吗？', '肚子有点空空的...'],
  exhausted: ['走不动了...快睡着了...', '太累了...zzz...'],
  tired:     ['有点累了...好想睡觉', '今天玩了好久，眼皮好重...', '可以休息一下吗？'],
  sick:      ['感觉有点不舒服...', '头有点晕晕的...', '身体好像有点不对劲...'],
  sad:       ['好无聊啊...', '有人陪我玩吗？', '是不是不喜欢我了...（委屈）', '好孤单...'],
  happy:     ['今天真的好开心！', '好喜欢和你在一起！', '嘿嘿，心情超好～', '感觉整个世界都在发光！'],
  idle:      ['今天天气怎么样呀？', '在想什么呢...', '...（发呆中）', '嗯...嗯嗯...'],
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getPetSpeech(pet) {
  if (pet.isDead) return null;

  // Critical states always speak
  if (pet.hunger >= 90) return pick(PET_SPEECH.critical_hunger);
  if (pet.health <= 15) return pick(PET_SPEECH.critical_health);

  if (speechCooldown > 0) { speechCooldown--; return null; }
  if (Math.random() > 0.5) { speechCooldown = 2; return null; }

  speechCooldown = 3;

  if (pet.energy <= 10)                        return pick(PET_SPEECH.exhausted);
  if (pet.hunger >= 70)                        return pick(PET_SPEECH.hungry);
  if (pet.energy <= 25)                        return pick(PET_SPEECH.tired);
  if (pet.health <= 40)                        return pick(PET_SPEECH.sick);
  if (pet.happiness <= 20)                     return pick(PET_SPEECH.sad);
  if (pet.happiness >= 85 && pet.hunger < 40)  return pick(PET_SPEECH.happy);
  return pick(PET_SPEECH.idle);
}

function setMessage(msg, isError = false, isSpeech = false) {
  lastMessage = msg;
  lastMessageIsError = isError;
  lastMessageIsSpeech = isSpeech;
}

function render() {
  if (isInSubMenu) return;
  renderPet(pet);
  renderMenu(pet);
  renderMessage(lastMessage, lastMessageIsError, lastMessageIsSpeech);
}

function startAutoRefresh() {
  refreshTimer = setInterval(() => {
    if (!isInSubMenu) {
      pet.applyTimeDecay();
      savePet(pet);
      const speech = getPetSpeech(pet);
      if (speech) setMessage(speech, false, true);
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
    case '7': {
      isInSubMenu = true;
      if (refreshTimer) clearInterval(refreshTimer);

      if (pet.expedition) {
        const status = checkExpedition(pet);
        if (status && status.ongoing) {
          isInSubMenu = false;
          setMessage(`${pet.name}还在远征中，请耐心等待！`);
        } else if (status && !status.ongoing) {
          // Expedition just finished
          const gain = applyExpeditionResult(pet, status.result);
          leveledUp = gain.leveledUp;
          evolved   = gain.evolved;
          newStage  = pet.stageIndex;
          savePet(pet);
          renderExpeditionResult(pet.name, status.result);
          if (leveledUp) renderLevelUp(pet.level);
          if (evolved)   renderEvolution(STAGE_LABELS[newStage] ?? '');
          await waitForAnyKey();
          isInSubMenu = false;
          setMessage(`${pet.name}归来了！`);
        }
      } else {
        render();
        const zoneKey = await renderExpeditionMenu(pet);
        if (zoneKey) {
          result = startExpedition(pet, zoneKey);
          setMessage(result.msg, !result.success);
        } else {
          setMessage('取消远征');
        }
        isInSubMenu = false;
      }

      pet.applyTimeDecay();
      savePet(pet);
      render();
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

    // Check if expedition finished while we were away
    const expStatus = checkExpedition(pet);
    if (expStatus && !expStatus.ongoing) {
      savePet(pet); // save cleared expedition field first
      const gain = applyExpeditionResult(pet, expStatus.result);
      savePet(pet);
      renderExpeditionResult(pet.name, expStatus.result);
      if (gain.leveledUp) renderLevelUp(pet.level);
      if (gain.evolved)   renderEvolution(STAGE_LABELS[gain.newStage] ?? '');
      await waitForAnyKey();
      setMessage(`${pet.name}归来了！`);
    } else {
      savePet(pet);
      const elapsed = Math.floor((Date.now() - (saved.lastSaved || Date.now())) / 1000 / 60);
      if (elapsed > 5 && !pet.expedition) {
        setMessage(`你离开了 ${elapsed} 分钟，${pet.name} 好想你！`);
      } else if (pet.expedition) {
        setMessage(`${pet.name}还在远征中，正耐心等你回来！`);
      }
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
