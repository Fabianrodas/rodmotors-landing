import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { blockOf, contrastRatio, parseTokens } from '../../src/lib/contrast';

const css = readFileSync(new URL('../../src/styles/global.css', import.meta.url), 'utf8');
const light = parseTokens(blockOf(css, ':root'));
const dark = parseTokens(blockOf(css, '@media (prefers-color-scheme: dark)'));

// [texto, fondo, contraste mínimo WCAG]
const pairs: [string, string, number][] = [
  ['ink', 'canvas', 7],
  ['ink', 'surface', 7],
  ['muted', 'canvas', 4.5],
  ['muted', 'surface', 4.5],
  ['on-accent', 'accent', 4.5],
  ['accent-strong', 'canvas', 4.5],
  ['accent-strong', 'surface', 4.5],
  ['field', 'surface', 3],
  ['field', 'canvas', 3],
  ['on-brand', 'brand', 7],
  ['accent', 'brand', 3],
  ['on-brand', 'brand-soft', 4.5],
];

describe('tokens de color', () => {
  it('los dos modos definen los mismos tokens', () => {
    expect(Object.keys(dark).sort()).toEqual(Object.keys(light).sort());
  });

  it.each(pairs)('modo claro: %s sobre %s cumple %s:1', (fg, bg, min) => {
    expect(contrastRatio(light[fg], light[bg])).toBeGreaterThanOrEqual(min);
  });

  it.each(pairs)('modo oscuro: %s sobre %s cumple %s:1', (fg, bg, min) => {
    expect(contrastRatio(dark[fg], dark[bg])).toBeGreaterThanOrEqual(min);
  });

  it('no usa negro ni blanco puros', () => {
    for (const value of [...Object.values(light), ...Object.values(dark)]) {
      expect(['#000000', '#ffffff']).not.toContain(value);
    }
  });
});
