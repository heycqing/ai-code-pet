import React, { useMemo } from 'react';
import { View, Image } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { PALETTE, SPRITES } from '../game/pixels.js';
import { SPRITE_IMAGES } from '../game/sprites.js';

const LCD_BG = '#0d1117';

type SpriteState = 'happy' | 'idle' | 'hungry' | 'sad' | 'sick' | 'sleeping' | 'dead';

interface Props {
  type: string;
  stageIndex: number;
  state?: SpriteState;
  /** Used by legacy SVG mode (1 char = pixelSize px). Also controls PNG size: pixelSize * 32. */
  pixelSize?: number;
}

// ─── PNG mode ────────────────────────────────────────────────────────────────

function PngSprite({ source, size }: { source: any; size: number }) {
  return (
    <Image
      source={source}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}

function PngPlaceholder({ size }: { size: number }) {
  return <View style={{ width: size, height: size, backgroundColor: '#1a1a2e', borderRadius: 8 }} />;
}

// ─── Legacy SVG / char-grid mode ─────────────────────────────────────────────

function getGrid(type: string, stageIndex: number, state: SpriteState): string[] {
  const stages = (SPRITES as Record<string, any>)[type];
  if (!stages) return [];
  const idx = Math.max(0, Math.min(stageIndex, stages.length - 1));
  const stg = stages[idx];
  return (stg[state] ?? stg.idle) as string[];
}

function SvgSprite({ type, stageIndex, state, pixelSize }: {
  type: string; stageIndex: number; state: SpriteState; pixelSize: number;
}) {
  const grid = useMemo(() => getGrid(type, stageIndex, state), [type, stageIndex, state]);

  const { rects, width, height } = useMemo(() => {
    const rects: { x: number; y: number; fill: string }[] = [];
    grid.forEach((row, y) => {
      row.split('').forEach((char, x) => {
        const fill = (char === '_' || !char)
          ? LCD_BG
          : ((PALETTE as Record<string, string | null>)[char] ?? LCD_BG);
        rects.push({ x: x * pixelSize, y: y * pixelSize, fill: fill as string });
      });
    });
    return { rects, width: 32 * pixelSize, height: grid.length * pixelSize };
  }, [grid, pixelSize]);

  if (!grid.length) return <View style={{ width, height, backgroundColor: LCD_BG }} />;

  return (
    <Svg width={width} height={height}>
      {rects.map(({ x, y, fill }, i) => (
        <Rect key={i} x={x} y={y} width={pixelSize} height={pixelSize} fill={fill} />
      ))}
    </Svg>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export default function PetSprite({ type, stageIndex, state = 'idle', pixelSize = 6 }: Props) {
  const pngStages = (SPRITE_IMAGES as Record<string, any>)[type];
  const size = pixelSize * 32;

  if (pngStages) {
    const idx = Math.max(0, Math.min(stageIndex, pngStages.length - 1));
    const stg = pngStages[idx];
    if (!stg) return <SvgSprite type={type} stageIndex={stageIndex} state={state} pixelSize={pixelSize} />;
    const src = stg[state] ?? stg.idle;
    return <PngSprite source={src} size={size} />;
  }

  // Legacy char-grid path for pets without PNG sprites yet
  return <SvgSprite type={type} stageIndex={stageIndex} state={state} pixelSize={pixelSize} />;
}
