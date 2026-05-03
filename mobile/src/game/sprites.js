// PNG sprite registry for all pets.
// React Native Metro requires static `require()` calls; dynamic paths are not allowed.
// Structure: type → stages[0..5] → { idle, happy, hungry, sad, sick, sleeping, dead }
// A null stage entry means no PNG yet for that stage (PetSprite shows a placeholder).

export const SPRITE_IMAGES = {
  // ─── 混沌异兽 ───────────────────────────────────────────────────────────────
  hundun: [
    null, // stage 0: 混沌胎 — use Shanhaijing char-grid sprite
    null, // stage 1: 玄囊 — use Shanhaijing char-grid sprite
    null, // stage 2: 丹囊 — use Shanhaijing char-grid sprite
    null, // stage 3: 无窍兽 — use Shanhaijing char-grid sprite
    null, // stage 4: 四翼浑敦 — use Shanhaijing char-grid sprite
    null, // stage 5: 太初混沌 — use Shanhaijing char-grid sprite
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
