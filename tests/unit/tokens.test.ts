import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { blockOf, contrastRatio, parseTokens } from '../../src/lib/contrast';

const css = readFileSync(new URL('../../src/styles/global.css', import.meta.url), 'utf8');
const tokens = parseTokens(blockOf(css, ':root'));

// Tema único oscuro (decisión aprobada en el canvas): sin modo claro, sin `prefers-color-scheme`.
// [texto, fondo, contraste mínimo WCAG] — solo los pares que el sitio usa de verdad.
const textPairs: [string, string, number][] = [
  ['claro', 'fondo', 4.5],
  ['claro', 'superficie', 4.5],
  ['claro', 'elevada', 4.5],
  ['claro', 'marca', 4.5],
  ['claro', 'profundo', 4.5],
  ['apagado', 'fondo', 4.5],
  ['apagado', 'superficie', 4.5],
  ['apagado', 'elevada', 4.5],
  ['apagado', 'marca', 4.5],
  ['apagado', 'profundo', 4.5],
  ['etiqueta', 'fondo', 4.5],
  ['etiqueta', 'superficie', 4.5],
  ['etiqueta', 'profundo', 4.5],
  ['amarillo', 'tinta', 4.5],
  ['amarillo', 'fondo', 4.5],
  ['amarillo', 'marca', 4.5],
  ['amarillo', 'profundo', 4.5],
  ['amarillo', 'superficie', 4.5],
  ['abierto', 'fondo', 3],
  ['abierto', 'profundo', 3],
];
// Bordes y otros elementos no textuales: 3:1 (WCAG 1.4.11).
const uiPairs: [string, string, number][] = [
  ['borde', 'fondo', 3],
  ['borde', 'superficie', 3],
];

describe('tokens de color', () => {
  it('define un solo tema, sin variables sueltas', () => {
    const esperados = ['fondo', 'superficie', 'elevada', 'marca', 'profundo', 'claro', 'apagado', 'etiqueta', 'amarillo', 'tinta', 'borde', 'abierto'];
    expect(Object.keys(tokens).sort()).toEqual(esperados.sort());
  });

  it.each([...textPairs, ...uiPairs])('%s sobre %s cumple %s:1', (fg, bg, min) => {
    expect(contrastRatio(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(min);
  });

  it('no usa negro ni blanco puros', () => {
    for (const value of Object.values(tokens)) {
      expect(['#000000', '#ffffff']).not.toContain(value);
    }
  });

  it('el amarillo es el único acento: ningún otro token comparte su matiz', () => {
    // Un token de "acento" alternativo sería la señal de que el ámbar dejó de ser el único.
    expect(tokens.amarillo).toBe('#f8cb24');
    expect(Object.values(tokens).filter((v) => v === tokens.amarillo)).toHaveLength(1);
  });
});
