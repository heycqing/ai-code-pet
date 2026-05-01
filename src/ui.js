import chalk from 'chalk';
import * as readline from 'readline';
import { getFrame, DIGIMON, STAGE_LABELS } from './ascii.js';
import { MAX_STAT } from './pet.js';

const COLORS = {
  border:   chalk.cyan,
  title:    chalk.bold.yellow,
  label:    chalk.gray,
  value:    chalk.white,
  good:     chalk.green,
  warn:     chalk.yellow,
  bad:      chalk.red,
  action:   chalk.bold.cyan,
  dim:      chalk.dim,
  pet:      chalk.bold.white,
  levelup:  chalk.bold.magenta,
  evolve:   chalk.bold.green,
};

function clearScreen() {
  process.stdout.write('\x1B[2J\x1B[0f');
}

function stripAnsi(str) {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B\[[0-9;]*m/g, '');
}

function center(text, width) {
  const visible = stripAnsi(text);
  const pad  = Math.max(0, width - visible.length);
  const left = Math.floor(pad / 2);
  return ' '.repeat(left) + text + ' '.repeat(pad - left);
}

function statBar(value, max = MAX_STAT, width = 20) {
  const filled = Math.round((value / max) * width);
  const bar    = '█'.repeat(filled) + '░'.repeat(width - filled);
  if (value / max > 0.6) return COLORS.good(bar);
  if (value / max > 0.3) return COLORS.warn(bar);
  return COLORS.bad(bar);
}

function hungerBar(value, max = MAX_STAT, width = 20) {
  return statBar(max - value, max, width);
}

function statNum(val) {
  const n = Math.round(val);
  if (n > 60) return COLORS.good(String(n).padStart(3));
  if (n > 30) return COLORS.warn(String(n).padStart(3));
  return COLORS.bad(String(n).padStart(3));
}

function box(lines, width = 52) {
  const top    = COLORS.border('╔' + '═'.repeat(width) + '╗');
  const bottom = COLORS.border('╚' + '═'.repeat(width) + '╝');
  const middle = lines.map(line => {
    const visible = stripAnsi(line);
    const pad     = width - visible.length;
    return COLORS.border('║') + line + ' '.repeat(Math.max(0, pad)) + COLORS.border('║');
  });
  return [top, ...middle, bottom].join('\n');
}

// ──────────────────────────────────────────────────────────────────────
// Main pet display
// ──────────────────────────────────────────────────────────────────────
export function renderPet(pet) {
  clearScreen();

  const state     = pet.getState();
  const frame     = getFrame(pet.type, pet.stageIndex, state);
  const digimon   = DIGIMON[pet.type];
  const stageInfo = pet.stageInfo;
  const stageLabel = STAGE_LABELS[pet.stageIndex] ?? '';

  const W = 52;

  console.log(COLORS.title(center('✦ 数码宝贝养成 ✦', W + 2)));
  console.log();

  // Pet box
  const petLines = [
    center('', W),
    ...frame.map(l => center(COLORS.pet(l), W)),
    center('', W),
    center(COLORS.title(`${digimon.emoji} ${stageInfo.chineseName || stageInfo.name} · ${pet.name}`), W),
    center(COLORS.dim(`阶段: ${stageLabel}  |  心情: ${pet.getMood()}`), W),
    center('', W),
  ];

  console.log(box(petLines, W));
  console.log();

  // Stats panel
  const expNeeded = pet.level * 50;
  const battleRecord = `${COLORS.good(String(pet.wins))}胜 ${COLORS.bad(String(pet.losses))}败`;

  const statLines = [
    center(COLORS.title('— 状态栏 —'), W),
    '',
    ` ${COLORS.label('等级')}  Lv.${COLORS.value(String(pet.level).padEnd(3))}  ` +
      `${COLORS.label('经验')} ${COLORS.good(String(pet.exp).padStart(3))}/${expNeeded}  ` +
      `${COLORS.label('战绩')} ${battleRecord}`,
    ` ${COLORS.label('年龄')}  ${COLORS.value(pet.getAgeString().padEnd(14))}  ` +
      `${COLORS.label('属性')} ${digimon.emoji} ${digimon.chineseName}`,
    '',
    ` ${COLORS.label('饱食度')} ${hungerBar(pet.hunger)}  ${statNum(MAX_STAT - pet.hunger)}%`,
    ` ${COLORS.label('快乐值')} ${statBar(pet.happiness)}  ${statNum(pet.happiness)}%`,
    ` ${COLORS.label('精力值')} ${statBar(pet.energy)}  ${statNum(pet.energy)}%`,
    ` ${COLORS.label('健康值')} ${statBar(pet.health)}  ${statNum(pet.health)}%`,
    '',
  ];

  console.log(box(statLines, W));
  console.log();
}

