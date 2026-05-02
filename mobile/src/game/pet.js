import { DIGIMON, getStageIndex, getStageInfo, STAGE_NAMES } from './ascii.js';

export const MAX_STAT = 100;
export const MIN_STAT = 0;

const DECAY = {
  hunger: 2,
  happiness: 1,
  energy: 1.5,
  health: 0,
};

export class Pet {
  constructor(data = {}) {
    this.name = data.name || '小宝';
    // type is the digimon line key: 'agumon' | 'gabumon' | 'patamon'
    // Migrate legacy types (cat/dog/bunny) → default to agumon
    const validTypes = Object.keys(DIGIMON);
    this.type = validTypes.includes(data.type) ? data.type : 'agumon';

    this.age       = data.age       ?? 0;
    this.hunger    = data.hunger    ?? 20;
    this.happiness = data.happiness ?? 80;
    this.energy    = data.energy    ?? 80;
    this.health    = data.health    ?? 100;
    this.level     = data.level     ?? 1;
    this.exp       = data.exp       ?? 0;
    this.isDead    = data.isDead    ?? false;
    this.lastSaved = data.lastSaved ?? Date.now();
    this.createdAt = data.createdAt ?? Date.now();
    this.message   = data.message   ?? '';
    this.wins      = data.wins      ?? 0;
    this.losses    = data.losses    ?? 0;
    this.messageTimer = 0;
  }

  get stageIndex() {
    return getStageIndex(this.level, this.age);
  }

  get stageName() {
    return STAGE_NAMES[this.stageIndex] ?? '???';
  }

  get stageInfo() {
    return getStageInfo(this.type, this.stageIndex);
  }

  get petInfo() {
    return DIGIMON[this.type];
  }

  applyTimeDecay() {
    if (this.isDead) return;

    const now = Date.now();
    const minutesPassed = (now - this.lastSaved) / 1000 / 60;
    if (minutesPassed < 0.016) return;

    const effectiveMinutes = Math.min(minutesPassed, 480);

    this.hunger    = clamp(this.hunger    + DECAY.hunger    * effectiveMinutes, MIN_STAT, MAX_STAT);
    this.happiness = clamp(this.happiness - DECAY.happiness * effectiveMinutes, MIN_STAT, MAX_STAT);
    this.energy    = clamp(this.energy    - DECAY.energy    * effectiveMinutes, MIN_STAT, MAX_STAT);
    this.age      += effectiveMinutes;

    if (this.hunger >= 90) {
      this.health = clamp(this.health - 2 * effectiveMinutes, MIN_STAT, MAX_STAT);
    }
    if (this.happiness <= 10) {
      this.health = clamp(this.health - 1 * effectiveMinutes, MIN_STAT, MAX_STAT);
    }
    if (this.hunger < 50 && this.happiness > 60 && this.energy > 30) {
      this.health = clamp(this.health + 0.5 * effectiveMinutes, MIN_STAT, MAX_STAT);
    }

    if (this.health <= 0 || (this.hunger >= 100 && effectiveMinutes > 60)) {
      this.isDead = true;
      this.health = 0;
    }

    this.lastSaved = now;
  }

  feed(foodType = 'normal') {
    if (this.isDead) return { success: false, msg: '...' };
    if (this.hunger <= 5) return { success: false, msg: `${this.name}已经很饱了！` };

    const foods = {
      normal: { hunger: -25, happiness:  5, energy:  5, name: '普通餐' },
      snack:  { hunger: -10, happiness: 15, energy:  2, name: '零食' },
      veggie: { hunger: -20, happiness:  0, energy:  8, name: '蔬菜' },
      meat:   { hunger: -35, happiness: 10, energy: 15, name: '肉类' },
    };

    const food = foods[foodType] || foods.normal;
    this.hunger    = clamp(this.hunger    + food.hunger,    MIN_STAT, MAX_STAT);
    this.happiness = clamp(this.happiness + food.happiness, MIN_STAT, MAX_STAT);
    this.energy    = clamp(this.energy    + food.energy,    MIN_STAT, MAX_STAT);

    this.gainExp(5);
    return { success: true, msg: `${this.name}开心地吃了${food.name}！` };
  }

