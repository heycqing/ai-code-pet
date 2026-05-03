// Pet metadata: evolution stages, names, battle stats
// Visual sprites live in sprites.js (PNG) — pixels.js is legacy only

export const STAGE_NAMES  = ['蛋', '幼年期', '少年期', '青年期', '成熟期', '完全体'];
export const STAGE_LABELS = ['🥚 蛋', '🐣 幼年', '🌱 少年', '⚔️  青年', '🔥 进化', '👑 超进化'];

export const STAGE_LEVEL_THRESHOLDS = [0, 1, 3, 6, 11, 18];

export const DIGIMON = {
  hundun: {
    chineseName: '混沌异兽',
    emoji: '🌀',
    description: '《山海经》意象中的上古混沌神兽，状如黄囊，赤如丹火，六足四翼，无面目',
    stages: [
      { stage: 'egg',        name: '混沌胎',   chineseName: '混沌胎',
        battleStats: { hp: 10,  attack: 1,  defense: 1,  speed: 2,  special: '胎息',    specialPower: 3  } },
      { stage: 'baby',       name: '玄囊',     chineseName: '玄囊',
        battleStats: { hp: 28,  attack: 5,  defense: 3,  speed: 4,  special: '混沌气',  specialPower: 11 } },
      { stage: 'inTraining', name: '丹囊',     chineseName: '丹囊',
        battleStats: { hp: 52,  attack: 10, defense: 7,  speed: 7,  special: '丹火卷',  specialPower: 21 } },
      { stage: 'rookie',     name: '无窍兽',   chineseName: '无窍兽',
        battleStats: { hp: 92,  attack: 20, defense: 13, speed: 10, special: '玄黄冲',  specialPower: 40 } },
      { stage: 'champion',   name: '四翼浑敦', chineseName: '四翼浑敦',
        battleStats: { hp: 152, attack: 35, defense: 23, speed: 14, special: '四翼乱流', specialPower: 70 } },
      { stage: 'ultimate',   name: '太初混沌', chineseName: '太初混沌',
        battleStats: { hp: 225, attack: 56, defense: 40, speed: 17, special: '天地未分', specialPower: 102 } },
    ],
  },

  baize: {
    chineseName: '白泽神兽',
    emoji: '✨',
    description: '上古神话中的圣兽，遍知天下万物，为黄帝所记载于《白泽图》',
    stages: [
      { stage: 'egg',        name: '白泽蛋',   chineseName: '白泽蛋',
        battleStats: { hp: 10,  attack: 1,  defense: 1,  speed: 2,  special: '碰！',    specialPower: 3  } },
      { stage: 'baby',       name: '白泽幼',   chineseName: '白泽幼',
        battleStats: { hp: 25,  attack: 3,  defense: 4,  speed: 4,  special: '圣光气',  specialPower: 10 } },
      { stage: 'inTraining', name: '灵兽幼',   chineseName: '灵兽幼',
        battleStats: { hp: 50,  attack: 7,  defense: 8,  speed: 7,  special: '灵光护',  specialPower: 20 } },
      { stage: 'rookie',     name: '白泽',     chineseName: '白泽',
        battleStats: { hp: 90,  attack: 15, defense: 16, speed: 11, special: '百妖识',  specialPower: 38 } },
      { stage: 'champion',   name: '大白泽',   chineseName: '大白泽',
        battleStats: { hp: 150, attack: 28, defense: 28, speed: 14, special: '神兽咆哮', specialPower: 65 } },
      { stage: 'ultimate',   name: '天界白泽', chineseName: '天界白泽',
        battleStats: { hp: 220, attack: 44, defense: 44, speed: 18, special: '万古智慧', specialPower: 98 } },
    ],
  },
};

export function getStageIndex(level, ageMinutes) {
  if (ageMinutes < 2) return 0;
  if (level < 3)  return 1;
  if (level < 6)  return 2;
  if (level < 11) return 3;
  if (level < 18) return 4;
  return 5;
}

export function getStageInfo(digimonType, stageIndex) {
  const d = DIGIMON[digimonType];
  if (!d) return null;
  return d.stages[Math.max(0, Math.min(stageIndex, d.stages.length - 1))];
}
