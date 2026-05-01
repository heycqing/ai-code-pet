import chalk from 'chalk';
import * as readline from 'readline';
import { getFrame, PETS } from './ascii.js';
import { MAX_STAT } from './pet.js';

const COLORS = {
  border: chalk.cyan,
  title: chalk.bold.yellow,
  label: chalk.gray,
  value: chalk.white,
  good: chalk.green,
  warn: chalk.yellow,
  bad: chalk.red,
  action: chalk.bold.cyan,
  dim: chalk.dim,
  pet: chalk.bold.white,
  menu: chalk.bold,
  highlight: chalk.bgCyan.black,
  levelup: chalk.bold.magenta,
};

function clearScreen() {
  process.stdout.write('\x1B[2J\x1B[0f');
}

function statBar(value, max = MAX_STAT, width = 20) {
  const filled = Math.round((value / max) * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);

  if (value / max > 0.6) return COLORS.good(bar);
  if (value / max > 0.3) return COLORS.warn(bar);
  return COLORS.bad(bar);
}

// Invert bar (for hunger: low is good)
function hungerBar(value, max = MAX_STAT, width = 20) {
  const displayValue = max - value;
  return statBar(displayValue, max, width);
}

function box(lines, width = 50) {
  const top = COLORS.border('╔' + '═'.repeat(width) + '╗');
  const bottom = COLORS.border('╚' + '═'.repeat(width) + '╝');
  const middle = lines.map(line => {
    const visible = stripAnsi(line);
    const pad = width - visible.length;
    return COLORS.border('║') + line + ' '.repeat(Math.max(0, pad)) + COLORS.border('║');
  });
  return [top, ...middle, bottom].join('\n');
}

function stripAnsi(str) {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B\[[0-9;]*m/g, '');
}

function center(text, width) {
  const visible = stripAnsi(text);
  const pad = Math.max(0, width - visible.length);
  const left = Math.floor(pad / 2);
  const right = pad - left;
  return ' '.repeat(left) + text + ' '.repeat(right);
}

export function renderPet(pet) {
  clearScreen();

  const state = pet.getState();
  const frame = getFrame(pet.type, state);
  const petInfo = PETS[pet.type];

  const W = 50;

  // Title bar
  console.log(COLORS.title(center(`✦ ASCII 宠物乐园 ✦`, W + 2)));
  console.log();

  // Pet display box
  const petLines = [
    center('', W),
    ...frame.map(l => center(COLORS.pet(l), W)),
    center('', W),
    center(COLORS.title(`${petInfo.name} · ${pet.name}`), W),
    center(COLORS.dim(`心情: ${pet.getMood()}`), W),
    center('', W),
  ];

  console.log(box(petLines, W));
  console.log();

  // Stats panel
  const expNeeded = pet.level * 50;
  const statLines = [
    center(COLORS.title('— 状态栏 —'), W),
    '',
    ` ${COLORS.label('等级')}  Lv.${COLORS.value(String(pet.level).padEnd(3))}  ${COLORS.label('经验')} ${COLORS.good(String(pet.exp).padStart(3))}/${expNeeded}`,
    ` ${COLORS.label('年龄')}  ${COLORS.value(pet.getAgeString().padEnd(10))}  ${COLORS.label('体重')} ${weightLabel(pet.weight)}`,
    '',
    ` ${COLORS.label('饱食度')} ${hungerBar(pet.hunger)}  ${statNumColor(MAX_STAT - pet.hunger)}%`,
    ` ${COLORS.label('快乐值')} ${statBar(pet.happiness)}  ${statNumColor(pet.happiness)}%`,
    ` ${COLORS.label('精力值')} ${statBar(pet.energy)}  ${statNumColor(pet.energy)}%`,
    ` ${COLORS.label('健康值')} ${statBar(pet.health)}  ${statNumColor(pet.health)}%`,
    '',
  ];

  console.log(box(statLines, W));
  console.log();
}

function statNumColor(val) {
  const n = Math.round(val);
  if (n > 60) return COLORS.good(String(n).padStart(3));
  if (n > 30) return COLORS.warn(String(n).padStart(3));
  return COLORS.bad(String(n).padStart(3));
}

function weightLabel(w) {
  if (w < 20) return COLORS.warn('偏瘦');
  if (w > 80) return COLORS.warn('偏胖');
  return COLORS.good('正常');
}

