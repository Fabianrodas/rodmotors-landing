import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse, type HTMLElement } from 'node-html-parser';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

const PAGES = [
  { file: 'index.html', path: '/', navHref: '/' },
  { file: 'servicios/index.html', path: '/servicios', navHref: '/servicios' },
  { file: 'ubicacion/index.html', path: '/ubicacion', navHref: '/ubicacion' },
  { file: 'acerca-de/index.html', path: '/acerca-de', navHref: '/acerca-de' },
] as const;

function readDoc(file: string) {
  const html = readFileSync(new URL(`../../dist/${file}`, import.meta.url), 'utf8');
  return parse(html);
}

const docs = PAGES.map((page) => ({ ...page, doc: readDoc(page.file) }));
const doc404 = readDoc('404.html');
const allDocs = [...docs.map((d) => d.doc), doc404];

describe('marcado base, en cada página', () => {
  it.each(docs)('$path: declara el idioma y tiene exactamente un h1', ({ doc }) => {
    expect(doc.querySelector('html')?.getAttribute('lang')).toBe('es-EC');
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
  });

  it.each(docs)('$path: publica title, description y canonical propios', ({ doc, path }) => {
    expect(doc.querySelector('title')?.text.length).toBeGreaterThan(15);
    const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
    expect(description.length, path).toBeGreaterThan(70);
    expect(description.length, path).toBeLessThanOrEqual(160);
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href'), path).toContain(path === '/' ? '/' : path);
  });

  it.each(docs)('$path: todas las imágenes tienen alt correcto', ({ doc }) => {
    for (const img of doc.querySelectorAll('img')) {
      if (img.getAttribute('aria-hidden') === 'true') {
        expect(img.getAttribute('alt')).toBe('');
        continue;
      }
      const alt = img.getAttribute('alt') ?? '';
      expect(alt.length, `alt vacío en ${img.getAttribute('src')}`).toBeGreaterThan(3);
      expect(alt.toLowerCase()).not.toBe('imagen');
    }
  });

  it.each(docs)('$path: el JSON-LD es válido y de tipo AutoRepair', ({ doc }) => {
    const raw = doc.querySelector('script[type="application/ld+json"]')?.text ?? '';
    const data = JSON.parse(raw);
    expect(data['@type']).toBe('AutoRepair');
    expect(data.telephone).toMatch(/^\+593/);
  });

  it('la 404 no indexa y no publica canonical', () => {
    expect(doc404.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex');
    expect(doc404.querySelector('link[rel="canonical"]')).toBeNull();
  });
});

describe('navegación', () => {
  it.each(docs)('$path: el menú marca esa página como actual, en escritorio y en celular', ({ doc, navHref }) => {
    const current = doc.querySelectorAll('[aria-current="page"]');
    // Dos copias del menú (escritorio oculto en celular, celular oculto en escritorio):
    // cada una marca su propio enlace, así que son dos elementos, no uno.
    expect(current.length).toBe(2);
    for (const link of current) expect(link.getAttribute('href')).toBe(navHref);
  });

  it('las cuatro páginas están en el menú de cada página', () => {
    const esperado = ['/', '/servicios', '/ubicacion', '/acerca-de'];
    for (const { doc, path } of docs) {
      const hrefs = doc
        .querySelectorAll('nav[aria-label="Principal"] a')
        .map((a) => a.getAttribute('href'))
        .filter((href): href is string => !!href && !href.startsWith('http'));
      expect(hrefs, path).toEqual(esperado);
    }
  });
});

describe('reglas anti plantilla (taste-skill)', () => {
  it.each(docs)('$path: no usa guiones largos ni cortos, ni emojis, en el texto visible', ({ doc }) => {
    const text = doc.querySelector('body')?.structuredText ?? '';
    expect(text).not.toMatch(/[—–]/);
    expect(text.replace(/[©®]/g, "")).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it.each(docs)('$path: una sola etiqueta para la acción de agendar', ({ doc }) => {
    const labels = doc
      .querySelectorAll('a, button')
      .map((el: HTMLElement) => el.structuredText.trim().toLowerCase())
      .filter((text) => text.includes('whatsapp') || text.includes('escríbenos') || text.includes('contáctanos'));
    expect(new Set(labels)).toEqual(new Set(['agendar por whatsapp']));
    // header y barra fija de celular, como mínimo
    expect(labels.length).toBeGreaterThanOrEqual(2);
  });

  it('no deja espacios de foto sin llenar en el build de lanzamiento', () => {
    if (!process.env.LAUNCH) return;
    for (const doc of allDocs) expect(doc.querySelectorAll('[data-placeholder]')).toHaveLength(0);
  });

  it('las fotos y la imagen social tienen contenido real, no un color plano', async () => {
    if (!process.env.LAUNCH) return;
    const photos = new URL('../../src/assets/photos/', import.meta.url);
    const files = [
      ...readdirSync(photos).map((name) => fileURLToPath(new URL(name, photos))),
      fileURLToPath(new URL('../../public/og.jpg', import.meta.url)),
    ];
    for (const file of files) {
      const { channels } = await sharp(file).stats();
      expect(Math.max(...channels.map((channel) => channel.stdev)), file).toBeGreaterThan(8);
    }
  });
});