// ──────────────────────────────────────────────────────────────────────
// Menu
// ──────────────────────────────────────────────────────────────────────
export function renderMenu(pet) {
  if (pet.isDead) {
    console.log(COLORS.bad('  你的数码宝贝已经离开了...'));
    console.log();
    console.log(`  ${COLORS.action('[R]')} 孵化新数码宝贝    ${COLORS.action('[Q]')} 退出`);
    return;
  }

  const actions = [
    { key: '1', label: '喂食',   icon: '🍖' },
    { key: '2', label: '玩耍',   icon: '🎾' },
    { key: '3', label: '睡觉',   icon: '💤' },
    { key: '4', label: '治疗',   icon: '💊' },
    { key: '5', label: '洗澡',   icon: '🛁' },
    { key: '6', label: '对战',   icon: '⚔️ ' },
    { key: 'r', label: '重新孵化', icon: '🥚' },
    { key: 'q', label: '退出',   icon: '👋' },
  ];

  console.log(COLORS.dim('  ───────────────────────────────────────────────────'));
  const row1 = actions.slice(0, 4).map(a =>
    `  ${COLORS.action('[' + a.key + ']')} ${a.label}`).join('  ');
  const row2 = actions.slice(4).map(a =>
    `  ${COLORS.action('[' + a.key + ']')} ${a.label}`).join('  ');
  console.log(row1);
  console.log(row2);
  console.log(COLORS.dim('  ───────────────────────────────────────────────────'));
}

// ──────────────────────────────────────────────────────────────────────
// Messages
// ──────────────────────────────────────────────────────────────────────
export function renderMessage(msg, isError = false) {
  if (!msg) return;
  const color = isError ? COLORS.bad : COLORS.good;
  console.log();
  console.log('  ' + color('▶ ' + msg));
}

export function renderLevelUp(level) {
  console.log();
  console.log(COLORS.levelup(`  ★ 升级了！现在是 Lv.${level}！★`));
}

export function renderEvolution(stageLabel) {
  console.log();
  console.log(COLORS.evolve(`  ✦ 进化！${stageLabel} ！✦`));
  console.log(COLORS.evolve('  数码宝贝进化了！变得更强大了！'));
}

// ──────────────────────────────────────────────────────────────────────
// Feed submenu
// ──────────────────────────────────────────────────────────────────────
export async function renderFeedMenu() {
  const foods = [
    { key: '1', type: 'normal', name: '普通餐',  desc: '饱食+25, 快乐+5' },
    { key: '2', type: 'snack',  name: '零食',    desc: '饱食+10, 快乐+15' },
    { key: '3', type: 'veggie', name: '蔬菜',    desc: '饱食+20, 精力+8' },
    { key: '4', type: 'meat',   name: '肉类',    desc: '饱食+35, 精力+15' },
    { key: '0', type: null,     name: '取消',    desc: '' },
  ];

  console.log();
  console.log(COLORS.title('  选择食物:'));
  foods.forEach(f => {
    console.log(`    ${COLORS.action('[' + f.key + ']')} ${f.name.padEnd(8)} ${COLORS.dim(f.desc)}`);
  });
  process.stdout.write('\n  > ');

  return new Promise(resolve => {
    subMenuKeyHandler = (str, key) => {
      if (key && key.ctrl && key.name === 'c') {
        subMenuKeyHandler = null;
        process.exit(0);
      }
      const ch  = (str || '').trim();
      const map = { '1': 'normal', '2': 'snack', '3': 'veggie', '4': 'meat' };
      subMenuKeyHandler = null;
      process.stdout.write((ch || '0') + '\n');
      resolve(map[ch] || null);
    };
  });
}

