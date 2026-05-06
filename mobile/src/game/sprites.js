// PNG sprite registry for all pets.
// React Native Metro requires static `require()` calls; dynamic paths are not allowed.
// Structure: type → stages[0..5] → { idle, happy, hungry, sad, sick, sleeping, dead }
// A null stage entry means no PNG yet for that stage (PetSprite shows a placeholder).

// Helper: 5 art variants -> 7 game states.
// `normal` is reused for idle/happy/sad (no dedicated art for those moods).
// `dying` represents the dead state.
const stage = (normal, hungry, sleeping, sick, dying) => ({
  idle:     normal,
  happy:    normal,
  hungry:   hungry,
  sad:      normal,
  sick:     sick,
  sleeping: sleeping,
  dead:     dying,
});

export const SPRITE_IMAGES = {
  // ─── 混沌异兽 ───────────────────────────────────────────────────────────────
  hundun: [
    // stage 0: 混沌胎 — 蛋阶段，已有完整 7 状态精修图
    {
      idle:     require('../../assets/hundun/egg/normal.png'),
      happy:    require('../../assets/hundun/egg/happy.png'),
      hungry:   require('../../assets/hundun/egg/hungry.png'),
      sad:      require('../../assets/hundun/egg/sad.png'),
      sick:     require('../../assets/hundun/egg/sick.png'),
      sleeping: require('../../assets/hundun/egg/sleeping.png'),
      dead:     require('../../assets/hundun/egg/dead.png'),
    },
    // stage 1: 玄囊 — hatchling
    stage(
      require('../../assets/hundun/egg/states/normal/stage2_hatchling.png'),
      require('../../assets/hundun/egg/states/hungry/stage2_hatchling.png'),
      require('../../assets/hundun/egg/states/sleeping/stage2_hatchling.png'),
      require('../../assets/hundun/egg/states/sick/stage2_hatchling.png'),
      require('../../assets/hundun/egg/states/dying/stage2_hatchling.png'),
    ),
    // stage 2: 丹囊 — baby
    stage(
      require('../../assets/hundun/egg/states/normal/stage3_baby.png'),
      require('../../assets/hundun/egg/states/hungry/stage3_baby.png'),
      require('../../assets/hundun/egg/states/sleeping/stage3_baby.png'),
      require('../../assets/hundun/egg/states/sick/stage3_baby.png'),
      require('../../assets/hundun/egg/states/dying/stage3_baby.png'),
    ),
    // stage 3: 无窍兽 — juvenile
    stage(
      require('../../assets/hundun/egg/states/normal/stage4_juvenile.png'),
      require('../../assets/hundun/egg/states/hungry/stage4_juvenile.png'),
      require('../../assets/hundun/egg/states/sleeping/stage4_juvenile.png'),
      require('../../assets/hundun/egg/states/sick/stage4_juvenile.png'),
      require('../../assets/hundun/egg/states/dying/stage4_juvenile.png'),
    ),
    // stage 4: 四翼浑敦 — adult (sprite-sheet 版)
    stage(
      require('../../assets/hundun/egg/states/normal/stage5_adult.png'),
      require('../../assets/hundun/egg/states/hungry/stage5_adult.png'),
      require('../../assets/hundun/egg/states/sleeping/stage5_adult.png'),
      require('../../assets/hundun/egg/states/sick/stage5_adult.png'),
      require('../../assets/hundun/egg/states/dying/stage5_adult.png'),
    ),
    // stage 5: 太初混沌 — adult render（底部精修图）
    stage(
      require('../../assets/hundun/egg/states/normal/adult_render.png'),
      require('../../assets/hundun/egg/states/hungry/adult_render.png'),
      require('../../assets/hundun/egg/states/sleeping/adult_render.png'),
      require('../../assets/hundun/egg/states/sick/adult_render.png'),
      require('../../assets/hundun/egg/states/dying/adult_render.png'),
    ),
  ],

  // ─── 白泽神兽 ───────────────────────────────────────────────────────────────
  baize: [
    null, // stage 0: 白泽蛋 — no PNG yet
    null, // stage 1: 白泽幼 — no PNG yet
    null, // stage 2: 灵兽幼 — no PNG yet
    null, // stage 3: 白泽 — no PNG yet
    null, // stage 4: 大白泽 — no PNG yet
    null, // stage 5: 天界白泽 — no PNG yet
  ],
};