export function renderMenu(pet) {
  if (pet.isDead) {
    console.log(COLORS.bad('  你的宠物已经离开了...'));
    console.log();
    console.log(`  ${COLORS.action('[R]')} 收养新宠物    ${COLORS.action('[Q]')} 退出`);
    return;
  }

  const actions = [
    { key: '1', label: '喂食', icon: '🍖', hint: '缓解饥饿' },
    { key: '2', label: '玩耍', icon: '🎾', hint: '增加快乐' },
    { key: '3', label: '睡觉', icon: '💤', hint: '恢复精力' },
    { key: '4', label: '治疗', icon: '💊', hint: '恢复健康' },
    { key: '5', label: '洗澡', icon: '🛁', hint: '清洁心情' },
    { key: 'r', label: '领养', icon: '🐾', hint: '新宠物' },
    { key: 'q', label: '退出', icon: '👋', hint: '保存退出' },
  ];

  console.log(COLORS.dim('  ─────────────────────────────────────────────'));
  const row1 = actions.slice(0, 4).map(a =>
    `  ${COLORS.action('[' + a.key + ']')} ${a.label}`
  ).join('  ');
  const row2 = actions.slice(4).map(a =>
    `  ${COLORS.action('[' + a.key + ']')} ${a.label}`
  ).join('  ');
  console.log(row1);
  console.log(row2);
  console.log(COLORS.dim('  ─────────────────────────────────────────────'));
}

export function renderMessage(msg, isError = false) {
  if (!msg) return;
  const color = isError ? COLORS.bad : COLORS.good;
  console.log();
  console.log('  ' + color('▶ ' + msg));
}

export function renderLevelUp(level) {
  console.log();
  console.log(COLORS.levelup(`  ★ 升级了！现在是 Lv.${level} ！★`));
}

// Feed submenu
export async function renderFeedMenu() {
  const foods = [
    { key: '1', name: '普通饭', desc: '饱食+25, 快乐+5' },
    { key: '2', name: '零食',   desc: '饱食+10, 快乐+15' },
    { key: '3', name: '蔬菜',   desc: '饱食+20, 精力+8, 体重-2' },
    { key: '4', name: '肉类',   desc: '饱食+35, 精力+15, 体重+8' },
    { key: '0', name: '取消',   desc: '' },
  ];

  console.log();
  console.log(COLORS.title('  选择食物:'));
  foods.forEach(f => {
    console.log(`    ${COLORS.action('[' + f.key + ']')} ${f.name.padEnd(8)} ${COLORS.dim(f.desc)}`);
  });
  process.stdout.write('\n  > ');

  // Keep raw mode on and just grab a single keypress — avoids fighting with
  // the main keypress listener and removes the need for a nested readline.
  return new Promise(resolve => {
    subMenuKeyHandler = (str, key) => {
      if (key && key.ctrl && key.name === 'c') {
        subMenuKeyHandler = null;
        process.exit(0);
      }
      const ch = (str || '').trim();
      const map = { '1': 'normal', '2': 'snack', '3': 'veggie', '4': 'meat' };
      // Any other key (including '0', Enter, ESC) cancels.
      subMenuKeyHandler = null;
      process.stdout.write((ch || '0') + '\n');
      resolve(map[ch] || null);
    };
  });
}

// Adoption screen
export async function renderAdoptScreen() {
  clearScreen();
  console.log(COLORS.title(center('✦ 领养新宠物 ✦', 52)));
  console.log();

  const types = Object.entries(PETS);
  types.forEach(([, info], i) => {
    console.log(COLORS.action(`  [${i + 1}] ${info.name}`));
    info.frames.idle.forEach(line => {
      console.log('      ' + COLORS.pet(line));
    });
    console.log();
  });

  console.log(COLORS.dim('  [0] 取消'));
  console.log();

  const typeKey = await prompt('  选择宠物类型 > ');
  const typeMap = { '1': 'cat', '2': 'dog', '3': 'bunny' };
  const selectedType = typeMap[typeKey];
  if (!selectedType) return null;

  console.log();
  const name = await prompt('  给你的宠物起个名字 > ');
  if (!name.trim()) return null;

  return { type: selectedType, name: name.trim() };
}

// Line prompt implemented on top of the shared raw-mode keypress stream.
// Avoids spawning a nested readline.Interface, which used to leave stdin
// in an inconsistent (paused / wrong mode) state after the adoption flow
// and caused the main menu to stop receiving keys.
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
          // Assume 1-column erase; good enough for CJK here too since
          // the terminal renders over the previous cell.
          buffer = buffer.slice(0, -1);
          process.stdout.write('\b \b');
        }
        return;
      }
      // Printable characters (including multi-byte sequences like CJK)
      if (str && !(key && key.ctrl) && !(key && key.meta)) {
        // Filter out lone control bytes
        const code = str.charCodeAt(0);
        if (code >= 0x20 || str.length > 1) {
          buffer += str;
          process.stdout.write(str);
        }
      }
    };
  });
}

// Temporary handler for sub-menus; when set, overrides the main handler
let subMenuKeyHandler = null;

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
