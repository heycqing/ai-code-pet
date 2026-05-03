// Expedition system — send pet on timed adventures while away

const MIN = 60 * 1000;

export const ZONES = [
  {
    key: 'wild',
    name: '数字荒野',
    emoji: '🌿',
    desc: '平静的数字森林，适合初次冒险',
    duration: 30 * MIN,
    minLevel: 1,
    expRange: [15, 30],
    risk: '低',
  },
  {
    key: 'ruins',
    name: '古代遗迹',
    emoji: '🏛️',
    desc: '神秘遗迹，充满未知宝藏',
    duration: 60 * MIN,
    minLevel: 3,
    expRange: [40, 80],
    risk: '中',
  },
  {
    key: 'volcano',
    name: '火焰山',
    emoji: '🌋',
    desc: '危险的高温地带，丰厚战利品',
    duration: 2 * 60 * MIN,
    minLevel: 6,
    expRange: [100, 180],
    risk: '高',
  },
  {
    key: 'abyss',
    name: '黑暗深渊',
    emoji: '🌑',
    desc: '极度危险，传说中的终极宝藏',
    duration: 4 * 60 * MIN,
    minLevel: 11,
    expRange: [250, 400],
    risk: '极高',
  },
];

// Each event: desc + stat deltas (positive = gain, negative = loss, applied to pet)
const EVENTS = {
  wild: [
    { desc: '在草丛里发现了野果，美美地吃了一顿',         hunger: -20, happiness: 5 },
    { desc: '遇到了友好的数码兽，一起在草地上嬉戏',       happiness: 20, energy: -5 },
    { desc: '在清澈小溪边打了个盹，精力大复活',           energy: 20 },
    { desc: '迷路了，绕了好大一圈才找到路',               energy: -10, hunger: 8 },
    { desc: '发现了一棵结满果实的大树，摘了好多带回来',   hunger: -15, happiness: 10 },
    { desc: '遭遇了弱小的野生数码兽，轻松击退！',         happiness: 10 },
  ],
  ruins: [
    { desc: '深入遗迹核心，吸收了古代能量结晶的力量',     happiness: 10, health: -8 },
    { desc: '与遗迹守卫大战一场，险胜！全身是伤但很爽',   health: -20, happiness: 20 },
    { desc: '发现了隐藏的食物储藏室，里面还有好多干粮',   hunger: -30, energy: 10 },
    { desc: '被机关绊倒，掉进了暗坑里，好疼',             health: -12, energy: -8 },
    { desc: '找到了古代能量石，浑身充满了力量',           energy: 25 },
    { desc: '与遗迹的数字幽灵周旋了许久，累得虚脱',       energy: -20, happiness: -5 },
  ],
  volcano: [
    { desc: '在火山口挖出了稀有矿石，忍着高温凿了好久',   health: -20, energy: -10 },
    { desc: '遭遇强大的火属性数码兽！浴血奋战终于胜利！', health: -30, happiness: 25 },
    { desc: '差点掉进岩浆，拼命逃了出来，好险',           health: -15, energy: -15, happiness: -10 },
    { desc: '发现了火山深处的神秘清泉！在火海中格外甘甜', health: 20, energy: 20 },
    { desc: '在极端高温中不断磨砺，意志力更坚定了',       health: -20, happiness: 20 },
  ],
  abyss: [
    { desc: '深渊中遭遇了传说级数码兽！死战后仅以毫厘之差逃脱', health: -40, happiness: 15 },
    { desc: '在最深处找到了古代数码世界的遗产',           energy: -20, happiness: 10 },
    { desc: '被深渊黑暗腐蚀了一部分生命力，但同时也吸收了黑暗的力量', health: -25, happiness: -10 },
    { desc: '意外发现入口处的隐藏宝藏室，满载而归！',     hunger: -40, happiness: 35 },
    { desc: '与深渊主宰正面交锋，虽未全胜，却窥见了绝技的奥秘', health: -35, energy: -25 },
  ],
};

export function startExpedition(pet, zoneKey) {
  const zone = ZONES.find(z => z.key === zoneKey);
  if (!zone)               return { success: false, msg: '未知的远征区域' };
  if (pet.isDead)          return { success: false, msg: '数码宝贝已经离开了...' };
  if (pet.expedition)      return { success: false, msg: '已经在远征中了！' };
  if (pet.level < zone.minLevel)
    return { success: false, msg: `需要 Lv.${zone.minLevel} 才能进入${zone.name}` };
  if (pet.energy < 20)     return { success: false, msg: `${pet.name}太累了，无法出发！` };
  if (pet.hunger >= 80)    return { success: false, msg: `${pet.name}太饿了，先喂食再出发！` };

  pet.expedition = {
    zone: zoneKey,
    startTime: Date.now(),
    duration: zone.duration,
  };
  pet.energy = Math.max(0, pet.energy - 10);

  return { success: true, msg: `${pet.name}出发去${zone.name}了！预计 ${formatDuration(zone.duration)} 后返回。` };
}

// Returns null if no expedition; { ongoing, remaining, zoneKey } or { ongoing: false, result, zoneKey }
export function checkExpedition(pet) {
  if (!pet.expedition) return null;
  const { zone: zoneKey, startTime, duration } = pet.expedition;
  const elapsed = Date.now() - startTime;

  if (elapsed < duration) {
    return { ongoing: true, remaining: duration - elapsed, zoneKey };
  }

  const zone = ZONES.find(z => z.key === zoneKey);
  const result = generateResult(zone, elapsed);
  pet.expedition = null;
  return { ongoing: false, result, zoneKey };
}

function generateResult(zone, elapsed) {
  const pool = EVENTS[zone.key] || EVENTS.wild;
  const count = 2 + Math.floor(Math.random() * 2); // 2 or 3 events
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, Math.min(count, shuffled.length));

  const [minExp, maxExp] = zone.expRange;
  const expGain = Math.floor(minExp + Math.random() * (maxExp - minExp));

  const totals = { exp: expGain, hunger: 0, happiness: 0, energy: 0, health: 0 };
  for (const ev of picked) {
    for (const [k, v] of Object.entries(ev)) {
      if (k === 'desc') continue;
      totals[k] = (totals[k] ?? 0) + v;
    }
  }

  return { events: picked.map(e => e.desc), totals, zone };
}

export function applyExpeditionResult(pet, result) {
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const { totals } = result;

  if (totals.hunger)    pet.hunger    = clamp(pet.hunger    + totals.hunger,    0, 100);
  if (totals.happiness) pet.happiness = clamp(pet.happiness + totals.happiness, 0, 100);
  if (totals.energy)    pet.energy    = clamp(pet.energy    + totals.energy,    0, 100);
  if (totals.health)    pet.health    = clamp(pet.health    + totals.health,    0, 100);

  // Expedition cannot kill the pet — leave it at 1 HP if it would die
  if (pet.health <= 0) pet.health = 1;

  return pet.gainExp(totals.exp);
}

export function formatDuration(ms) {
  const mins = Math.round(ms / MIN);
  if (mins < 60) return `${mins} 分钟`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} 小时` : `${h} 小时 ${m} 分钟`;
}
