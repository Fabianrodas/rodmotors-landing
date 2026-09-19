import { readFileSync } from 'node:fs';
import { parse } from 'node-html-parser';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../../dist/index.html', import.meta.url), 'utf8');
const doc = parse(html);
const visibleText = doc.querySelector('body')?.structuredText ?? '';

describe('marcado base', () => {
  it('declara el idioma del contenido', () => {
    expect(doc.querySelector('html')?.getAttribute('lang')).toBe('es-EC');
  });
  it('tiene exactamente un h1', () => {
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
  });
  it('publica title, description y canonical', () => {
    expect(doc.querySelector('title')?.text.length).toBeGreaterThan(20);
    const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
    expect(description.length).toBeGreaterThan(70);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(doc.querySelector('link[rel="canonical"]')).not.toBeNull();
  });
  it('todas las imágenes tienen alt descriptivo', () => {
    for (const img of doc.querySelectorAll('img')) {
      // Las imágenes decorativas llevan alt="" y aria-hidden, y no se anuncian.
      if (img.getAttribute('aria-hidden') === 'true') {
        expect(img.getAttribute('alt')).toBe('');
        continue;
      }
      const alt = img.getAttribute('alt') ?? '';
      expect(alt.length, `alt vacío en ${img.getAttribute('src')}`).toBeGreaterThan(10);
      expect(alt.toLowerCase()).not.toBe('imagen');
    }
  });
  it('el JSON-LD es válido y de tipo AutoRepair', () => {
    const raw = doc.querySelector('script[type="application/ld+json"]')?.text ?? '';
    const data = JSON.parse(raw);
    expect(data['@type']).toBe('AutoRepair');
    expect(data.telephone).toMatch(/^\+593/);
  });
});

describe('reglas anti plantilla (taste-skill)', () => {
  it('no usa guiones largos ni cortos en el texto visible', () => {
    expect(visibleText).not.toMatch(/[—–]/);
  });
  it('no usa emojis', () => {
    expect(visibleText).not.toMatch(/\p{Extended_Pictographic}/u);
  });
  it('no repite etiquetas distintas para la misma acción', () => {
    const labels = doc
      .querySelectorAll('a, button')
      .map((el) => el.structuredText.trim().toLowerCase())
      .filter((text) => text.includes('whatsapp') || text.includes('escríbenos') || text.includes('contáctanos'));
    expect(new Set(labels).size).toBeLessThanOrEqual(1);
  });
  it('no deja fotos provisionales en el build de lanzamiento', () => {
    if (!process.env.LAUNCH) return;
    expect(doc.querySelectorAll('[data-placeholder]')).toHaveLength(0);
  });
});
