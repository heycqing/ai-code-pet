import { DIGIMON, getStageInfo } from './ascii.js';

// ── Fighter builders ──────────────────────────────────────────────────────────

function buildPlayerFighter(pet) {
  const info = getStageInfo(pet.type, pet.stageIndex);
  const base = info.battleStats;
  const hpS  = 0.4 + (pet.health    / 100) * 0.6;
  const atkS = 0.5 + (pet.happiness / 100) * 0.5;
  const defS = 0.4 + (pet.health    / 100) * 0.6;
  return {
    type: pet.type, stageIndex: pet.stageIndex, name: pet.name,
    hp:      Math.max(5, Math.round(base.hp      * hpS)),
    maxHp:   Math.max(5, Math.round(base.hp      * hpS)),
    attack:  Math.max(1, Math.round(base.attack  * atkS)),
    defense: Math.max(1, Math.round(base.defense * defS)),
    speed: base.speed, special: base.special,
    specialPower: base.specialPower, isDefending: false,
  };
}

function buildEnemyFighter(playerStageIndex) {
  const types = Object.keys(DIGIMON);
  const type  = types[Math.floor(Math.random() * types.length)];
  const stage = Math.max(0, Math.min(5, playerStageIndex + Math.floor(Math.random() * 3) - 1));
  const info  = getStageInfo(type, stage);
  const base  = info.battleStats;
  return {
    type, stageIndex: stage,
    name: `野生${info.chineseName || info.name}`,
    hp: base.hp, maxHp: base.hp,
    attack: base.attack, defense: base.defense, speed: base.speed,
    special: base.special, specialPower: base.specialPower, isDefending: false,
  };
}

// ── Damage calc ───────────────────────────────────────────────────────────────

function calcDamage(attacker, defender, isSpecial) {
  const power   = isSpecial ? attacker.specialPower : attacker.attack * 2.5;
  const defense = defender.isDefending ? defender.defense * 2 : defender.defense;
  return Math.max(1, Math.round(power - defense + (Math.random() * 6 - 3)));
}

// ── Enemy AI ──────────────────────────────────────────────────────────────────

function doEnemyTurn(state) {
  const { player, enemy, log } = state;
  const roll = Math.random();
  enemy.isDefending = false;

  if (roll < 0.15) {
    enemy.isDefending = true;
    log.push(`${enemy.name} 摆出防御姿态！`);
  } else if (roll < 0.35) {
    const dmg = calcDamage(enemy, player, true);
    player.hp = Math.max(0, player.hp - dmg);
    log.push(`${enemy.name} 使用 ${enemy.special}！造成 ${dmg} 伤害`);
  } else {
    const dmg = calcDamage(enemy, player, false);
    player.hp = Math.max(0, player.hp - dmg);
    log.push(`${enemy.name} 攻击！造成 ${dmg} 伤害`);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Create the initial battle state.
 * Returns { cannotFight: true, msg } if the pet can't fight.
 */
export function createBattle(pet) {
  if (pet.energy < 20) return { cannotFight: true, msg: `${pet.name}精力不足，无法战斗！先休息一下。` };
  if (pet.health < 20) return { cannotFight: true, msg: `${pet.name}健康太差，不能战斗！先治疗。` };

  const player = buildPlayerFighter(pet);
  const enemy  = buildEnemyFighter(pet.stageIndex);
  const log    = [];

  log.push(`遭遇了 ${enemy.name}！准备战斗！`);

  const playerFirst = player.speed >= enemy.speed;
  log.push(playerFirst
    ? `${player.name} 速度更快，先手出击！`
    : `${enemy.name} 抢先出手！`
  );

  const state = { player, enemy, log, phase: 'player_turn', result: null };

  if (!playerFirst) {
    doEnemyTurn(state);
    if (player.hp <= 0) {
      log.push(`${player.name} 倒下了... 下次加油！`);
      state.phase = 'lost';
      state.result = { won: false, fled: false, expGain: 0 };
    }
  }

  return state;
}

/**
 * Process one player action: 'a' attack | 's' special | 'd' defend | 'f' flee
 * Mutates state in place and returns it (for convenience).
 * The caller should also pass `petEnergy` for special-use check and update pet.energy after.
 */
export function tickBattle(state, action, petEnergy) {
  if (state.phase !== 'player_turn') return state;

  const { player, enemy, log } = state;
  player.isDefending = false;
  let energyUsed = 0;

  if (action === 'f') {
    if (Math.random() < 0.6) {
      log.push(`${player.name} 成功逃脱！`);
      state.phase  = 'fled';
      state.result = { won: false, fled: true, expGain: 0 };
      return state;
    }
    log.push('逃跑失败！');
  } else if (action === 'a') {
    const dmg = calcDamage(player, enemy, false);
    enemy.hp  = Math.max(0, enemy.hp - dmg);
    log.push(`${player.name} 普通攻击！造成 ${dmg} 伤害`);
  } else if (action === 's') {
    if (petEnergy < 20) {
      log.push('精力不足，特殊技能失败！');
    } else {
      const dmg = calcDamage(player, enemy, true);
      enemy.hp  = Math.max(0, enemy.hp - dmg);
      energyUsed = 15;
      log.push(`${player.name} 使用 ${player.special}！造成 ${dmg} 伤害`);
    }
  } else if (action === 'd') {
    player.isDefending = true;
    log.push(`${player.name} 进入防御姿态！`);
  }

  // Check enemy defeat
  if (enemy.hp <= 0) {
    const expGain = Math.round(enemy.maxHp * 0.6);
    log.push(`★ 胜利！${player.name} 击败了 ${enemy.name}！★`);
    log.push(`获得 ${expGain} 点经验值！`);
    state.phase  = 'won';
    state.result = { won: true, fled: false, expGain, energyUsed };
    return state;
  }

  // Enemy turn
  doEnemyTurn(state);

  if (player.hp <= 0) {
    log.push(`${player.name} 倒下了... 下次加油！`);
    state.phase  = 'lost';
    state.result = { won: false, fled: false, expGain: 0, energyUsed };
    return state;
  }

  state.result = { energyUsed };
  return state;
}
