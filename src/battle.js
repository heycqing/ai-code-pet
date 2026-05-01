import chalk from 'chalk';
import { DIGIMON, getStageInfo, getFrame } from './ascii.js';
import { setSubMenuHandler } from './ui.js';

const C = {
  title:   chalk.bold.yellow,
  player:  chalk.bold.cyan,
  enemy:   chalk.bold.red,
  damage:  chalk.bold.red,
  special: chalk.bold.magenta,
  defend:  chalk.bold.blue,
  info:    chalk.white,
  win:     chalk.bold.green,
  lose:    chalk.bold.red,
  flee:    chalk.yellow,
  border:  chalk.cyan,
  dim:     chalk.dim,
};

function clearScreen() {
  process.stdout.write('\x1B[2J\x1B[0f');
}

function hpBar(hp, maxHp, width = 14) {
  const filled = Math.max(0, Math.round((hp / maxHp) * width));
  const empty  = width - filled;
  const bar    = '█'.repeat(filled) + '░'.repeat(empty);
  const ratio  = hp / maxHp;
  if (ratio > 0.5) return chalk.green(bar);
  if (ratio > 0.25) return chalk.yellow(bar);
  return chalk.red(bar);
}

function padLines(lines, height, width) {
  const out = [...lines];
  while (out.length < height) out.unshift('');
  return out.map(l => {
    const visible = l.replace(/\x1B\[[0-9;]*m/g, '');
    return l + ' '.repeat(Math.max(0, width - visible.length));
  });
}

// ──────────────────────────────────────────────────────────────────────
// Fighter builder
// ──────────────────────────────────────────────────────────────────────
function buildPlayerFighter(pet) {
  const info  = getStageInfo(pet.type, pet.stageIndex);
  const base  = info.battleStats;

  const hpScale  = 0.4 + (pet.health    / 100) * 0.6;
  const atkScale = 0.5 + (pet.happiness / 100) * 0.5;
  const defScale = 0.4 + (pet.health    / 100) * 0.6;

  return {
    type:         pet.type,
    stageIndex:   pet.stageIndex,
    name:         pet.name,
    hp:           Math.max(5, Math.round(base.hp      * hpScale)),
    maxHp:        Math.max(5, Math.round(base.hp      * hpScale)),
    attack:       Math.max(1, Math.round(base.attack  * atkScale)),
    defense:      Math.max(1, Math.round(base.defense * defScale)),
    speed:        base.speed,
    special:      base.special,
    specialPower: base.specialPower,
    isDefending:  false,
  };
}

function buildEnemyFighter(playerStageIndex) {
  const types = Object.keys(DIGIMON);
  const type  = types[Math.floor(Math.random() * types.length)];
  // Stage: same ± 1, clamped
  const stage = Math.max(0, Math.min(5, playerStageIndex + Math.floor(Math.random() * 3) - 1));
  const info  = getStageInfo(type, stage);
  const base  = info.battleStats;
  const displayName = info.chineseName || info.name;

  return {
    type,
    stageIndex:   stage,
    name:         `野生${displayName}`,
    hp:           base.hp,
    maxHp:        base.hp,
    attack:       base.attack,
    defense:      base.defense,
    speed:        base.speed,
    special:      base.special,
    specialPower: base.specialPower,
    isDefending:  false,
  };
}

// ──────────────────────────────────────────────────────────────────────
// Damage calculation
// ──────────────────────────────────────────────────────────────────────
function calcDamage(attacker, defender, isSpecial) {
  const power   = isSpecial ? attacker.specialPower : attacker.attack * 2.5;
  const defense = defender.isDefending ? defender.defense * 2 : defender.defense;
  const variance = (Math.random() * 6) - 3;
  return Math.max(1, Math.round(power - defense + variance));
}

// ──────────────────────────────────────────────────────────────────────
// Rendering
// ──────────────────────────────────────────────────────────────────────
function renderBattle(player, enemy, log) {
  clearScreen();

  console.log(C.title('  ╔══════════════ ⚔  数码宝贝对战  ⚔ ══════════════╗'));
  console.log(C.title('  ╚═════════════════════════════════════════════════╝'));
  console.log();

  const playerFrames = getFrame(player.type, player.stageIndex, 'idle');
  const enemyFrames  = getFrame(enemy.type,  enemy.stageIndex,  'idle');
  const artH = Math.max(playerFrames.length, enemyFrames.length);
  const COL  = 18;

  const pl = padLines(playerFrames, artH, COL);
  const en = padLines(enemyFrames,  artH, COL);

  // Names + HP bars
  console.log(
    `  ${C.player(player.name.padEnd(COL))}      ${C.enemy(enemy.name)}`
  );
  console.log(
    `  ${hpBar(player.hp, player.maxHp)} ${String(player.hp).padStart(3)}/${player.maxHp}` +
    `  ${hpBar(enemy.hp,  enemy.maxHp)}  ${String(enemy.hp).padStart(3)}/${enemy.maxHp}`
  );
  console.log();

  // Side-by-side art
  for (let i = 0; i < artH; i++) {
    console.log(`  ${C.player(pl[i])}      ${C.enemy(en[i])}`);
  }
  console.log();

  // Battle log (last 3 lines)
  console.log(C.border('  ─────────────────────────────────────────────────'));
  const recent = log.slice(-3);
  // pad to 3 lines so layout is stable
  while (recent.length < 3) recent.unshift('');
  recent.forEach(entry => console.log(`  ${entry || ''}`));
  console.log(C.border('  ─────────────────────────────────────────────────'));
  console.log();
}

function renderBattleMenu(specialName, canSpecial) {
  const sp = canSpecial
    ? C.special(`[S] ${specialName}`)
    : C.dim(`[S] ${specialName}(精力不足)`);
  console.log(
    `  ${C.player('[A]')} 攻击   ${sp}   ${C.defend('[D]')} 防御   ${C.flee('[F]')} 逃跑`
  );
}

// ──────────────────────────────────────────────────────────────────────
// Key input promise
// ──────────────────────────────────────────────────────────────────────
function waitForBattleKey() {
  return new Promise(resolve => {
    setSubMenuHandler((str, key) => {
      if (key && key.ctrl && key.name === 'c') process.exit(0);
      const ch = (str || '').toLowerCase().trim();
      if (['a', 's', 'd', 'f'].includes(ch)) {
        setSubMenuHandler(null);
        process.stdout.write(ch + '\n');
        resolve(ch);
      }
    });
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ──────────────────────────────────────────────────────────────────────
// Enemy AI turn
// ──────────────────────────────────────────────────────────────────────
function doEnemyTurn(enemy, player, log) {
  const roll = Math.random();
  enemy.isDefending = false;

  if (roll < 0.15) {
    // Defend
    enemy.isDefending = true;
    log.push(`${C.enemy(enemy.name)} 摆出防御姿态！`);
  } else if (roll < 0.35) {
    // Special
    const dmg = calcDamage(enemy, player, true);
    player.hp  = Math.max(0, player.hp - dmg);
    log.push(`${C.enemy(enemy.name)} 使用 ${C.special(enemy.special)}！造成 ${C.damage(dmg + ' 伤害')}`);
  } else {
    // Normal attack
    const dmg = calcDamage(enemy, player, false);
    player.hp  = Math.max(0, player.hp - dmg);
    log.push(`${C.enemy(enemy.name)} 普通攻击！造成 ${C.damage(dmg + ' 伤害')}`);
  }
}

// ──────────────────────────────────────────────────────────────────────
// Main exported entry
// ──────────────────────────────────────────────────────────────────────
export async function startBattle(pet) {
  if (pet.energy < 20) {
    return { cannotFight: true, msg: `${pet.name}精力不足，无法战斗！先休息一下吧。` };
  }
  if (pet.health < 20) {
    return { cannotFight: true, msg: `${pet.name}健康状态太差，不能战斗！先治疗吧。` };
  }

  const player = buildPlayerFighter(pet);
  const enemy  = buildEnemyFighter(pet.stageIndex);
  const log    = [];

  // Opening
  log.push(C.info(`遭遇了 ${C.enemy(enemy.name)}！准备战斗！`));
  const playerFirst = player.speed >= enemy.speed;
  log.push(playerFirst
    ? C.player(`${player.name} 速度更快，先手出击！`)
    : C.enemy(`${enemy.name} 抢先出手！`));

  // If enemy goes first, resolve before player's first action
  if (!playerFirst) {
    doEnemyTurn(enemy, player, log);
    if (player.hp <= 0) {
      renderBattle(player, enemy, log);
      console.log(C.lose(`\n  ${player.name} 倒下了... 下次加油！`));
      await sleep(2000);
      return { won: false, fled: false, expGain: 0 };
    }
  }

  // Battle loop
  while (true) {
    renderBattle(player, enemy, log);
    renderBattleMenu(player.special, pet.energy >= 20);
    process.stdout.write('\n  > ');

    const action = await waitForBattleKey();
    player.isDefending = false;

    if (action === 'f') {
      if (Math.random() < 0.6) {
        log.push(C.flee(`${player.name} 成功逃脱！`));
        renderBattle(player, enemy, log);
        await sleep(1200);
        return { won: false, fled: true, expGain: 0 };
      }
      log.push(C.damage('逃跑失败！'));

    } else if (action === 'a') {
      const dmg = calcDamage(player, enemy, false);
      enemy.hp  = Math.max(0, enemy.hp - dmg);
      log.push(`${C.player(player.name)} 普通攻击！造成 ${C.damage(dmg + ' 伤害')}`);

    } else if (action === 's') {
      if (pet.energy < 20) {
        log.push(C.dim('精力不足，特殊技能失败！'));
      } else {
        const dmg = calcDamage(player, enemy, true);
        enemy.hp  = Math.max(0, enemy.hp - dmg);
        pet.energy = Math.max(0, pet.energy - 15);
        log.push(`${C.player(player.name)} 使用 ${C.special(player.special)}！造成 ${C.damage(dmg + ' 伤害')}`);
      }

    } else if (action === 'd') {
      player.isDefending = true;
      log.push(`${C.player(player.name)} ${C.defend('进入防御姿态！')}`);
    }

    // Check enemy defeat
    if (enemy.hp <= 0) {
      renderBattle(player, enemy, log);
      const expGain = Math.round(enemy.maxHp * 0.6);
      console.log(C.win(`\n  ★ 胜利！${player.name} 击败了 ${enemy.name}！★`));
      console.log(C.win(`  获得 ${expGain} 点经验值！`));
      await sleep(2000);
      return { won: true, fled: false, expGain };
    }

    // Enemy turn
    doEnemyTurn(enemy, player, log);

    // Check player defeat
    if (player.hp <= 0) {
      renderBattle(player, enemy, log);
      console.log(C.lose(`\n  ${player.name} 倒下了... 下次加油！`));
      await sleep(2000);
      return { won: false, fled: false, expGain: 0 };
    }
  }
}
