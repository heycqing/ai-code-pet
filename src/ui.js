import chalk from 'chalk';
import * as readline from 'readline';
import { getSprite, SPRITE_WIDTH, LCD_BG } from './pixelRenderer.js';
import { DIGIMON, STAGE_LABELS } from './ascii.js';
import { MAX_STAT } from './pet.js';
import { ZONES, formatDuration } from './expedition.js';

const COLORS = {
  border:  chalk.cyan,
  title:   chalk.bold.yellow,
  label:   chalk.gray,
  value:   chalk.white,
  good:    chalk.green,
  warn:    chalk.yellow,
  bad:     chalk.red,
  action:  chalk.bold.cyan,
  dim:     chalk.dim,
  pet:     chalk.bold.white,
  levelup: chalk.bold.magenta,
  evolve:  chalk.bold.green,
  speech:  chalk.bold.whiteBright,
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

function box(lines, width = 64) {
  const top    = COLORS.border('╔' + '═'.repeat(width) + '╗');
  const bottom = COLORS.border('╚' + '═'.repeat(width) + '╝');
  const middle = lines.map(line => {
    const visible = stripAnsi(line);
    const pad     = width - visible.length;
    return COLORS.border('║') + line + ' '.repeat(Math.max(0, pad)) + COLORS.border('║');
  });
  return [top, ...middle, bottom].join('\n');
}

// ─────────────────────────────────────────────
// Main pet display
// ─────────────────────────────────────────────
export function renderPet(pet) {
  clearScreen();

  const state      = pet.getState();
  const spriteRows = getSprite(pet.type, pet.stageIndex, state);
  const digimon    = DIGIMON[pet.type];
  const stageInfo  = pet.stageInfo;
  const stageLabel = STAGE_LABELS[pet.stageIndex] ?? '';

  const W = 64; // box inner width

  console.log(COLORS.title(center('✦ 数码宝贝养成 ✦', W + 2)));
  console.log();

  // Pixel art sprite — wrapped in a Tamagotchi-style LCD screen frame
  const lcdInnerW = SPRITE_WIDTH + 4; // sprite(32) + 2-char padding each side = 36
  const lcdPad    = chalk.bgHex(LCD_BG)('  ');                        // 2 dark chars
  const lcdFull   = chalk.bgHex(LCD_BG)(' '.repeat(lcdInnerW));       // full-width LCD row
  const wall      = COLORS.dim('│');
  const lcdTop    = COLORS.dim('┌' + '─'.repeat(lcdInnerW) + '┐');
  const lcdBot    = COLORS.dim('└' + '─'.repeat(lcdInnerW) + '┘');

  const petLines = [
    center('', W),
    center(lcdTop, W),
    center(wall + lcdFull + wall, W),
    ...spriteRows.map(l => center(wall + lcdPad + l + lcdPad + wall, W)),
    center(wall + lcdFull + wall, W),
    center(lcdBot, W),
    center('', W),
    center(COLORS.title(`${digimon.emoji} ${stageInfo.chineseName || stageInfo.name} · ${pet.name}`), W),
    center(COLORS.dim(`阶段: ${stageLabel}  |  心情: ${pet.getMood()}`), W),
    center('', W),
  ];

  console.log(box(petLines, W));
  console.log();

  // Stats panel
  const expNeeded    = pet.level * 50;
  const battleRecord = `${COLORS.good(String(pet.wins))}胜 ${COLORS.bad(String(pet.losses))}败`;

  const expeditionLine = pet.expedition ? (() => {
    const zone = ZONES.find(z => z.key === pet.expedition.zone);
    const remaining = pet.expedition.duration - (Date.now() - pet.expedition.startTime);
    const timeStr = remaining > 0 ? formatDuration(Math.max(0, remaining)) : '即将归来...';
    return ` ${chalk.bold.yellow('◈ 远征中')}  ${zone ? zone.emoji + ' ' + zone.name : ''}  ${COLORS.dim('剩余:')} ${chalk.yellow(timeStr)}`;
  })() : null;

  const statLines = [
    center(COLORS.title('— 状态栏 —'), W),
    '',
    ` ${COLORS.label('等级')}  Lv.${COLORS.value(String(pet.level).padEnd(3))}  ` +
      `${COLORS.label('经验')} ${COLORS.good(String(pet.exp).padStart(3))}/${expNeeded}  ` +
      `${COLORS.label('战绩')} ${battleRecord}`,
    ` ${COLORS.label('年龄')}  ${COLORS.value(pet.getAgeString().padEnd(14))}  ` +
      `${COLORS.label('属性')} ${digimon.emoji} ${digimon.chineseName}`,
    '',
    ...(expeditionLine ? [expeditionLine, ''] : []),
    ` ${COLORS.label('饱食度')} ${hungerBar(pet.hunger)}  ${statNum(MAX_STAT - pet.hunger)}%`,
    ` ${COLORS.label('快乐值')} ${statBar(pet.happiness)}  ${statNum(pet.happiness)}%`,
    ` ${COLORS.label('精力值')} ${statBar(pet.energy)}  ${statNum(pet.energy)}%`,
    ` ${COLORS.label('健康值')} ${statBar(pet.health)}  ${statNum(pet.health)}%`,
    '',
  ];

  console.log(box(statLines, W));
  console.log();
}

// ─────────────────────────────────────────────
// Menu
// ─────────────────────────────────────────────
export function renderMenu(pet) {
  if (pet.isDead) {
    console.log(COLORS.bad('  你的数码宝贝已经离开了...'));
    console.log();
    console.log(`  ${COLORS.action('[R]')} 孵化新数码宝贝    ${COLORS.action('[Q]')} 退出`);
    return;
  }

  const onExpedition = !!pet.expedition;
  const expLabel = onExpedition ? chalk.dim('远征中..') : '远征 🗺️';

  const actions = [
    { key: '1', label: '喂食'    },
    { key: '2', label: '玩耍'    },
    { key: '3', label: '睡觉'    },
    { key: '4', label: '治疗'    },
    { key: '5', label: '洗澡'    },
    { key: '6', label: '对战 ⚔️'  },
    { key: '7', label: expLabel  },
    { key: 'r', label: '重新孵化' },
    { key: 'q', label: '退出'    },
  ];

  console.log(COLORS.dim('  ────────────────────────────────────────────────────'));
  const row1 = actions.slice(0, 4).map(a => `  ${COLORS.action('[' + a.key + ']')} ${a.label}`).join('  ');
  const row2 = actions.slice(4, 7).map(a => `  ${COLORS.action('[' + a.key + ']')} ${a.label}`).join('  ');
  const row3 = actions.slice(7).map(a => `  ${COLORS.action('[' + a.key + ']')} ${a.label}`).join('  ');
  console.log(row1);
  console.log(row2);
  console.log(row3);
  console.log(COLORS.dim('  ────────────────────────────────────────────────────'));
}

// ─────────────────────────────────────────────
// Messages
// ─────────────────────────────────────────────
export function renderMessage(msg, isError = false, isSpeech = false) {
  if (!msg) return;
  console.log();
  if (isSpeech) {
    console.log('  ' + COLORS.speech(`「${msg}」`));
  } else {
    const color = isError ? COLORS.bad : COLORS.good;
    console.log('  ' + color('▶ ' + msg));
  }
}

export function renderLevelUp(level) {
  console.log();
  console.log(COLORS.levelup(`  ★ 升级了！现在是 Lv.${level}！★`));
}

export function renderEvolution(stageLabel) {
  console.log();
  console.log(COLORS.evolve(`  ✦ 进化！${stageLabel}！✦`));
  console.log(COLORS.evolve('  数码宝贝进化了，变得更强大了！'));
}

// ─────────────────────────────────────────────
// Feed submenu
// ─────────────────────────────────────────────
export async function renderFeedMenu() {
  const foods = [
    { key: '1', type: 'normal', name: '普通餐',  desc: '饱食+25, 快乐+5'  },
    { key: '2', type: 'snack',  name: '零食',    desc: '饱食+10, 快乐+15' },
    { key: '3', type: 'veggie', name: '蔬菜',    desc: '饱食+20, 精力+8'  },
    { key: '4', type: 'meat',   name: '肉类',    desc: '饱食+35, 精力+15' },
    { key: '0', type: null,     name: '取消',    desc: ''                 },
  ];

  console.log();
  console.log(COLORS.title('  选择食物:'));
  foods.forEach(f => {
    console.log(`    ${COLORS.action('[' + f.key + ']')} ${f.name.padEnd(8)} ${COLORS.dim(f.desc)}`);
  });
  process.stdout.write('\n  > ');

  return new Promise(resolve => {
    subMenuKeyHandler = (str, key) => {
      if (key && key.ctrl && key.name === 'c') { subMenuKeyHandler = null; process.exit(0); }
      const ch  = (str || '').trim();
      const map = { '1': 'normal', '2': 'snack', '3': 'veggie', '4': 'meat' };
      subMenuKeyHandler = null;
      process.stdout.write((ch || '0') + '\n');
      resolve(map[ch] || null);
    };
  });
}

// ─────────────────────────────────────────────
// Adoption / hatching screen
// ─────────────────────────────────────────────
export async function renderAdoptScreen() {
  clearScreen();
  console.log(COLORS.title(center('✦ 选择你的数码宝贝伙伴 ✦', 58)));
  console.log();

  const entries = Object.entries(DIGIMON);
  for (const [key, d] of entries) {
    const idx = entries.findIndex(([k]) => k === key);
    // Show egg sprite preview
    const eggSprite = getSprite(key, 0, 'idle');
    console.log(COLORS.action(`  [${idx + 1}] ${d.emoji} ${d.chineseName}  —  ${d.description}`));
    console.log(COLORS.dim(`       进化路线：${d.stages.map(s => s.chineseName || s.name).join(' → ')}`));
    console.log();
    eggSprite.forEach(l => console.log('    ' + l));
    console.log();
  }

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

// ─────────────────────────────────────────────
// Key input plumbing
// ─────────────────────────────────────────────
let subMenuKeyHandler = null;

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

// ─────────────────────────────────────────────
// Expedition submenu
// ─────────────────────────────────────────────
export async function renderExpeditionMenu(pet) {
  console.log();
  console.log(COLORS.title('  ─── 选择远征区域 ───'));
  console.log();

  const available = ZONES.map((z, i) => ({ ...z, idx: i + 1 }));
  for (const z of available) {
    const locked = pet.level < z.minLevel;
    const durationStr = formatDuration(z.duration);
    const levelStr    = `Lv.${z.minLevel}+`;
    const expStr      = `经验 ${z.expRange[0]}-${z.expRange[1]}`;
    if (locked) {
      console.log(COLORS.dim(`    [${z.idx}] ${z.emoji} ${z.name.padEnd(6)}  ${durationStr.padEnd(8)}  ${levelStr.padEnd(7)}  风险:${z.risk}  ${expStr}  🔒`));
    } else {
      console.log(`    ${COLORS.action('[' + z.idx + ']')} ${z.emoji} ${COLORS.value(z.name.padEnd(6))}  ${COLORS.dim(durationStr.padEnd(8))}  ${COLORS.dim(levelStr.padEnd(7))}  ${COLORS.dim('风险:' + z.risk)}  ${COLORS.good(expStr)}`);
      console.log(COLORS.dim(`         ${z.desc}`));
    }
    console.log();
  }
  console.log(COLORS.dim('    [0] 取消'));
  console.log();

  return new Promise(resolve => {
    process.stdout.write('  选择区域 > ');
    subMenuKeyHandler = (str, key) => {
      if (key && key.ctrl && key.name === 'c') { subMenuKeyHandler = null; process.exit(0); }
      const ch = (str || '').trim();
      subMenuKeyHandler = null;
      process.stdout.write(ch + '\n');
      const zone = available.find(z => String(z.idx) === ch);
      resolve(zone ? zone.key : null);
    };
  });
}

export function renderExpeditionResult(petName, result) {
  const { events, totals, zone } = result;
  console.log();
  console.log(COLORS.evolve(`  ✦ ${petName} 从 ${zone.emoji} ${zone.name} 回来了！✦`));
  console.log();
  console.log(COLORS.title('  ── 远征日记 ──'));
  console.log();
  for (const ev of events) {
    console.log(`    ${COLORS.dim('·')} ${COLORS.value(ev)}`);
  }
  console.log();
  console.log(COLORS.title('  ── 收获 ──'));
  console.log();
  console.log(`    ${COLORS.good('经验值')}  +${totals.exp}`);
  if (totals.hunger    < 0) console.log(`    ${COLORS.good('饱食度')}  ${totals.hunger}`);
  if (totals.happiness > 0) console.log(`    ${COLORS.good('快乐值')}  +${totals.happiness}`);
  if (totals.happiness < 0) console.log(`    ${COLORS.bad('快乐值')}  ${totals.happiness}`);
  if (totals.energy    > 0) console.log(`    ${COLORS.good('精力值')}  +${totals.energy}`);
  if (totals.energy    < 0) console.log(`    ${COLORS.bad('精力值')}  ${totals.energy}`);
  if (totals.health    > 0) console.log(`    ${COLORS.good('健康值')}  +${totals.health}`);
  if (totals.health    < 0) console.log(`    ${COLORS.bad('健康值')}  ${totals.health}`);
  console.log();
}

export async function waitForAnyKey(prompt = '  按任意键继续...') {
  process.stdout.write(prompt);
  return new Promise(resolve => {
    subMenuKeyHandler = (str, key) => {
      if (key && key.ctrl && key.name === 'c') { subMenuKeyHandler = null; process.exit(0); }
      subMenuKeyHandler = null;
      process.stdout.write('\n');
      resolve();
    };
  });
}

function prompt(question) {
  process.stdout.write(question);
  return new Promise(resolve => {
    let buffer = '';
    subMenuKeyHandler = (str, key) => {
      if (key && key.ctrl && key.name === 'c') { subMenuKeyHandler = null; process.stdout.write('\n'); process.exit(0); }
      if (key && (key.name === 'return' || key.name === 'enter')) {
        subMenuKeyHandler = null; process.stdout.write('\n'); resolve(buffer); return;
      }
      if (key && key.name === 'escape') {
        subMenuKeyHandler = null; process.stdout.write('\n'); resolve(''); return;
      }
      if (key && (key.name === 'backspace' || key.name === 'delete')) {
        if (buffer.length > 0) { buffer = buffer.slice(0, -1); process.stdout.write('\b \b'); }
        return;
      }
      if (str && !(key && key.ctrl) && !(key && key.meta)) {
        const code = str.charCodeAt(0);
        if (code >= 0x20 || str.length > 1) { buffer += str; process.stdout.write(str); }
      }
    };
  });
}
