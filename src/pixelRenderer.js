import chalk from 'chalk';
import { PALETTE, SPRITES } from './pixels.js';

export const LCD_BG = '#0d1117'; // dark background for Nanner 32 style

// Pack two pixel rows into one terminal line using unicode upper-half block.
// '▀' renders top pixel as fg, bottom pixel as bg — square pixels in terminal.
export function renderRow(topRow, bottomRow) {
  let line = '';
  for (let x = 0; x < topRow.length; x++) {
    const tc = topRow[x];
    const bc = bottomRow?.[x] ?? '_';
    const fg = (tc === '_' || tc == null) ? LCD_BG : (PALETTE[tc] ?? LCD_BG);
    const bg = (bc === '_' || bc == null) ? LCD_BG : (PALETTE[bc] ?? LCD_BG);
    line += chalk.bgHex(bg).hex(fg)('▀');
  }
  return line;
}

function renderGrid(grid) {
  const lines = [];
  for (let y = 0; y < grid.length; y += 2) {
    lines.push(renderRow(grid[y], grid[y + 1]));
  }
  return lines;
}

function spriteState(state) {
  const valid = ['happy', 'idle', 'hungry', 'sad', 'sick', 'sleeping', 'dead'];
  return valid.includes(state) ? state : 'idle';
}

export function getSprite(digimonType, stageIndex, state) {
  const stages = SPRITES[digimonType];
  if (!stages) return ['▀'.repeat(32)];

  const idx  = Math.max(0, Math.min(stageIndex, stages.length - 1));
  const stg  = stages[idx];
  const key  = spriteState(state);
  const grid = stg[key] ?? stg.idle;

  return renderGrid(grid);
}

// Pixel width in terminal chars — 32 pixels × 1 char each (half-block mode)
export const SPRITE_WIDTH = 32;