// ──────────────────────────────────────────────────────────────────────
// Adoption / hatching screen
// ──────────────────────────────────────────────────────────────────────
export async function renderAdoptScreen() {
  clearScreen();
  console.log(COLORS.title(center('✦ 选择你的数码宝贝伙伴 ✦', 54)));
  console.log();

  const entries = Object.entries(DIGIMON);
  entries.forEach(([key, d], i) => {
    // Show the egg + rookie frame side by side as preview
    const eggFrame    = d.stages[0].frames.idle;
    const rookieFrame = d.stages[3].frames.idle;
    console.log(COLORS.action(`  [${i + 1}] ${d.emoji} ${d.chineseName}  —  ${d.description}`));
    console.log(COLORS.dim(`       进化路线：蛋 → ${d.stages[1].chineseName || d.stages[1].name} → ${d.stages[2].chineseName || d.stages[2].name} → ${d.stages[3].chineseName || d.stages[3].name} → ${d.stages[4].chineseName || d.stages[4].name} → ${d.stages[5].chineseName || d.stages[5].name}`));
    console.log();
    // Show egg art
    console.log(COLORS.dim('       🥚 初始形态:'));
    eggFrame.forEach(l => console.log('         ' + COLORS.pet(l)));
    console.log(COLORS.dim(`       ⚔️  青年期: ${d.stages[3].chineseName || d.stages[3].name}`));
    rookieFrame.forEach(l => console.log('         ' + COLORS.pet(l)));
    console.log();
  });

  console.log(COLORS.dim('  [0] 取消'));
  console.log();

  const typeMap = { '1': 'agumon', '2': 'gabumon', '3': 'patamon' };
  const typeKey = await prompt('  选择数码宝贝 > ');
  const selectedType = typeMap[typeKey];
  if (!selectedType) return null;

  console.log();
  const name = await prompt('  给你的伙伴起个名字 > ');
  if (!name.trim()) return null;

  return { type: selectedType, name: name.trim() };
}

// ──────────────────────────────────────────────────────────────────────
// Key input plumbing
// ──────────────────────────────────────────────────────────────────────
let subMenuKeyHandler = null;

// Exported so battle.js can set/clear the handler
export function setSubMenuHandler(handler) {
  subMenuKeyHandler = handler;
}

export function setupKeyInput(onKey) {
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('keypress', (str, key) => {
    if (key && key.ctrl && key.name === 'c') process.exit(0);
    if (subMenuKeyHandler) {
      subMenuKeyHandler(str, key);
    } else {
      onKey(str, key);
    }
  });
}

function prompt(question) {
  process.stdout.write(question);
  return new Promise(resolve => {
    let buffer = '';
    subMenuKeyHandler = (str, key) => {
      if (key && key.ctrl && key.name === 'c') {
        subMenuKeyHandler = null;
        process.stdout.write('\n');
        process.exit(0);
      }
      if (key && (key.name === 'return' || key.name === 'enter')) {
        subMenuKeyHandler = null;
        process.stdout.write('\n');
        resolve(buffer);
        return;
      }
      if (key && key.name === 'escape') {
        subMenuKeyHandler = null;
        process.stdout.write('\n');
        resolve('');
        return;
      }
      if (key && (key.name === 'backspace' || key.name === 'delete')) {
        if (buffer.length > 0) {
          buffer = buffer.slice(0, -1);
          process.stdout.write('\b \b');
        }
        return;
      }
      if (str && !(key && key.ctrl) && !(key && key.meta)) {
        const code = str.charCodeAt(0);
        if (code >= 0x20 || str.length > 1) {
          buffer += str;
          process.stdout.write(str);
        }
      }
    };
  });
}