  play() {
    if (this.isDead)          return { success: false, msg: '...' };
    if (this.energy  <= 10)   return { success: false, msg: `${this.name}太累了，需要休息！` };
    if (this.hunger  >= 90)   return { success: false, msg: `${this.name}太饿了，先喂食吧！` };

    this.happiness = clamp(this.happiness + 20, MIN_STAT, MAX_STAT);
    this.energy    = clamp(this.energy    - 20, MIN_STAT, MAX_STAT);
    this.hunger    = clamp(this.hunger    + 10, MIN_STAT, MAX_STAT);

    this.gainExp(8);
    return { success: true, msg: `${this.name}玩得很开心！` };
  }

  sleep() {
    if (this.isDead)        return { success: false, msg: '...' };
    if (this.energy >= 90)  return { success: false, msg: `${this.name}不困，不想睡！` };

    this.energy = clamp(this.energy + 40,  MIN_STAT, MAX_STAT);
    this.health = clamp(this.health +  5,  MIN_STAT, MAX_STAT);

    this.gainExp(3);
    return { success: true, msg: `${this.name}睡了一觉，精神满满！` };
  }

  heal() {
    if (this.isDead)        return { success: false, msg: '...' };
    if (this.health >= 95)  return { success: false, msg: `${this.name}身体很健康！` };

    this.health = clamp(this.health + 30, MIN_STAT, MAX_STAT);
    this.gainExp(10);
    return { success: true, msg: `${this.name}吃了恢复药，好多了！` };
  }

  clean() {
    if (this.isDead) return { success: false, msg: '...' };
    this.happiness = clamp(this.happiness + 10, MIN_STAT, MAX_STAT);
    this.health    = clamp(this.health    +  5, MIN_STAT, MAX_STAT);
    this.gainExp(3);
    return { success: true, msg: `${this.name}洗了个澡，干干净净！` };
  }

  // Returns { leveledUp, evolved, newStage }
  gainExp(amount) {
    const prevStage = this.stageIndex;
    const prevLevel = this.level;

    this.exp += amount;
    const expNeeded = this.level * 50;
    if (this.exp >= expNeeded) {
      this.exp -= expNeeded;
      this.level += 1;
    }

    const newStage = this.stageIndex;
    return {
      leveledUp: this.level > prevLevel,
      evolved:   newStage  > prevStage,
      newStage,
    };
  }

  getState() {
    if (this.isDead)              return 'dead';
    if (this.energy    <= 15)     return 'sleeping';
    if (this.hunger    >= 80)     return 'hungry';
    if (this.health    <= 30)     return 'sick';
    if (this.happiness <= 20)     return 'sad';
    if (this.happiness >= 80 && this.hunger < 30) return 'happy';
    return 'idle';
  }

  getMood() {
    if (this.isDead) return '已离开';
    const moods = {
      happy:    '非常开心 ♡',
      idle:     '心情平静',
      hungry:   '肚子好饿...',
      sad:      '有点沮丧',
      sick:     '感觉不舒服',
      sleeping: '睡着了 zzz',
    };
    return moods[this.getState()] || '一般般';
  }

  getAgeString() {
    const minutes = Math.floor(this.age);
    if (minutes < 60)  return `${minutes} 分钟`;
    const hours = Math.floor(minutes / 60);
    if (hours  < 24)   return `${hours} 小时`;
    return `${Math.floor(hours / 24)} 天`;
  }

  toJSON() {
    return {
      name: this.name,
      type: this.type,
      age: this.age,
      hunger: this.hunger,
      happiness: this.happiness,
      energy: this.energy,
      health: this.health,
      level: this.level,
      exp: this.exp,
      isDead: this.isDead,
      lastSaved: this.lastSaved,
      createdAt: this.createdAt,
      wins: this.wins,
      losses: this.losses,
    };
  }
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}
