// Digimon metadata: evolution stages, names, battle stats
// Visual sprites live in pixels.js / pixelRenderer.js

export const STAGE_NAMES  = ['蛋', '幼年期', '少年期', '青年期', '成熟期', '完全体'];
export const STAGE_LABELS = ['🥚 蛋', '🐣 幼年', '🌱 少年', '⚔️  青年', '🔥 进化', '👑 超进化'];

export const STAGE_LEVEL_THRESHOLDS = [0, 1, 3, 6, 11, 18];

export const DIGIMON = {
  agumon: {
    chineseName: '亚古兽系',
    emoji: '🔥',
    description: '勇敢的恐龙型数码宝贝',
    stages: [
      { stage: 'egg',        name: '数码蛋',       chineseName: '数码蛋',
        battleStats: { hp: 10,  attack: 1,  defense: 1,  speed: 2,  special: '碰！',    specialPower: 3  } },
      { stage: 'baby',       name: 'Botamon',      chineseName: '波塔兽',
        battleStats: { hp: 25,  attack: 4,  defense: 2,  speed: 3,  special: '泡泡冲击', specialPower: 10 } },
      { stage: 'inTraining', name: 'Koromon',      chineseName: '可鲁兽',
        battleStats: { hp: 45,  attack: 8,  defense: 5,  speed: 5,  special: '泡泡冲击+',specialPower: 18 } },
      { stage: 'rookie',     name: 'Agumon',       chineseName: '亚古兽',
        battleStats: { hp: 85,  attack: 16, defense: 10, speed: 9,  special: '小火球',  specialPower: 35 } },
      { stage: 'champion',   name: 'Greymon',      chineseName: '暴龙兽',
        battleStats: { hp: 140, attack: 28, defense: 20, speed: 12, special: '大角冲击', specialPower: 60 } },
      { stage: 'ultimate',   name: 'MetalGreymon', chineseName: '钢铁暴龙兽',
        battleStats: { hp: 210, attack: 45, defense: 32, speed: 15, special: '裂天爪',  specialPower: 95 } },
    ],
  },

  gabumon: {
    chineseName: '加布兽系',
    emoji: '❄️',
    description: '忠诚的狼型数码宝贝',
    stages: [
      { stage: 'egg',        name: '数码蛋',          chineseName: '数码蛋',
        battleStats: { hp: 10,  attack: 1,  defense: 1,  speed: 2,  special: '碰！',    specialPower: 3  } },
      { stage: 'baby',       name: 'Punimon',         chineseName: '普尼兽',
        battleStats: { hp: 25,  attack: 3,  defense: 4,  speed: 2,  special: '泡泡冲击', specialPower: 10 } },
      { stage: 'inTraining', name: 'Tsunomon',        chineseName: '角兽',
        battleStats: { hp: 45,  attack: 6,  defense: 8,  speed: 5,  special: '角冲击',  specialPower: 18 } },
      { stage: 'rookie',     name: 'Gabumon',         chineseName: '加布兽',
        battleStats: { hp: 85,  attack: 13, defense: 15, speed: 10, special: '蓝火焰',  specialPower: 32 } },
      { stage: 'champion',   name: 'Garurumon',       chineseName: '加鲁鲁兽',
        battleStats: { hp: 140, attack: 24, defense: 26, speed: 18, special: '冰冻冲击', specialPower: 55 } },
      { stage: 'ultimate',   name: 'MetalGarurumon',  chineseName: '钢铁加鲁鲁兽',
        battleStats: { hp: 210, attack: 40, defense: 42, speed: 22, special: '金属花',  specialPower: 90 } },
    ],
  },

  patamon: {
    chineseName: '帕塔兽系',
    emoji: '✨',
    description: '圣洁的天使型数码宝贝',
    stages: [
      { stage: 'egg',        name: '数码蛋',       chineseName: '数码蛋',
        battleStats: { hp: 10,  attack: 1,  defense: 1,  speed: 2,  special: '碰！',    specialPower: 3  } },
      { stage: 'baby',       name: 'Poyomon',      chineseName: '波优兽',
        battleStats: { hp: 25,  attack: 3,  defense: 3,  speed: 4,  special: '泡泡冲击', specialPower: 10 } },
      { stage: 'inTraining', name: 'Tokomon',      chineseName: '托克兽',
        battleStats: { hp: 45,  attack: 6,  defense: 6,  speed: 7,  special: '牙咬',    specialPower: 18 } },
      { stage: 'rookie',     name: 'Patamon',      chineseName: '帕塔兽',
        battleStats: { hp: 85,  attack: 14, defense: 12, speed: 13, special: '吊钟回旋', specialPower: 32 } },
      { stage: 'champion',   name: 'Angemon',      chineseName: '天使兽',
        battleStats: { hp: 140, attack: 26, defense: 22, speed: 16, special: '天堂之拳', specialPower: 58 } },
      { stage: 'ultimate',   name: 'Seraphimon',   chineseName: '六翼天使兽',
        battleStats: { hp: 210, attack: 42, defense: 36, speed: 19, special: '七圣剑',  specialPower: 92 } },
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
