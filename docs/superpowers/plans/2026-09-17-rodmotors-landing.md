# Rod Motors landing: plan de implementación

> **Para agentes:** SUB-SKILL REQUERIDA: usa `superpowers:subagent-driven-development` (recomendado) o `superpowers:executing-plans` para ejecutar este plan tarea por tarea. Los pasos usan casillas `- [ ]` para llevar el avance.
> Antes de tocar cualquier archivo de UI, carga `taste-skill:design-taste-frontend` y `example-skills:frontend-design`. Para dudas puntuales de UX, consulta `ui-ux-pro-max` con una query por vez.

**Objetivo:** reemplazar los dos sitios actuales (Google Sites y WordPress.com) por una landing estática única en rodmotors.ec que convierta visitas de celular en citas por WhatsApp.

**Arquitectura:** Astro 7 en modo estático con Tailwind v4 mediante el plugin de Vite. Todo el contenido del negocio vive en `src/data/site.ts`; la lógica pura (horario, mensaje de WhatsApp, JSON-LD) vive en `src/lib/` y se prueba con vitest; los componentes `.astro` solo componen. Tres islas mínimas de JavaScript vanilla: validación del formulario, estado del horario y carga diferida de mapa y videos.

**Stack:** astro 7.3.3, tailwindcss 4.3.3, @tailwindcss/vite, astro-icon + @iconify-json/ph, @fontsource-variable/archivo, @astrojs/sitemap, vitest 5, playwright 1.63, typescript 6.

**Spec:** `docs/superpowers/specs/2026-09-17-rodmotors-landing-design.md` (léelo antes de empezar; este plan lo implementa).

**Validado:** el andamiaje, los módulos de `src/lib`, los componentes y los tests de este plan se construyeron y ejecutaron en un proyecto de prueba el 2026-09-17 (y se revisaron de nuevo el 2026-09-18 tras aprobar el hero variante B en el canvas de diseño): `astro check` sin errores, build limpio, 67 tests en verde, 7.4 KB de JS. Los tests de Playwright (tarea 13) tipan correctamente, pero no se ejecutaron con navegador en este entorno de planificación: si un selector falla, ajusta el selector, no el comportamiento.

## Fase previa: diseño aprobado antes de codificar

Este plan se ejecuta **después** de que el diseño esté aprobado en Claude Design. Ver `docs/design/2026-09-17-brief-claude-design.md`.

- Las tareas 1 a 7 (andamiaje, tokens, datos, librerías, fotos) no dependen del diseño y se pueden correr en paralelo a la revisión visual.
- Las tareas 8 a 15 construyen las secciones. Su maquetado ya está escrito aquí; lo que aporta el diseño aprobado son los valores finales de color, escala tipográfica, espaciado y composición, que entran editando `src/styles/global.css` y las clases de cada componente, no reescribiéndolos.
- Si el diseño aprobado cambia la estructura de una sección (por ejemplo el bento de servicios pasa a otra composición), se ajusta la tarea correspondiente antes de ejecutarla y se anota el cambio en el spec.

## Restricciones globales

Aplican a todas las tareas:

- Node >= 22.12. `typescript@^6` obligatorio: `@astrojs/check@0.9` no soporta TypeScript 7 todavía.
- Copy: cero em dash (—) y en dash (–) en texto visible, cero emojis, frases en minúscula salvo la inicial, español de Ecuador.
- Una sola etiqueta por intención. La acción de agendar se llama siempre "Agendar por WhatsApp", en header, hero, formulario y barra móvil.
- Una sola paleta: solo los tokens de `src/styles/global.css`. La paleta por defecto de Tailwind está desactivada con `--color-*: initial`, así que `bg-slate-800` o `text-white` no existen. Nada de negro ni blanco puros.
- Una sola familia tipográfica: Archivo Variable, self-hosted. Nada de `<link>` a Google Fonts.
- Iconos solo de Phosphor vía `astro-icon` (`ph:...`). Nunca dibujar SVG a mano.
- Nada de datos inventados: ni reseñas, ni cifras, ni nombres. Si falta un dato, se deja fuera y se anota en la lista de pendientes del spec.
- Cada tarea termina con `npm run verify` en verde y un commit.

## Estructura de archivos

```
src/
  data/site.ts            Datos del negocio (único lugar editable por el cliente)
  lib/hours.ts            Horario, estado abierto/cerrado, zona de Guayaquil
  lib/whatsapp.ts         Validación de la orden de trabajo, mensaje y URL
  lib/schema.ts           JSON-LD AutoRepair
  lib/contrast.ts         Utilidades WCAG para tests de tokens
  layouts/Base.astro      head, SEO, fuente, JSON-LD, skip link
  components/*.astro      Header, Hero, Services, Workshop, Reviews, Guide, Booking, Visit, Footer, MobileBar
  pages/index.astro       Composición de la landing
  pages/404.astro
  styles/global.css       Tokens y utilidades
  assets/photos/          Fotos del taller
  icons/                  Vacío (astro-icon lo espera)
public/                   _redirects, _headers, robots.txt, favicon.svg, og.jpg
scripts/                  placeholder-photos.mjs, extract-logo-colors.mjs
tests/unit tests/build tests/e2e
```

---

### Tarea 1: Andamiaje del proyecto

**Archivos:**
- Crear: el proyecto Astro en la raíz del repo
- Crear: `astro.config.mjs`, `vitest.config.ts`, `.prettierrc.json`, `src/icons/.gitkeep`
- Modificar: `package.json` (scripts)

**Interfaces:**
- Produce: `npm run verify` (chequeo de tipos + build + tests), que todas las tareas siguientes usan como puerta.

- [ ] **Paso 1: Crear el proyecto**

```bash
npm create astro@latest . -- --template minimal --install --no-git --yes
```

Astro 7 genera también `AGENTS.md` y `CLAUDE.md` con notas del framework. Consérvalos: el `CLAUDE.md` de este proyecto se añade al final del archivo existente en la tarea 16.

- [ ] **Paso 2: Instalar dependencias con versiones fijas**

```bash
npx astro add tailwind --yes
npm install astro-icon @iconify-json/ph @fontsource-variable/archivo @astrojs/sitemap
npm install -D vitest@^5 typescript@^6 @astrojs/check prettier prettier-plugin-astro node-html-parser @playwright/test @axe-core/playwright
```

Verifica que `package.json` tenga `typescript` en `^6`, no en `^7`. Si npm instaló 7, corre `npm install -D typescript@^6` otra vez.

- [ ] **Paso 3: Configurar Astro**

```js
// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://rodmotors.ec',
  integrations: [icon({ include: { ph: ['*'] } }), sitemap()],
  image: { domains: ['i.ytimg.com'] },
  vite: { plugins: [tailwindcss()] },
});
```

- [ ] **Paso 4: Scripts de npm**

Reemplaza el bloque `scripts` de `package.json` por:

```json
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run tests/unit",
    "test:build": "npm run build && vitest run tests/build",
    "test:e2e": "playwright test",
    "verify": "npm run check && npm run build && vitest run",
    "format": "prettier --write ."
  },
```

- [ ] **Paso 5: Config de vitest y prettier**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/build/**/*.test.ts'],
    environment: 'node',
  },
});
```

`.prettierrc.json`:

```json
{
  "printWidth": 120,
  "singleQuote": true,
  "plugins": ["prettier-plugin-astro"],
  "overrides": [{ "files": "*.astro", "options": { "parser": "astro" } }]
}
```

- [ ] **Paso 6: Carpeta de iconos locales**

```bash
mkdir -p src/icons && touch src/icons/.gitkeep
```

Sin esta carpeta, cada build imprime `[astro-icon] Failed to load icons from "src/icons"`.

- [ ] **Paso 7: Build de humo**

```bash
npm run build
```

Esperado: `[build] Complete!` sin errores.

- [ ] **Paso 8: Commit**

```bash
git add -A
git commit -m "chore: andamiaje astro 7 con tailwind v4, vitest y playwright"
```

### Tarea 2: Tokens de color y auditoría de marca

**Archivos:**
- Crear: `src/lib/contrast.ts`, `tests/unit/tokens.test.ts`, `src/styles/global.css`, `scripts/extract-logo-colors.mjs`

**Interfaces:**
- Produce: tokens CSS `--canvas --surface --line --field --muted --ink --brand --on-brand --brand-soft --accent --on-accent --accent-strong` en modo claro y oscuro, y las utilidades `bg-canvas`, `text-ink`, `bg-brand`, `text-on-brand`, `bg-brand-soft`, `border-line`, `bg-accent`, `text-on-accent`, `text-accent-strong`, `display`, `numeric`.
- Produce: `contrastRatio(a, b)`, `parseTokens(css)`, `blockOf(css, marcador)` para los tests.

- [ ] **Paso 1: Escribir el test que falla**

```ts
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
```

- [ ] **Paso 2: Correr y ver que falla**

```bash
npx vitest run tests/unit/tokens.test.ts
```

Esperado: falla al no existir `src/lib/contrast.ts`.

- [ ] **Paso 3: Implementar las utilidades de contraste**

```ts
/** Utilidades WCAG para probar los tokens de color en tests. */

export function relativeLuminance(hex: string): number {
  const value = hex.replace('#', '');
  const channels = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [high, low] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

/** Extrae los tokens `--nombre: #hex;` de un bloque CSS. */
export function parseTokens(css: string): Record<string, string> {
  const tokens: Record<string, string> = {};
  for (const match of css.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    tokens[match[1]] = match[2].toLowerCase();
  }
  return tokens;
}

/** Devuelve solo el contenido del primer bloque que empieza con el selector dado. */
export function blockOf(css: string, startMarker: string): string {
  const start = css.indexOf(startMarker);
  if (start === -1) throw new Error(`No se encontró el bloque: ${startMarker}`);
  const open = css.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    if (css[i] === '}') {
      depth -= 1;
      if (depth === 0) return css.slice(open + 1, i);
    }
  }
  throw new Error(`Bloque sin cerrar: ${startMarker}`);
}
```

- [ ] **Paso 4: Escribir los tokens**

Reemplaza `src/styles/global.css` completo:

```css
@import "tailwindcss";
@import "@fontsource-variable/archivo/wdth.css";

/* Azul oscuro de marca como color principal, grises fríos de taller y un solo acento
   ámbar de señalización para las acciones. */
:root {
  color-scheme: light dark;
  --canvas: #eef1f4;
  --surface: #f9fafb;
  --line: #ccd5de;
  --field: #76838f;
  --muted: #4a5765;
  --ink: #13233c;
  --brand: #13233c;
  --on-brand: #eef2f7;
  --accent: #e0a82e;
  --on-accent: #13233c;
  --accent-strong: #7d5610;
  --brand-soft: #25394f;
}

@media (prefers-color-scheme: dark) {
  :root {
    --canvas: #0e1a2b;
    --surface: #152438;
    --line: #27374c;
    --field: #6b7b90;
    --muted: #a2b0c1;
    --ink: #e8eef5;
    --brand: #17273f;
    --on-brand: #eef2f7;
    --accent: #e3ad3b;
    --on-accent: #0e1a2b;
    --accent-strong: #eab957;
    --brand-soft: #25394f;
  }
}

/* Sin paleta por defecto de Tailwind: obliga a usar los tokens de marca. */
@theme {
  --color-*: initial;
  --font-*: initial;
}

@theme inline {
  --color-canvas: var(--canvas);
  --color-surface: var(--surface);
  --color-line: var(--line);
  --color-field: var(--field);
  --color-muted: var(--muted);
  --color-ink: var(--ink);
  --color-accent: var(--accent);
  --color-on-accent: var(--on-accent);
  --color-accent-strong: var(--accent-strong);
  --color-brand: var(--brand);
  --color-on-brand: var(--on-brand);
  --color-brand-soft: var(--brand-soft);
  --font-sans: "Archivo Variable", ui-sans-serif, system-ui, sans-serif;
}

@layer base {
  html {
    scroll-behavior: smooth;
  }
  body {
    background-color: var(--canvas);
    color: var(--ink);
    font-family: var(--font-sans);
    font-synthesis-weight: none;
  }
  :focus-visible {
    outline: 3px solid var(--accent-strong);
    outline-offset: 2px;
  }
  ::selection {
    background-color: var(--accent);
    color: var(--on-accent);
  }
}

@utility display {
  font-stretch: 118%;
  font-weight: 700;
  letter-spacing: -0.015em;
  line-height: 1.04;
  text-wrap: balance;
}

@utility numeric {
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Paso 5: Correr los tests y ver que pasan**

```bash
npx vitest run tests/unit/tokens.test.ts
```

Esperado: 26 tests en verde.

- [ ] **Paso 6: Script de auditoría del logo**

```js
/**
 * Imprime los colores dominantes del logo para fijar el azul de marca exacto.
 * Uso: node scripts/extract-logo-colors.mjs src/assets/brand/logo.png
 */
import sharp from 'sharp';

const file = process.argv[2];
if (!file) {
  console.error('Uso: node scripts/extract-logo-colors.mjs <ruta-del-logo>');
  process.exit(1);
}

const { data, info } = await sharp(file).flatten({ background: '#ffffff' }).resize(64, 64, { fit: 'inside' }).raw().toBuffer({ resolveWithObject: true });

const counts = new Map();
for (let i = 0; i < data.length; i += info.channels) {
  // Agrupa en pasos de 32 para juntar tonos parecidos.
  const key = [data[i], data[i + 1], data[i + 2]].map((c) => Math.round(c / 32) * 32);
  const hex = `#${key.map((c) => Math.min(255, c).toString(16).padStart(2, '0')).join('')}`;
  counts.set(hex, (counts.get(hex) ?? 0) + 1);
}

const total = [...counts.values()].reduce((a, b) => a + b, 0);
const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

console.log('Colores dominantes del logo:');
for (const [hex, count] of top) {
  console.log(`  ${hex}  ${((count / total) * 100).toFixed(1)}%`);
}
console.log('\nSi alguno es un azul cercano al de marca (no gris ni negro), reemplaza --brand con ese azul, deriva --brand-soft un poco más claro y ajusta --accent-strong hasta que pasen los tests de contraste.');
```

- [ ] **Paso 7: Auditar el logo real (requiere el archivo del cliente)**

```bash
mkdir -p src/assets/brand
# guarda el logo en src/assets/brand/logo.png (o .svg convertido a png)
node scripts/extract-logo-colors.mjs src/assets/brand/logo.png
```

El color principal ya está decidido: azul oscuro (`--brand`, hoy `#13233c`), pedido por el cliente para que combine con el logo. Este paso solo afina el tono exacto: si el azul del logo difiere del provisional, reemplaza `--brand` (y ajusta `--brand-soft` un poco más claro del mismo azul) hasta que los tests de contraste pasen, y documenta el cambio en el spec. El ámbar (`--accent`) no cambia por esto: sigue siendo el único acento, reservado para el CTA y el foco. Si el logo es solo negro, gris o blanco, se queda el azul actual. **No sigas sin correr este paso o sin confirmación del cliente de que no hay logo en vector.**

- [ ] **Paso 8: Commit**

```bash
git add -A && git commit -m "feat: tokens de color con tests de contraste WCAG"
```

### Tarea 3: Datos del negocio

**Archivos:**
- Crear: `src/data/site.ts`, `tests/unit/content.test.ts`

**Interfaces:**
- Produce: `site: SiteData` y `serviceNames: string[]`. Tipos `DayIndex`, `TimeRange`, `WeeklySchedule`, `Service`, `ServiceGroup`, `Review`, `GuideItem`, `SiteData`. Todo lo demás los consume.

- [ ] **Paso 1: Escribir el test que falla**

```ts
import { describe, expect, it } from 'vitest';
import { serviceNames, site } from '../../src/data/site';

function allStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(allStrings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(allStrings);
  return [];
}

const strings = allStrings(site);

describe('datos del negocio', () => {
  it('no usa guiones largos ni cortos en el texto', () => {
    const offenders = strings.filter((text) => /[—–]/.test(text));
    expect(offenders).toEqual([]);
  });

  it('no usa emojis', () => {
    const offenders = strings.filter((text) => /\p{Extended_Pictographic}/u.test(text));
    expect(offenders).toEqual([]);
  });

  it('el teléfono está en formato E.164 y el de WhatsApp solo tiene dígitos', () => {
    expect(site.phoneE164).toMatch(/^\+593\d{9}$/);
    expect(site.whatsappNumber).toMatch(/^593\d{9}$/);
    expect(site.phoneE164).toBe(`+${site.whatsappNumber}`);
  });

  it('los identificadores de servicio son únicos', () => {
    const ids = site.serviceGroups.flatMap((group) => group.services.map((service) => service.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(serviceNames.length).toBe(ids.length);
  });

  it('la descripción sirve como meta description', () => {
    expect(site.description.length).toBeGreaterThanOrEqual(70);
    expect(site.description.length).toBeLessThanOrEqual(160);
  });

  it('el horario abre al menos cinco días', () => {
    const openDays = Object.values(site.schedule).filter(Boolean);
    expect(openDays.length).toBeGreaterThanOrEqual(5);
  });

  it('cada resumen de servicio es corto', () => {
    for (const name of site.serviceGroups.flatMap((group) => group.services)) {
      expect(name.summary.split(' ').length, name.name).toBeLessThanOrEqual(20);
    }
  });
});
```

- [ ] **Paso 2: Correr y ver que falla**

```bash
npx vitest run tests/unit/content.test.ts
```

- [ ] **Paso 3: Escribir los datos**

```ts
/** Fuente única de datos del negocio. Datos tomados de tecnicentro80.com y rodmotors.ec (septiembre 2026). */

/** 0 = domingo ... 6 = sábado (mismo índice que Date#getUTCDay). */
export type DayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface TimeRange {
  /** "HH:MM" en 24 h, hora de Guayaquil */
  open: string;
  close: string;
}

export type WeeklySchedule = Record<DayIndex, TimeRange | null>;

export interface Service {
  id: string;
  name: string;
  summary: string;
}

export interface ServiceGroup {
  id: string;
  title: string;
  /** Icono Phosphor para astro-icon, p. ej. "ph:wrench" */
  icon: string;
  services: Service[];
}

export interface Review {
  quote: string;
  author: string;
  context: string;
}

export interface GuideItem {
  title: string;
  body: string;
}

export interface SiteData {
  name: string;
  legacyName: string;
  description: string;
  url: string;
  phoneDisplay: string;
  phoneE164: string;
  whatsappNumber: string;
  instagram: { handle: string; url: string };
  address: { street: string; reference: string; city: string; region: string; postalCode: string; countryCode: string };
  geo: { lat: number; lng: number };
  schedule: WeeklySchedule;
  yearsExperience: number;
  vehicleTypes: string[];
  youtubeIds: string[];
  serviceGroups: ServiceGroup[];
  guide: GuideItem[];
  reviews: Review[];
}

export const site: SiteData = {
  name: 'Rod Motors',
  legacyName: 'Tecnicentro 80',
  description:
    'Taller automotriz en Samanes 5, Guayaquil. Mantenimiento, diagnóstico computarizado y reparación para livianos, semipesados y pesados.',
  url: 'https://rodmotors.ec',
  phoneDisplay: '098 332 3194',
  phoneE164: '+593983323194',
  whatsappNumber: '593983323194',
  instagram: { handle: '@rodmotors.ec', url: 'https://www.instagram.com/rodmotors.ec/' },
  address: {
    street: 'Cdla. Samanes 5, Mz. 942, Solar 4',
    reference: 'Esquina de Av. del Maestro y Miguel Riofrío',
    city: 'Guayaquil',
    region: 'Guayas',
    postalCode: '090509',
    countryCode: 'EC',
  },
  geo: { lat: -2.113483, lng: -79.895025 },
  // PENDIENTE DE CONFIRMAR: los dos sitios actuales publican horarios distintos.
  schedule: {
    0: null,
    1: { open: '08:30', close: '18:00' },
    2: { open: '08:30', close: '18:00' },
    3: { open: '08:30', close: '18:00' },
    4: { open: '08:30', close: '18:00' },
    5: { open: '08:30', close: '18:00' },
    6: { open: '08:30', close: '17:00' },
  },
  yearsExperience: 10,
  vehicleTypes: ['Livianos', 'Semipesados', 'Pesados'],
  youtubeIds: ['t3sSL3RLqLA', 'nQSDrwFfDnI'],
  serviceGroups: [
    {
      id: 'mantenimiento',
      title: 'Mantenimiento',
      icon: 'ph:wrench',
      services: [
        { id: 'mantenimiento-preventivo', name: 'Mantenimiento preventivo', summary: 'Revisiones periódicas para evitar fallas y alargar la vida útil del vehículo.' },
        { id: 'cambio-de-aceite', name: 'Cambio de aceite', summary: 'Aceite a tiempo para que el motor no acumule residuos ni se desgaste.' },
        { id: 'limpieza-de-inyectores', name: 'Limpieza de inyectores', summary: 'Quitamos carbón y depósitos para recuperar aceleración y bajar el consumo.' },
      ],
    },
    {
      id: 'diagnostico-y-motor',
      title: 'Diagnóstico y motor',
      icon: 'ph:engine',
      services: [
        { id: 'diagnostico-computarizado', name: 'Diagnóstico computarizado', summary: 'Escaneamos el sistema electrónico y mecánico para encontrar el origen de la falla.' },
        { id: 'motor', name: 'Motor', summary: 'Mantenimiento y reparación de motor para todo tipo de vehículo.' },
        { id: 'transmision', name: 'Transmisión', summary: 'Revisión y reparación del eje de transmisión.' },
      ],
    },
    {
      id: 'frenos-suspension-direccion',
      title: 'Frenos, suspensión y dirección',
      icon: 'ph:steering-wheel',
      services: [
        { id: 'frenos', name: 'Frenos', summary: 'Mantenimiento de frenos para manejar seguro en la ciudad y en carretera.' },
        { id: 'suspension', name: 'Suspensión', summary: 'Si el vehículo vibra, suena o pierde estabilidad, revisamos la suspensión.' },
        { id: 'direccion', name: 'Dirección', summary: 'Revisión del sistema de dirección para un manejo preciso y suave.' },
        { id: 'alineacion-computarizada', name: 'Alineación computarizada', summary: 'Medimos la geometría de las ruedas para cuidar llantas, estabilidad y consumo.' },
      ],
    },
  ],
  guide: [
    { title: 'Aceite de motor', body: 'Si no se cambia a tiempo, se acumulan residuos que desgastan las piezas del motor.' },
    { title: 'Inyectores', body: 'Limpios, dosifican bien el combustible y evitan consumo excesivo u obstrucciones.' },
    { title: 'Bujías', body: 'Las de cobre se cambian cada 20.000 km. Las de iridio, entre 80.000 y 100.000 km.' },
    { title: 'Cuerpo de aceleración', body: 'Limpiarlo quita hollín y carbón, ahorra combustible y evita reparaciones costosas.' },
  ],
  // Vacío hasta tener reseñas reales con permiso del cliente. La sección no se renderiza si está vacío.
  reviews: [],
};

export const serviceNames: string[] = site.serviceGroups.flatMap((group) => group.services.map((s) => s.name));
```

- [ ] **Paso 4: Correr y ver que pasa**

```bash
npx vitest run tests/unit/content.test.ts
```

Esperado: 7 tests en verde.

- [ ] **Paso 5: Commit**

```bash
git add -A && git commit -m "feat: datos del negocio en un solo archivo"
```

### Tarea 4: Horario y estado abierto o cerrado

**Archivos:**
- Crear: `src/lib/hours.ts`, `tests/unit/hours.test.ts`

**Interfaces:**
- Consume: `WeeklySchedule` de `src/data/site.ts`.
- Produce: `getOpenStatus(date, schedule): OpenStatus`, `formatOpenStatus(status): string`, `groupSchedule(schedule): ScheduleRow[]`, `guayaquilIsoDate(date): string`, `dayOfIsoDate(iso): DayIndex`, `DAY_NAMES`, `toMinutes`, `guayaquilClock`.

- [ ] **Paso 1: Escribir el test que falla**

```ts
import { describe, expect, it } from 'vitest';
import type { WeeklySchedule } from '../../src/data/site';
import { dayOfIsoDate, formatOpenStatus, getOpenStatus, groupSchedule, guayaquilClock, guayaquilIsoDate } from '../../src/lib/hours';

const schedule: WeeklySchedule = {
  0: null,
  1: { open: '08:30', close: '18:00' },
  2: { open: '08:30', close: '18:00' },
  3: { open: '08:30', close: '18:00' },
  4: { open: '08:30', close: '18:00' },
  5: { open: '08:30', close: '18:00' },
  6: { open: '08:30', close: '17:00' },
};

const at = (isoUtc: string) => new Date(isoUtc);

describe('guayaquilClock', () => {
  it('convierte UTC a hora local de Guayaquil', () => {
    expect(guayaquilClock(at('2026-09-16T15:00:00Z'))).toEqual({ day: 3, minutes: 600 });
  });
  it('mantiene el día local cuando en UTC ya es el siguiente', () => {
    expect(guayaquilClock(at('2026-09-17T02:00:00Z'))).toEqual({ day: 3, minutes: 21 * 60 });
  });
});

describe('getOpenStatus', () => {
  it('abierto un miércoles a las 10:00', () => {
    expect(getOpenStatus(at('2026-09-16T15:00:00Z'), schedule)).toEqual({ kind: 'open', closesAt: '18:00' });
  });
  it('antes de abrir dice que abre hoy', () => {
    expect(getOpenStatus(at('2026-09-16T12:00:00Z'), schedule)).toEqual({ kind: 'closed', opensAt: '08:30', opensOn: 'today' });
  });
  it('a la hora exacta de cierre ya está cerrado', () => {
    expect(getOpenStatus(at('2026-09-16T23:00:00Z'), schedule)).toEqual({ kind: 'closed', opensAt: '08:30', opensOn: 'tomorrow' });
  });
  it('el sábado en la noche salta el domingo cerrado', () => {
    expect(getOpenStatus(at('2026-09-19T23:30:00Z'), schedule)).toEqual({ kind: 'closed', opensAt: '08:30', opensOn: 1 });
  });
  it('sin días abiertos devuelve unknown', () => {
    const closed: WeeklySchedule = { 0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: null };
    expect(getOpenStatus(at('2026-09-16T15:00:00Z'), closed)).toEqual({ kind: 'unknown' });
  });
});

describe('formatOpenStatus', () => {
  it('formatea cada estado', () => {
    expect(formatOpenStatus({ kind: 'open', closesAt: '18:00' })).toBe('Abierto ahora. Cierra a las 18:00');
    expect(formatOpenStatus({ kind: 'closed', opensAt: '08:30', opensOn: 'today' })).toBe('Cerrado. Abre hoy a las 08:30');
    expect(formatOpenStatus({ kind: 'closed', opensAt: '08:30', opensOn: 'tomorrow' })).toBe('Cerrado. Abre mañana a las 08:30');
    expect(formatOpenStatus({ kind: 'closed', opensAt: '08:30', opensOn: 1 })).toBe('Cerrado. Abre el lunes a las 08:30');
    expect(formatOpenStatus({ kind: 'unknown' })).toBe('Consulta nuestro horario');
  });
});

describe('groupSchedule', () => {
  it('agrupa días consecutivos con el mismo horario', () => {
    expect(groupSchedule(schedule)).toEqual([
      { label: 'Lunes a viernes', hours: '08:30 a 18:00' },
      { label: 'Sábado', hours: '08:30 a 17:00' },
      { label: 'Domingo', hours: 'Cerrado' },
    ]);
  });
});

describe('fechas', () => {
  it('dayOfIsoDate no depende de la zona horaria', () => {
    expect(dayOfIsoDate('2026-09-20')).toBe(0);
    expect(dayOfIsoDate('2026-09-21')).toBe(1);
  });
  it('guayaquilIsoDate usa la fecha local', () => {
    expect(guayaquilIsoDate(at('2026-09-17T03:00:00Z'))).toBe('2026-09-16');
  });
});
```

- [ ] **Paso 2: Correr y ver que falla**

```bash
npx vitest run tests/unit/hours.test.ts
```

- [ ] **Paso 3: Implementar**

```ts
import type { DayIndex, TimeRange, WeeklySchedule } from '../data/site';

/** Ecuador continental usa UTC-5 todo el año (no hay horario de verano). */
const GUAYAQUIL_UTC_OFFSET_MINUTES = -300;

export const DAY_NAMES: Record<DayIndex, string> = {
  0: 'domingo', 1: 'lunes', 2: 'martes', 3: 'miércoles', 4: 'jueves', 5: 'viernes', 6: 'sábado',
};

export function toMinutes(hhmm: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!match) throw new Error(`Hora inválida: ${hhmm}`);
  return Number(match[1]) * 60 + Number(match[2]);
}

export function guayaquilClock(date: Date): { day: DayIndex; minutes: number } {
  const shifted = new Date(date.getTime() + GUAYAQUIL_UTC_OFFSET_MINUTES * 60_000);
  return { day: shifted.getUTCDay() as DayIndex, minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes() };
}

export type OpenStatus =
  | { kind: 'open'; closesAt: string }
  | { kind: 'closed'; opensAt: string; opensOn: 'today' | 'tomorrow' | DayIndex }
  | { kind: 'unknown' };

export function getOpenStatus(date: Date, schedule: WeeklySchedule): OpenStatus {
  const { day, minutes } = guayaquilClock(date);
  const today = schedule[day];
  if (today) {
    if (minutes >= toMinutes(today.open) && minutes < toMinutes(today.close)) return { kind: 'open', closesAt: today.close };
    if (minutes < toMinutes(today.open)) return { kind: 'closed', opensAt: today.open, opensOn: 'today' };
  }
  for (let offset = 1; offset <= 7; offset += 1) {
    const nextDay = ((day + offset) % 7) as DayIndex;
    const range = schedule[nextDay];
    if (range) return { kind: 'closed', opensAt: range.open, opensOn: offset === 1 ? 'tomorrow' : nextDay };
  }
  return { kind: 'unknown' };
}

export function formatOpenStatus(status: OpenStatus): string {
  switch (status.kind) {
    case 'open':
      return `Abierto ahora. Cierra a las ${status.closesAt}`;
    case 'closed': {
      const when = status.opensOn === 'today' ? 'hoy' : status.opensOn === 'tomorrow' ? 'mañana' : `el ${DAY_NAMES[status.opensOn]}`;
      return `Cerrado. Abre ${when} a las ${status.opensAt}`;
    }
    default:
      return 'Consulta nuestro horario';
  }
}

export interface ScheduleRow { label: string; hours: string }

const READING_ORDER: DayIndex[] = [1, 2, 3, 4, 5, 6, 0];

function sameRange(a: TimeRange | null, b: TimeRange | null): boolean {
  if (a === null || b === null) return a === b;
  return a.open === b.open && a.close === b.close;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Agrupa días consecutivos con el mismo horario: "Lunes a viernes: 08:30 a 18:00". */
export function groupSchedule(schedule: WeeklySchedule): ScheduleRow[] {
  const groups: { days: DayIndex[]; range: TimeRange | null }[] = [];
  for (const day of READING_ORDER) {
    const range = schedule[day];
    const last = groups.at(-1);
    if (last && sameRange(last.range, range)) last.days.push(day);
    else groups.push({ days: [day], range });
  }
  return groups.map(({ days, range }) => ({
    label: days.length === 1 ? capitalize(DAY_NAMES[days[0]]) : `${capitalize(DAY_NAMES[days[0]])} a ${DAY_NAMES[days[days.length - 1]]}`,
    hours: range ? `${range.open} a ${range.close}` : 'Cerrado',
  }));
}

/** Día de la semana de una fecha "YYYY-MM-DD" sin depender de la zona horaria del navegador. */
export function dayOfIsoDate(isoDate: string): DayIndex {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay() as DayIndex;
}

/** Fecha de hoy en Guayaquil como "YYYY-MM-DD". */
export function guayaquilIsoDate(date: Date): string {
  return new Date(date.getTime() + GUAYAQUIL_UTC_OFFSET_MINUTES * 60_000).toISOString().slice(0, 10);
}
```

- [ ] **Paso 4: Correr y ver que pasa (11 tests)**

```bash
npx vitest run tests/unit/hours.test.ts
```

- [ ] **Paso 5: Commit**

```bash
git add -A && git commit -m "feat: horario con estado abierto o cerrado en hora de Guayaquil"
```

### Tarea 5: Orden de trabajo hacia WhatsApp

**Archivos:**
- Crear: `src/lib/whatsapp.ts`, `tests/unit/whatsapp.test.ts`

**Interfaces:**
- Consume: `site.schedule`, `serviceNames`, `dayOfIsoDate`, `DAY_NAMES`.
- Produce: `VEHICLE_TYPES`, `VEHICLE_LABELS`, `validateBooking(input, context): ValidationResult`, `composeBookingMessage(booking, businessName): string`, `buildWhatsAppUrl(numero, mensaje): string`, `formatBookingDate(iso): string`, tipos `BookingInput`, `Booking`, `BookingField`.

- [ ] **Paso 1: Escribir el test que falla**

```ts
import { describe, expect, it } from 'vitest';
import { serviceNames, site } from '../../src/data/site';
import { buildWhatsAppUrl, composeBookingMessage, formatBookingDate, validateBooking } from '../../src/lib/whatsapp';
import type { BookingInput } from '../../src/lib/whatsapp';

const context = { today: '2026-09-16', schedule: site.schedule, services: serviceNames };

const empty: BookingInput = { vehicleType: '', service: '', vehicle: '', plate: '', preferredDate: '', name: '', notes: '' };
const valid: BookingInput = { ...empty, vehicleType: 'pesado', service: 'Alineación computarizada' };

describe('validateBooking', () => {
  it('exige tipo de vehículo y servicio', () => {
    const result = validateBooking(empty, context);
    expect(result).toEqual({ ok: false, errors: { vehicleType: 'Elige el tipo de vehículo.', service: 'Elige un servicio.' } });
  });
  it('rechaza servicios fuera de la lista', () => {
    const result = validateBooking({ ...valid, service: 'Pintura' }, context);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.service).toBe('Ese servicio no está en la lista.');
  });
  it('rechaza fechas pasadas', () => {
    const result = validateBooking({ ...valid, preferredDate: '2026-09-15' }, context);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.preferredDate).toBe('Elige una fecha de hoy en adelante.');
  });
  it('rechaza días cerrados', () => {
    const result = validateBooking({ ...valid, preferredDate: '2026-09-20' }, context);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.preferredDate).toBe('Ese día el taller está cerrado. Elige otro.');
  });
  it('acepta el mismo día y normaliza la placa', () => {
    const result = validateBooking({ ...valid, preferredDate: '2026-09-16', plate: ' gba-1234 ' }, context);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.booking).toEqual({ vehicleType: 'pesado', service: 'Alineación computarizada', plate: 'GBA-1234', preferredDate: '2026-09-16' });
  });
  it('limita el largo de la nota', () => {
    const result = validateBooking({ ...valid, notes: 'a'.repeat(301) }, context);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.notes).toBe('La nota no puede pasar de 300 caracteres.');
  });
});

describe('mensaje de WhatsApp', () => {
  it('formatea la fecha en español', () => {
    expect(formatBookingDate('2026-09-22')).toBe('martes 22/09/2026');
  });
  it('arma el mensaje solo con los campos llenos', () => {
    const message = composeBookingMessage({ vehicleType: 'liviano', service: 'Frenos', vehicle: 'Chevrolet Sail 2018' }, site.name);
    expect(message).toBe(['Hola Rod Motors, quiero agendar una cita.', 'Servicio: Frenos', 'Vehículo: Liviano, Chevrolet Sail 2018'].join('\n'));
  });
  it('arma la URL de wa.me con el texto codificado', () => {
    const url = buildWhatsAppUrl(site.whatsappNumber, 'Hola Rod Motors\nServicio: Frenos');
    expect(url).toBe('https://wa.me/593983323194?text=Hola%20Rod%20Motors%0AServicio%3A%20Frenos');
  });
  it('rechaza números mal formados', () => {
    expect(() => buildWhatsAppUrl('+593983323194', 'hola')).toThrow();
  });
});
```

- [ ] **Paso 2: Correr y ver que falla**

```bash
npx vitest run tests/unit/whatsapp.test.ts
```

- [ ] **Paso 3: Implementar**

```ts
import type { WeeklySchedule } from '../data/site';
import { DAY_NAMES, dayOfIsoDate } from './hours';

export const VEHICLE_TYPES = ['liviano', 'semipesado', 'pesado'] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const VEHICLE_LABELS: Record<VehicleType, string> = {
  liviano: 'Liviano',
  semipesado: 'Semipesado',
  pesado: 'Pesado',
};

/** Lo que llega del formulario: todo string, como en el DOM. */
export interface BookingInput {
  vehicleType: string;
  service: string;
  vehicle: string;
  plate: string;
  preferredDate: string;
  name: string;
  notes: string;
}

export interface Booking {
  vehicleType: VehicleType;
  service: string;
  vehicle?: string;
  plate?: string;
  preferredDate?: string;
  name?: string;
  notes?: string;
}

export type BookingField = keyof BookingInput;

export type ValidationResult =
  | { ok: true; booking: Booking }
  | { ok: false; errors: Partial<Record<BookingField, string>> };

export interface ValidationContext {
  /** Fecha de hoy en Guayaquil, "YYYY-MM-DD". */
  today: string;
  schedule: WeeklySchedule;
  services: string[];
}

const MAX_PLATE = 10;
const MAX_NAME = 60;
const MAX_NOTES = 300;

export function validateBooking(input: BookingInput, context: ValidationContext): ValidationResult {
  const errors: Partial<Record<BookingField, string>> = {};
  const vehicleType = input.vehicleType.trim() as VehicleType;
  const service = input.service.trim();
  const vehicle = input.vehicle.trim();
  const plate = input.plate.trim().toUpperCase();
  const preferredDate = input.preferredDate.trim();
  const name = input.name.trim();
  const notes = input.notes.trim();

  if (!VEHICLE_TYPES.includes(vehicleType)) errors.vehicleType = 'Elige el tipo de vehículo.';
  if (!service) errors.service = 'Elige un servicio.';
  else if (!context.services.includes(service)) errors.service = 'Ese servicio no está en la lista.';
  if (plate.length > MAX_PLATE) errors.plate = `La placa no puede pasar de ${MAX_PLATE} caracteres.`;
  if (name.length > MAX_NAME) errors.name = `El nombre no puede pasar de ${MAX_NAME} caracteres.`;
  if (notes.length > MAX_NOTES) errors.notes = `La nota no puede pasar de ${MAX_NOTES} caracteres.`;
  if (preferredDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) errors.preferredDate = 'Usa el selector de fecha.';
    else if (preferredDate < context.today) errors.preferredDate = 'Elige una fecha de hoy en adelante.';
    else if (context.schedule[dayOfIsoDate(preferredDate)] === null) errors.preferredDate = 'Ese día el taller está cerrado. Elige otro.';
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    booking: {
      vehicleType,
      service,
      ...(vehicle ? { vehicle } : {}),
      ...(plate ? { plate } : {}),
      ...(preferredDate ? { preferredDate } : {}),
      ...(name ? { name } : {}),
      ...(notes ? { notes } : {}),
    },
  };
}

/** "2026-09-22" -> "martes 22/09/2026" */
export function formatBookingDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return `${DAY_NAMES[dayOfIsoDate(isoDate)]} ${d}/${m}/${y}`;
}

export function composeBookingMessage(booking: Booking, businessName: string): string {
  const lines = [`Hola ${businessName}, quiero agendar una cita.`, `Servicio: ${booking.service}`];
  lines.push(`Vehículo: ${VEHICLE_LABELS[booking.vehicleType]}${booking.vehicle ? `, ${booking.vehicle}` : ''}`);
  if (booking.plate) lines.push(`Placa: ${booking.plate}`);
  if (booking.preferredDate) lines.push(`Día preferido: ${formatBookingDate(booking.preferredDate)}`);
  if (booking.name) lines.push(`Mi nombre: ${booking.name}`);
  if (booking.notes) lines.push(`Nota: ${booking.notes}`);
  return lines.join('\n');
}

export function buildWhatsAppUrl(whatsappNumber: string, message: string): string {
  if (!/^\d{8,15}$/.test(whatsappNumber)) throw new Error(`Número de WhatsApp inválido: ${whatsappNumber}`);
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}
```

- [ ] **Paso 4: Correr y ver que pasa (10 tests)**

- [ ] **Paso 5: Commit**

```bash
git add -A && git commit -m "feat: validación y mensaje de la orden de trabajo"
```

### Tarea 6: Datos estructurados del negocio local

**Archivos:**
- Crear: `src/lib/schema.ts`, `tests/unit/schema.test.ts`

**Interfaces:**
- Produce: `buildOpeningHours(site)` y `buildAutoRepairJsonLd(site, imageUrl)`, que consume `Base.astro`.

- [ ] **Paso 1: Escribir el test que falla**

```ts
import { describe, expect, it } from 'vitest';
import { site } from '../../src/data/site';
import { buildAutoRepairJsonLd, buildOpeningHours } from '../../src/lib/schema';

describe('buildOpeningHours', () => {
  it('agrupa los días que comparten horario y omite los cerrados', () => {
    expect(buildOpeningHours(site)).toEqual([
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:30', closes: '18:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday'], opens: '08:30', closes: '17:00' },
    ]);
  });
});

describe('buildAutoRepairJsonLd', () => {
  const jsonLd = buildAutoRepairJsonLd(site, 'https://rodmotors.ec/og.jpg');

  it('usa el tipo AutoRepair y datos de contacto reales', () => {
    expect(jsonLd['@type']).toBe('AutoRepair');
    expect(jsonLd.telephone).toBe('+593983323194');
    expect(jsonLd.geo).toEqual({ '@type': 'GeoCoordinates', latitude: -2.113483, longitude: -79.895025 });
  });
  it('es serializable sin perder datos', () => {
    expect(JSON.parse(JSON.stringify(jsonLd))).toEqual(jsonLd);
  });
  it('publica todos los servicios', () => {
    expect((jsonLd.makesOffer as unknown[]).length).toBe(10);
  });
});
```

- [ ] **Paso 2: Correr y ver que falla**

- [ ] **Paso 3: Implementar**

```ts
import type { DayIndex, SiteData } from '../data/site';

const SCHEMA_DAYS: Record<DayIndex, string> = {
  0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday',
};

export interface OpeningHoursSpecification {
  '@type': 'OpeningHoursSpecification';
  dayOfWeek: string[];
  opens: string;
  closes: string;
}

export function buildOpeningHours(site: SiteData): OpeningHoursSpecification[] {
  const byRange = new Map<string, DayIndex[]>();
  for (const day of [1, 2, 3, 4, 5, 6, 0] as DayIndex[]) {
    const range = site.schedule[day];
    if (!range) continue;
    const key = `${range.open}-${range.close}`;
    byRange.set(key, [...(byRange.get(key) ?? []), day]);
  }
  return [...byRange.entries()].map(([key, days]) => {
    const [opens, closes] = key.split('-');
    return { '@type': 'OpeningHoursSpecification', dayOfWeek: days.map((d) => SCHEMA_DAYS[d]), opens, closes };
  });
}

/** JSON-LD schema.org AutoRepair para la ficha local del negocio. */
export function buildAutoRepairJsonLd(site: SiteData, imageUrl: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'AutoRepair',
    '@id': `${site.url}/#taller`,
    name: site.name,
    alternateName: site.legacyName,
    description: site.description,
    url: `${site.url}/`,
    image: imageUrl,
    telephone: site.phoneE164,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${site.address.street}. ${site.address.reference}`,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.countryCode,
    },
    geo: { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lng },
    openingHoursSpecification: buildOpeningHours(site),
    areaServed: { '@type': 'City', name: site.address.city },
    sameAs: [site.instagram.url],
    makesOffer: site.serviceGroups.flatMap((group) =>
      group.services.map((service) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: service.name } })),
    ),
  };
}
```

- [ ] **Paso 4: Correr y ver que pasa (4 tests)**

- [ ] **Paso 5: Commit**

```bash
git add -A && git commit -m "feat: JSON-LD AutoRepair"
```

### Tarea 7: Fotos provisionales, favicon e imagen social

**Archivos:**
- Crear: `scripts/placeholder-photos.mjs`, `scripts/og-image.mjs`, `public/favicon.svg`, `src/assets/photos/*.jpg`, `public/og.jpg`
- Borrar: `public/favicon.ico` (viene del template)

**Interfaces:**
- Produce: seis archivos de foto con nombres fijos que los componentes importan: `hero.jpg`, `diagnostico.jpg`, `alineadora.jpg`, `pesados.jpg`, `equipo.jpg`, `fachada.jpg`.

Las fotos reales son la parte más importante del rediseño. Lista de tomas que necesita el cliente, en horizontal salvo donde se indique:

| Archivo | Proporción | Toma |
|---|---|---|
| `hero.jpg` | 4:3 | Bahía con un vehículo en el elevador, taller ordenado, luz de día |
| `diagnostico.jpg` | 4:5 vertical | Técnico conectando el escáner, primer plano de la pantalla |
| `alineadora.jpg` | 4:3 | Alineadora computarizada trabajando sobre una rueda |
| `pesados.jpg` | 16:9 | Camión o vehículo semipesado en servicio, para probar que sí atienden ese tamaño |
| `equipo.jpg` | 1:1 | Técnico trabajando en un motor, manos y herramienta a la vista |
| `fachada.jpg` | 16:10 | Fachada con el letrero desde la vereda, para que la gente reconozca el local |

- [ ] **Paso 1: Script de imágenes provisionales**

```js
/**
 * Genera imágenes provisionales para que el sitio compile antes de tener las fotos reales.
 * Uso: node scripts/placeholder-photos.mjs
 */
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const OUT = new URL('../src/assets/photos/', import.meta.url);

const slots = [
  { file: 'hero.jpg', width: 1600, height: 1200 },
  { file: 'diagnostico.jpg', width: 1200, height: 1500 },
  { file: 'alineadora.jpg', width: 1200, height: 900 },
  { file: 'pesados.jpg', width: 1600, height: 900 },
  { file: 'equipo.jpg', width: 1200, height: 1200 },
  { file: 'fachada.jpg', width: 1600, height: 1000 },
];

await mkdir(OUT, { recursive: true });
for (const slot of slots) {
  await sharp({ create: { width: slot.width, height: slot.height, channels: 3, background: '#cdd3d8' } })
    .jpeg({ quality: 70 })
    .toFile(new URL(slot.file, OUT).pathname);
  console.log('placeholder:', slot.file, `${slot.width}x${slot.height}`);
}
```

- [ ] **Paso 2: Generarlas**

```bash
node scripts/placeholder-photos.mjs
```

Esperado: seis líneas `placeholder: ...` y seis archivos en `src/assets/photos/`. Son grises planos a propósito: no se usan fotos de stock de talleres ajenos, y los componentes las marcan con `data-placeholder` para que el test de lanzamiento las bloquee.

- [ ] **Paso 3: Favicon provisional**

`public/favicon.svg` (se reemplaza en cuanto llegue el logo en vector):

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Rod Motors">
  <rect width="64" height="64" fill="#15202b" />
  <text x="32" y="43" font-family="Archivo, system-ui, sans-serif" font-size="30" font-weight="700" text-anchor="middle" fill="#e0a82e">RM</text>
</svg>
```

```bash
rm -f public/favicon.ico
```

- [ ] **Paso 4: Imagen social**

```js
/**
 * Genera la imagen de Open Graph a partir de una foto del taller.
 * Uso: node scripts/og-image.mjs [entrada] [salida]
 */
import sharp from 'sharp';

const [input = 'src/assets/photos/fachada.jpg', output = 'public/og.jpg'] = process.argv.slice(2);
await sharp(input).resize(1200, 630, { fit: 'cover', position: 'centre' }).jpeg({ quality: 82 }).toFile(output);
console.log(`og listo: ${output} (1200x630) desde ${input}`);
```

```bash
node scripts/og-image.mjs
```

- [ ] **Paso 5: Commit**

```bash
git add -A && git commit -m "chore: fotos provisionales, favicon e imagen social"
```

### Tarea 8: Layout base, header y hero

**Archivos:**
- Crear: `src/layouts/Base.astro`, `src/components/Header.astro`, `src/components/Hero.astro`, `tests/build/output.test.ts`
- Modificar: `src/pages/index.astro`

**Interfaces:**
- Consume: `site`, `buildAutoRepairJsonLd`.
- Produce: `Base.astro` con props `{ title: string; description?: string }` y un `<slot />`; el ancla `#agendar` que usan todos los CTA; el ancla `#contenido` del skip link.

Reglas de esta pantalla, tomadas del spec: el hero entra en el viewport (titular de máximo 2 líneas, subtítulo de máximo 20 palabras, CTA visible sin scroll), máximo 4 elementos de texto, sin etiqueta en mayúsculas encima del título, sin indicadores de scroll, la nav en una sola línea y con altura de 64 px.

- [ ] **Paso 1: Layout base**

```astro
---
import '../styles/global.css';
import archivoWoff2 from '@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2?url';
import { site } from '../data/site';
import { buildAutoRepairJsonLd } from '../lib/schema';

interface Props {
  title: string;
  description?: string;
}

const { title, description = site.description } = Astro.props;
const canonical = new URL(Astro.url.pathname, Astro.site ?? site.url).href;
const ogImage = new URL('/og.jpg', Astro.site ?? site.url).href;
const jsonLd = JSON.stringify(buildAutoRepairJsonLd(site, ogImage));
---

<!doctype html>
<html lang="es-EC">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <link rel="preload" href={archivoWoff2} as="font" type="font/woff2" crossorigin="anonymous" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="es_EC" />
    <meta property="og:site_name" content={site.name} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={ogImage} />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <script type="application/ld+json" is:inline set:html={jsonLd} />
  </head>
  <body>
    <a href="#contenido" class="sr-only focus:not-sr-only focus:absolute focus:m-3 focus:bg-surface focus:px-4 focus:py-2 focus:text-ink">
      Saltar al contenido
    </a>
    <slot />
  </body>
</html>
```

- [ ] **Paso 2: Header**

```astro
---
import { Icon } from 'astro-icon/components';
import { site } from '../data/site';

const links = [
  { href: '#servicios', label: 'Servicios' },
  { href: '#taller', label: 'El taller' },
  { href: '#ubicacion', label: 'Ubicación' },
];
---

<header class="sticky top-0 z-10 bg-brand text-on-brand">
  <div class="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-4">
    <a class="display text-xl" href="/">{site.name}</a>

    <nav class="hidden items-center gap-6 md:flex" aria-label="Secciones">
      {links.map((link) => <a class="text-on-brand/80 hover:text-on-brand" href={link.href}>{link.label}</a>)}
      <a class="inline-flex items-center gap-2 bg-accent px-4 py-2 font-semibold text-on-accent" href="#agendar">
        <Icon name="ph:whatsapp-logo" class="size-5" aria-hidden="true" />
        Agendar por WhatsApp
      </a>
    </nav>

    <details class="relative md:hidden">
      <summary class="flex size-10 cursor-pointer items-center justify-center border border-on-brand/30" aria-label="Abrir menú">
        <Icon name="ph:list" class="size-5" aria-hidden="true" />
      </summary>
      <nav class="absolute right-0 mt-2 grid w-56 gap-1 border border-line bg-surface p-3 text-ink" aria-label="Secciones">
        {links.map((link) => <a class="px-2 py-2" href={link.href}>{link.label}</a>)}
      </nav>
    </details>
  </div>
</header>
```

El header ya no es un panel translúcido sobre el fondo: es un bloque sólido `bg-brand`, para que el azul de marca aparezca desde el primer scroll, como se aprobó en el canvas de diseño.

- [ ] **Paso 3: Hero, variante B**

Entre las dos variantes mostradas en el canvas de diseño (split con foto a un lado, o foto a ancho completo con un panel de marca encima), se aprobó la **B**: foto a ancho completo con un panel sólido de azul de marca sobre la izquierda, sin degradado. En celular, donde un panel lateral no cabe, el texto va apilado sobre fondo `brand` y la foto queda debajo; es la única adaptación que introduce el código respecto al canvas, porque ahí solo existía como maqueta de escritorio.

```astro
---
import { Image } from 'astro:assets';
import { Icon } from 'astro-icon/components';
import heroPhoto from '../assets/photos/hero.jpg';
import { site } from '../data/site';
---

<!--
  Variante B, aprobada en el canvas de diseño: foto de bahía a ancho completo con un
  panel sólido de azul de marca (sin degradado) sobre la izquierda. En celular el texto
  va apilado sobre fondo de marca y la foto queda debajo.
-->
<section class="relative isolate">
  <div class="flex flex-col md:block">
    <div class="order-2 md:order-none md:absolute md:inset-0">
      <Image
        src={heroPhoto}
        alt={`Bahía de servicio de ${site.name} con un vehículo en el elevador`}
        widths={[640, 960, 1280, 1600, 1920]}
        sizes="100vw"
        loading="eager"
        fetchpriority="high"
        class="h-64 w-full object-cover md:h-full"
        data-placeholder
      />
    </div>

    <div class="relative z-10 order-1 bg-brand px-4 py-12 text-on-brand md:absolute md:inset-y-0 md:left-0 md:order-none md:flex md:w-[62%] md:items-center md:px-16 md:py-0 lg:w-[55%]">
      <div class="mx-auto max-w-[46ch] md:mx-0">
        <h1 class="display text-4xl md:text-5xl lg:text-6xl">Taller automotriz en Samanes 5</h1>
        <p class="mt-5 max-w-[42ch] text-lg text-on-brand/80">
          Mantenimiento, diagnóstico computarizado y reparación para livianos, semipesados y pesados. Todas las marcas.
        </p>
        <div class="mt-8 flex flex-wrap items-center gap-4">
          <a
            href="#agendar"
            class="inline-flex items-center gap-2 bg-accent px-5 py-3 font-semibold text-on-accent transition-transform duration-200 hover:-translate-y-px active:translate-y-px"
          >
            <Icon name="ph:whatsapp-logo" class="size-5" aria-hidden="true" />
            Agendar por WhatsApp
          </a>
          <a href="#ubicacion" class="text-on-brand underline underline-offset-4">Cómo llegar</a>
        </div>
      </div>
    </div>
  </div>
</section>
```

El panel es un `bg-brand` sólido, no una capa semitransparente sobre la foto: así el contraste del texto no depende de qué tan clara u oscura salga la fotografía real que reemplace al provisional.

- [ ] **Paso 4: Página**

```astro
---
import Base from '../layouts/Base.astro';
import Header from '../components/Header.astro';
import Hero from '../components/Hero.astro';
import { site } from '../data/site';
---

<Base title={`${site.name}, taller automotriz en Samanes 5, Guayaquil`}>
  <Header />
  <main id="contenido">
    <Hero />
  </main>
</Base>
```

- [ ] **Paso 5: Tests sobre el HTML compilado**

```ts
import { readFileSync } from 'node:fs';
import { parse } from 'node-html-parser';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../../dist/index.html', import.meta.url), 'utf8');
const doc = parse(html);
const visibleText = doc.querySelector('body')?.structuredText ?? '';
const css = readFileSync(new URL('../../src/styles/global.css', import.meta.url), 'utf8');

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
```

- [ ] **Paso 6: Construir y correr los tests**

```bash
npm run test:build
```

Esperado: 9 tests en verde. El test de fotos provisionales solo corre con `LAUNCH=1`.

- [ ] **Paso 7: Commit**

```bash
git add -A && git commit -m "feat: layout base, header y hero con tests sobre el build"
```

### Tarea 9: Servicios

**Archivos:**
- Crear: `src/components/Services.astro`
- Modificar: `src/pages/index.astro` (agregar `<Services />` después de `<Hero />`)

**Interfaces:**
- Consume: `site.serviceGroups`, `site.vehicleTypes`, `site.yearsExperience`, la foto `diagnostico.jpg`.
- Produce: la sección `#servicios` a la que apunta la nav y la redirección de `/nuestros-servicios/catálogo`.

Bento de cinco celdas: tres grupos de servicios, una foto vertical y una celda tintada con los tipos de vehículo. Cinco contenidos, cinco celdas, ninguna vacía. Nada de tres tarjetas iguales en fila.

- [ ] **Paso 1: Componente**

```astro
---
import { Image } from 'astro:assets';
import { Icon } from 'astro-icon/components';
import diagnosticoPhoto from '../assets/photos/diagnostico.jpg';
import { site } from '../data/site';

const [mantenimiento, motor, tren] = site.serviceGroups;
const vehicleIcons = ['ph:car-profile', 'ph:van', 'ph:truck'];
---

<section id="servicios" class="mx-auto max-w-[1400px] px-4 py-16">
  <h2 class="display max-w-[20ch] text-3xl md:text-4xl">Lo que hacemos en el taller</h2>

  <div class="mt-8 grid gap-4 md:grid-cols-12">
    <article class="bg-surface p-6 md:col-span-5">
      <h3 class="flex items-center gap-3 text-xl font-semibold">
        <Icon name={mantenimiento.icon} class="size-6 text-accent-strong" aria-hidden="true" />
        {mantenimiento.title}
      </h3>
      <ul class="mt-4 grid gap-4">
        {mantenimiento.services.map((service) => (
          <li>
            <p class="font-medium">{service.name}</p>
            <p class="text-muted">{service.summary}</p>
          </li>
        ))}
      </ul>
    </article>

    <div class="md:col-span-3 md:row-span-2">
      <Image
        src={diagnosticoPhoto}
        alt="Técnico de Rod Motors conectando el escáner de diagnóstico a un vehículo"
        widths={[400, 600, 900]}
        sizes="(min-width: 768px) 25vw, 100vw"
        loading="lazy"
        class="h-full w-full object-cover"
        data-placeholder
      />
    </div>

    <article class="bg-surface p-6 md:col-span-4">
      <h3 class="flex items-center gap-3 text-xl font-semibold">
        <Icon name={motor.icon} class="size-6 text-accent-strong" aria-hidden="true" />
        {motor.title}
      </h3>
      <ul class="mt-4 grid gap-4">
        {motor.services.map((service) => (
          <li>
            <p class="font-medium">{service.name}</p>
            <p class="text-muted">{service.summary}</p>
          </li>
        ))}
      </ul>
    </article>

    <article class="bg-surface p-6 md:col-span-5">
      <h3 class="flex items-center gap-3 text-xl font-semibold">
        <Icon name={tren.icon} class="size-6 text-accent-strong" aria-hidden="true" />
        {tren.title}
      </h3>
      <ul class="mt-4 grid gap-4 sm:grid-cols-2">
        {tren.services.map((service) => (
          <li>
            <p class="font-medium">{service.name}</p>
            <p class="text-muted">{service.summary}</p>
          </li>
        ))}
      </ul>
    </article>

    <article class="border border-accent bg-accent/10 p-6 md:col-span-4">
      <h3 class="text-xl font-semibold">Atendemos todos los tamaños</h3>
      <ul class="mt-4 grid gap-3">
        {site.vehicleTypes.map((type, index) => (
          <li class="flex items-center gap-3">
            <Icon name={vehicleIcons[index]} class="size-6 text-accent-strong" aria-hidden="true" />
            {type}
          </li>
        ))}
      </ul>
      <p class="mt-4 text-muted">Todas las marcas, con más de {site.yearsExperience} años de experiencia.</p>
    </article>
  </div>
</section>
```

- [ ] **Paso 2: Verificar**

```bash
npm run verify
```

- [ ] **Paso 3: Commit**

```bash
git add -A && git commit -m "feat: sección de servicios en bento"
```

### Tarea 10: El taller, galería y videos

**Archivos:**
- Crear: `src/components/Workshop.astro`
- Modificar: `src/pages/index.astro`

**Interfaces:**
- Consume: `site.youtubeIds`, fotos `pesados.jpg`, `equipo.jpg`, `alineadora.jpg`.
- Produce: la sección `#taller`.

Los videos no cargan YouTube hasta que alguien hace clic: se muestra la miniatura de `i.ytimg.com` y el iframe se inserta al pulsar, contra `youtube-nocookie.com`. Es la diferencia entre 20 KB y más de 1 MB en la primera carga.

Esta es la otra sección donde el azul de marca domina, aprobado junto con el hero: fondo `bg-brand`, texto `on-brand`. Los recuadros de foto y video usan `bg-brand-soft`, el tono un poco más claro pensado para separarse del fondo sin depender del tema del sitio.

- [ ] **Paso 1: Componente**

```astro
---
import { Image } from 'astro:assets';
import { Icon } from 'astro-icon/components';
import alineadoraPhoto from '../assets/photos/alineadora.jpg';
import equipoPhoto from '../assets/photos/equipo.jpg';
import pesadosPhoto from '../assets/photos/pesados.jpg';
import { site } from '../data/site';

const videos = site.youtubeIds.map((id) => ({
  id,
  thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  url: `https://www.youtube.com/watch?v=${id}`,
}));
---

<section id="taller" class="bg-brand py-16 text-on-brand">
  <div class="mx-auto max-w-[1400px] px-4">
    <h2 class="display max-w-[22ch] text-3xl md:text-4xl">Técnicos, equipos y bahías para trabajo pesado</h2>
    <p class="mt-4 max-w-[60ch] text-on-brand/75">
      Somos un equipo de técnicos automotrices con diagnóstico computarizado y alineación computarizada en el taller de
      Samanes 5. Trabajamos mecánica preventiva y correctiva en livianos, semipesados y pesados.
    </p>

    <div class="mt-8 grid gap-4 md:grid-cols-12">
      <Image
        src={pesadosPhoto}
        alt="Camión en la bahía de trabajo pesado de Rod Motors"
        widths={[640, 960, 1600]}
        sizes="(min-width: 768px) 58vw, 100vw"
        loading="lazy"
        class="h-full w-full object-cover md:col-span-7"
        data-placeholder
      />
      <Image
        src={equipoPhoto}
        alt="Técnico de Rod Motors trabajando en el motor de una camioneta"
        widths={[480, 720, 1200]}
        sizes="(min-width: 768px) 40vw, 100vw"
        loading="lazy"
        class="h-full w-full object-cover md:col-span-5"
        data-placeholder
      />
      <Image
        src={alineadoraPhoto}
        alt="Alineadora computarizada midiendo la geometría de las ruedas"
        widths={[480, 720, 1200]}
        sizes="(min-width: 768px) 33vw, 100vw"
        loading="lazy"
        class="h-full w-full object-cover md:col-span-4"
        data-placeholder
      />

      {videos.map((video) => (
        <div class="relative aspect-video bg-brand-soft md:col-span-4" data-video data-id={video.id}>
          <img
            src={video.thumbnail}
            alt=""
            aria-hidden="true"
            width="480"
            height="360"
            loading="lazy"
            decoding="async"
            class="h-full w-full object-cover"
          />
          <button type="button" class="absolute inset-0 flex items-center justify-center bg-brand/35" data-video-boton>
            <span class="flex items-center gap-2 bg-accent px-4 py-2 font-semibold text-on-accent">
              <Icon name="ph:play" class="size-5" aria-hidden="true" />
              Ver video del taller
            </span>
          </button>
          <noscript>
            <a class="absolute inset-0 flex items-end p-3 text-accent underline" href={video.url}>Ver en YouTube</a>
          </noscript>
        </div>
      ))}
    </div>
  </div>
</section>

<script>
  for (const container of document.querySelectorAll<HTMLElement>('[data-video]')) {
    const boton = container.querySelector<HTMLButtonElement>('[data-video-boton]');
    boton?.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${container.dataset.id}?autoplay=1`;
      iframe.title = 'Video del taller Rod Motors';
      iframe.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.className = 'absolute inset-0 h-full w-full border-0';
      container.replaceChildren(iframe);
    });
  }
</script>
```

- [ ] **Paso 2: Verificar y commit**

```bash
npm run verify
git add -A && git commit -m "feat: sección del taller con galería y videos diferidos"
```

### Tarea 11: Opiniones y guía de mantenimiento

**Archivos:**
- Crear: `src/components/Reviews.astro`, `src/components/Guide.astro`
- Modificar: `src/pages/index.astro`

**Interfaces:**
- Consume: `site.reviews` (hoy vacío) y `site.guide`.
- Produce: la sección `#guia`, destino de la redirección del blog viejo.

`Reviews.astro` no renderiza nada mientras `site.reviews` esté vacío. Cuando el cliente entregue las reseñas reales, se agregan al arreglo con nombre y contexto ("Carla Mendoza, camioneta Hilux") y la sección aparece sola. Máximo 3 líneas por cita.

- [ ] **Paso 1: Opiniones**

```astro
---
import { site } from '../data/site';

const [featured, ...rest] = site.reviews;
---

{
  featured && (
    <section id="opiniones" class="mx-auto max-w-[1400px] px-4 py-16">
      <h2 class="display text-3xl md:text-4xl">Lo que dicen los clientes</h2>
      <div class="mt-8 grid gap-8 md:grid-cols-12">
        <blockquote class="md:col-span-7">
          <p class="text-2xl leading-snug">{featured.quote}</p>
          <footer class="mt-4 text-muted">
            {featured.author}, {featured.context}
          </footer>
        </blockquote>
        <div class="grid gap-6 md:col-span-5">
          {rest.map((review) => (
            <blockquote class="border-t border-line pt-4">
              <p>{review.quote}</p>
              <footer class="mt-2 text-muted">
                {review.author}, {review.context}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Paso 2: Guía**

```astro
---
import { site } from '../data/site';
---

<section id="guia" class="mx-auto max-w-[1400px] px-4 py-16">
  <div class="grid gap-8 md:grid-cols-12">
    <div class="md:col-span-4">
      <h2 class="display text-3xl md:text-4xl">Cada cuánto revisar</h2>
      <p class="mt-4 text-muted">Lo que más nos preguntan en el taller, resumido.</p>
    </div>
    <dl class="grid gap-6 md:col-span-8 md:grid-cols-2">
      {site.guide.map((item) => (
        <div class="border-t border-line pt-4">
          <dt class="font-semibold">{item.title}</dt>
          <dd class="numeric mt-1 text-muted">{item.body}</dd>
        </div>
      ))}
    </dl>
  </div>
</section>
```

- [ ] **Paso 3: Verificar y commit**

```bash
npm run verify
git add -A && git commit -m "feat: opiniones condicionales y guía de mantenimiento"
```

### Tarea 12: Orden de trabajo

**Archivos:**
- Crear: `src/components/Booking.astro`
- Modificar: `src/pages/index.astro`

**Interfaces:**
- Consume: `VEHICLE_TYPES`, `VEHICLE_LABELS`, `validateBooking`, `composeBookingMessage`, `buildWhatsAppUrl`, `guayaquilIsoDate`, `serviceNames`, `site`.
- Produce: la sección `#agendar` y el formulario `form[data-orden]` que prueban los tests e2e.

Es el elemento memorable de la página: el papel que llenan al recibir un vehículo, convertido en formulario. Sin JavaScript el formulario sigue abriendo WhatsApp (action a `wa.me`), con JavaScript agrega el mensaje armado. No guarda nada en ningún servidor y eso se dice en pantalla.

- [ ] **Paso 1: Componente**

```astro
---
import { Icon } from 'astro-icon/components';
import { site } from '../data/site';
import { VEHICLE_LABELS, VEHICLE_TYPES } from '../lib/whatsapp';
---

<section id="agendar" class="mx-auto max-w-[1400px] px-4 py-16">
  <div class="grid gap-8 md:grid-cols-12">
    <div class="md:col-span-4">
      <h2 class="display text-3xl md:text-4xl">Agenda tu cita</h2>
      <p class="mt-4 text-muted">
        Llena la orden de trabajo y se abre WhatsApp con los datos listos. Te confirmamos el turno por ahí mismo.
      </p>
      <p class="mt-4 text-sm text-muted">Nada se guarda en esta web. Los datos viajan solo en tu mensaje de WhatsApp.</p>
    </div>

    <form
      class="bg-surface p-5 md:col-span-8 md:p-8"
      method="get"
      action={`https://wa.me/${site.whatsappNumber}`}
      data-orden
      novalidate
    >
      <p class="numeric border-b border-line pb-3 text-sm tracking-wide text-muted">Orden de trabajo</p>

      <fieldset class="mt-5">
        <legend class="font-semibold">Tipo de vehículo</legend>
        <div class="mt-3 flex flex-wrap gap-3">
          {VEHICLE_TYPES.map((type, index) => (
            <label class="flex cursor-pointer items-center gap-2 border border-field px-4 py-2 has-checked:border-accent has-checked:bg-accent has-checked:text-on-accent">
              <input class="sr-only" type="radio" name="vehicleType" value={type} checked={index === 0} />
              <Icon name={type === 'liviano' ? 'ph:car-profile' : type === 'semipesado' ? 'ph:van' : 'ph:truck'} class="size-5" aria-hidden="true" />
              {VEHICLE_LABELS[type]}
            </label>
          ))}
        </div>
      </fieldset>

      <div class="mt-6 grid gap-5 md:grid-cols-2">
        <p class="grid gap-2">
          <label class="font-semibold" for="service">Servicio</label>
          <select class="border border-field bg-canvas px-3 py-2" id="service" name="service" required>
            <option value="">Elige un servicio</option>
            {site.serviceGroups.map((group) => (
              <optgroup label={group.title}>
                {group.services.map((service) => <option value={service.name}>{service.name}</option>)}
              </optgroup>
            ))}
          </select>
          <span class="text-sm text-accent-strong" data-error="service" hidden></span>
        </p>

        <p class="grid gap-2">
          <label class="font-semibold" for="vehicle">Marca y modelo</label>
          <input class="border border-field bg-canvas px-3 py-2" id="vehicle" name="vehicle" placeholder="Hino 500, 2019" />
        </p>

        <p class="grid gap-2">
          <label class="font-semibold" for="plate">Placa</label>
          <input class="numeric border border-field bg-canvas px-3 py-2" id="plate" name="plate" maxlength="10" />
          <span class="text-sm text-accent-strong" data-error="plate" hidden></span>
        </p>

        <p class="grid gap-2">
          <label class="font-semibold" for="preferredDate">Día preferido</label>
          <input class="numeric border border-field bg-canvas px-3 py-2" id="preferredDate" name="preferredDate" type="date" />
          <span class="text-sm text-accent-strong" data-error="preferredDate" hidden></span>
        </p>

        <p class="grid gap-2 md:col-span-2">
          <label class="font-semibold" for="name">Tu nombre</label>
          <input class="border border-field bg-canvas px-3 py-2" id="name" name="name" maxlength="60" />
        </p>

        <p class="grid gap-2 md:col-span-2">
          <label class="font-semibold" for="notes">¿Qué le pasa al vehículo?</label>
          <textarea class="border border-field bg-canvas px-3 py-2" id="notes" name="notes" rows="3" maxlength="300"></textarea>
          <span class="text-sm text-accent-strong" data-error="notes" hidden></span>
        </p>
      </div>

      <button
        class="mt-7 inline-flex items-center gap-2 bg-accent px-5 py-3 font-semibold text-on-accent transition-transform duration-200 hover:-translate-y-px active:translate-y-px"
        type="submit"
      >
        <Icon name="ph:whatsapp-logo" class="size-5" aria-hidden="true" />
        Agendar por WhatsApp
      </button>
    </form>
  </div>
</section>

<script>
  import { serviceNames, site } from '../data/site';
  import { guayaquilIsoDate } from '../lib/hours';
  import { buildWhatsAppUrl, composeBookingMessage, validateBooking } from '../lib/whatsapp';
  import type { BookingField, BookingInput } from '../lib/whatsapp';

  const form = document.querySelector<HTMLFormElement>('[data-orden]');
  if (form) {
    const dateField = form.querySelector<HTMLInputElement>('#preferredDate');
    if (dateField) dateField.min = guayaquilIsoDate(new Date());

    const showErrors = (errors: Partial<Record<BookingField, string>>) => {
      for (const node of form.querySelectorAll<HTMLElement>('[data-error]')) {
        const field = node.dataset.error as BookingField;
        const message = errors[field];
        node.textContent = message ?? '';
        node.hidden = !message;
        const input = form.elements.namedItem(field);
        if (input instanceof HTMLElement) input.setAttribute('aria-invalid', message ? 'true' : 'false');
      }
      const first = Object.keys(errors)[0];
      if (first) (form.elements.namedItem(first) as HTMLElement | null)?.focus();
    };

    form.addEventListener('submit', (event) => {
      const data = new FormData(form);
      const input: BookingInput = {
        vehicleType: String(data.get('vehicleType') ?? ''),
        service: String(data.get('service') ?? ''),
        vehicle: String(data.get('vehicle') ?? ''),
        plate: String(data.get('plate') ?? ''),
        preferredDate: String(data.get('preferredDate') ?? ''),
        name: String(data.get('name') ?? ''),
        notes: String(data.get('notes') ?? ''),
      };
      const result = validateBooking(input, {
        today: guayaquilIsoDate(new Date()),
        schedule: site.schedule,
        services: serviceNames,
      });
      if (!result.ok) {
        event.preventDefault();
        showErrors(result.errors);
        return;
      }
      event.preventDefault();
      showErrors({});
      window.location.href = buildWhatsAppUrl(site.whatsappNumber, composeBookingMessage(result.booking, site.name));
    });
  }
</script>
```

- [ ] **Paso 2: Probar a mano en el navegador**

```bash
npm run dev
```

Comprueba: enviar vacío marca el error debajo de "Servicio" y mueve el foco ahí; elegir un domingo marca "Ese día el taller está cerrado"; con servicio y tipo de vehículo abre WhatsApp con el texto completo.

- [ ] **Paso 3: Verificar y commit**

```bash
npm run verify
git add -A && git commit -m "feat: orden de trabajo que abre WhatsApp con los datos"
```

### Tarea 13: Pruebas de extremo a extremo

**Archivos:**
- Crear: `playwright.config.ts`, `tests/e2e/agendar.spec.ts`

**Interfaces:**
- Consume: la página construida servida por `astro preview` en el puerto 4321.

- [ ] **Paso 1: Instalar el navegador**

```bash
npx playwright install chromium
```

- [ ] **Paso 2: Configuración**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: { baseURL: 'http://localhost:4321' },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'celular', use: { ...devices['Pixel 7'] } },
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

- [ ] **Paso 3: Spec**

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const stubWhatsApp = async (page: import('@playwright/test').Page) => {
  await page.route('https://wa.me/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<p>WhatsApp</p>' }),
  );
};

test('la orden de trabajo abre WhatsApp con el mensaje armado', async ({ page }) => {
  await stubWhatsApp(page);
  await page.goto('/');

  const form = page.locator('form[data-orden]');
  await page.getByRole('radio', { name: 'Pesado' }).check();
  await page.getByLabel('Servicio').selectOption('Alineación computarizada');
  await page.getByLabel('Placa').fill('gba-1234');
  await form.getByRole('button', { name: 'Agendar por WhatsApp' }).click();

  await page.waitForURL(/wa\.me/);
  const text = new URL(page.url()).searchParams.get('text') ?? '';
  expect(text).toContain('Servicio: Alineación computarizada');
  expect(text).toContain('Vehículo: Pesado');
  expect(text).toContain('Placa: GBA-1234');
});

test('muestra el error junto al campo cuando falta el servicio', async ({ page }) => {
  await stubWhatsApp(page);
  await page.goto('/');

  const form = page.locator('form[data-orden]');
  await form.getByRole('button', { name: 'Agendar por WhatsApp' }).click();

  await expect(form.locator('[data-error="service"]')).toHaveText('Elige un servicio.');
  await expect(page).toHaveURL(/\/$/);
});

test('en celular el CTA del hero se ve sin hacer scroll', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'celular', 'Solo aplica al viewport de celular');
  await page.goto('/');
  await expect(page.locator('main section').first().getByRole('link', { name: 'Agendar por WhatsApp' })).toBeInViewport();
});

test('sin violaciones de accesibilidad serias', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const serious = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
});
```

- [ ] **Paso 4: Correr**

```bash
npm run test:e2e
```

Esperado: 4 tests por proyecto en verde. Si un selector falla (por ejemplo el nombre accesible del radio), ajusta el selector; el comportamiento probado no se negocia. Si `axe` reporta algo serio, arréglalo en el componente antes de seguir.

- [ ] **Paso 5: Commit**

```bash
git add -A && git commit -m "test: flujo de agendado y accesibilidad con playwright"
```

### Tarea 14: Ubicación, horario y mapa

**Archivos:**
- Crear: `src/components/Visit.astro`
- Modificar: `src/pages/index.astro`

**Interfaces:**
- Consume: `groupSchedule`, `getOpenStatus`, `formatOpenStatus`, `site.geo`, `site.address`.
- Produce: la sección `#ubicacion`.

El estado abierto o cerrado se calcula primero en el build, con la hora de compilación, para que la pastilla nunca aparezca vacía; un script la corrige después con la hora real de quien visita la página, porque el HTML es estático y se cachea. El mapa de Google no carga hasta que alguien pulsa "Ver el mapa"; mientras tanto están los enlaces a Google Maps y a Waze, que es lo que la gente realmente usa para llegar.

- [ ] **Paso 1: Componente**

```astro
---
import { Icon } from 'astro-icon/components';
import { site } from '../data/site';
import { formatOpenStatus, getOpenStatus, groupSchedule } from '../lib/hours';

const rows = groupSchedule(site.schedule);
const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${site.geo.lat}%2C${site.geo.lng}`;
const wazeUrl = `https://waze.com/ul?ll=${site.geo.lat}%2C${site.geo.lng}&navigate=yes`;
const embedUrl = `https://www.google.com/maps?q=${site.geo.lat},${site.geo.lng}&z=17&output=embed`;
const initialStatus = formatOpenStatus(getOpenStatus(new Date(), site.schedule));
---

<section id="ubicacion" class="mx-auto max-w-[1400px] px-4 py-16">
  <h2 class="display text-3xl md:text-4xl">Dónde estamos</h2>
  <div class="mt-8 grid gap-8 md:grid-cols-12">
    <div class="md:col-span-5">
      <p class="text-lg">{site.address.street}</p>
      <p class="text-muted">{site.address.reference}, {site.address.city}</p>
      <p
        class="mt-6 inline-flex w-fit items-center gap-2 border border-accent bg-accent/10 px-3 py-1.5 numeric text-sm font-semibold text-accent-strong"
        id="estado-horario"
        data-hoy
      >
        <Icon name="ph:clock" class="size-4" aria-hidden="true" />
        <span data-label>{initialStatus}</span>
      </p>
      <dl class="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
        {rows.map((row) => (
          <>
            <dt class="text-muted">{row.label}</dt>
            <dd class="numeric">{row.hours}</dd>
          </>
        ))}
      </dl>
      <p class="mt-6 flex flex-wrap gap-4">
        <a class="text-accent-strong underline underline-offset-4" href={mapsUrl}>Abrir en Google Maps</a>
        <a class="text-accent-strong underline underline-offset-4" href={wazeUrl}>Abrir en Waze</a>
        <a class="text-accent-strong underline underline-offset-4" href={`tel:${site.phoneE164}`}>Llamar {site.phoneDisplay}</a>
      </p>
    </div>
    <div class="md:col-span-7">
      <div class="relative aspect-[16/10] bg-surface" data-mapa data-src={embedUrl}>
        <button
          type="button"
          class="absolute inset-0 flex items-center justify-center gap-2 border border-field text-ink"
          data-mapa-boton
        >
          <Icon name="ph:map-trifold" class="size-5" aria-hidden="true" />
          Ver el mapa
        </button>
      </div>
    </div>
  </div>
</section>

<script>
  import { formatOpenStatus, getOpenStatus } from '../lib/hours';
  import { site } from '../data/site';

  // El servidor ya renderiza el estado en build con la hora de compilación; esto lo
  // refresca con la hora real del navegador de quien visita la página.
  const label = document.querySelector<HTMLElement>('#estado-horario [data-label]');
  if (label) label.textContent = formatOpenStatus(getOpenStatus(new Date(), site.schedule));

  const mapa = document.querySelector<HTMLElement>('[data-mapa]');
  const boton = mapa?.querySelector<HTMLButtonElement>('[data-mapa-boton]');
  boton?.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.src = mapa!.dataset.src!;
    iframe.title = 'Mapa con la ubicación del taller';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.className = 'absolute inset-0 h-full w-full border-0';
    mapa!.appendChild(iframe);
    boton.remove();
  });
</script>
```

El estado de horario ya no es un texto suelto: es una pastilla tintada de acento con un icono de reloj, como se vio en el canvas de diseño. El texto se renderiza en el build (con la hora de compilación) y el script solo lo corrige con la hora real de quien visita la página, así que nunca se ve vacío antes de que cargue JavaScript.

- [ ] **Paso 2: Verificar y commit**

```bash
npm run verify
git add -A && git commit -m "feat: ubicación con horario en vivo y mapa diferido"
```

### Tarea 15: Pie, barra móvil, 404 y archivos de servidor

**Archivos:**
- Crear: `src/components/Footer.astro`, `src/components/MobileBar.astro`, `src/pages/404.astro`, `public/_redirects`, `public/_headers`, `public/robots.txt`
- Modificar: `src/pages/index.astro` (queda completo)

**Interfaces:**
- Produce: el HTML final de la landing y los archivos que leen Cloudflare y Netlify.

El pie cierra en el mismo azul de marca que el header y "El taller", así la última pantalla del scroll refuerza la misma marca con la que empezó.

- [ ] **Paso 1: Pie**

```astro
---
import { Icon } from 'astro-icon/components';
import { site } from '../data/site';

const year = new Date().getFullYear();
---

<footer class="bg-brand py-10 pb-24 text-on-brand md:pb-10">
  <div class="mx-auto grid max-w-[1400px] gap-6 px-4 md:grid-cols-3">
    <div>
      <p class="display text-xl">{site.name}</p>
      <p class="text-on-brand/70">Antes {site.legacyName}</p>
    </div>
    <div class="text-on-brand/80">
      <p>{site.address.street}</p>
      <p>{site.address.reference}, {site.address.city}</p>
    </div>
    <div class="grid gap-2">
      <a class="numeric flex items-center gap-2 text-accent" href={`tel:${site.phoneE164}`}>
        <Icon name="ph:phone" class="size-5" aria-hidden="true" />
        {site.phoneDisplay}
      </a>
      <a class="flex items-center gap-2 text-accent" href={site.instagram.url}>
        <Icon name="ph:instagram-logo" class="size-5" aria-hidden="true" />
        {site.instagram.handle}
      </a>
    </div>
  </div>
  <p class="numeric mx-auto mt-8 max-w-[1400px] px-4 text-sm text-on-brand/60">{year} {site.name}, Guayaquil, Ecuador</p>
</footer>
```

- [ ] **Paso 2: Barra fija de celular**

Dos intenciones distintas, llamar y agendar, con el mismo nombre que ya usa el resto de la página.

```astro
---
import { Icon } from 'astro-icon/components';
import { site } from '../data/site';
---

<div class="fixed inset-x-0 bottom-0 z-20 grid grid-cols-2 border-t border-line bg-canvas md:hidden">
  <a class="flex items-center justify-center gap-2 py-4 font-semibold" href={`tel:${site.phoneE164}`}>
    <Icon name="ph:phone" class="size-5" aria-hidden="true" />
    Llamar
  </a>
  <a class="flex items-center justify-center gap-2 bg-accent py-4 font-semibold text-on-accent" href="#agendar">
    <Icon name="ph:whatsapp-logo" class="size-5" aria-hidden="true" />
    Agendar por WhatsApp
  </a>
</div>
```

El pie lleva `pb-24 md:pb-10` para que la barra no tape el último renglón.

- [ ] **Paso 3: Página 404**

```astro
---
import Base from '../layouts/Base.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import { site } from '../data/site';
---

<Base title={`Página no encontrada, ${site.name}`} description="La página que buscas no existe. Vuelve al inicio para ver servicios, horario y ubicación del taller.">
  <Header />
  <main id="contenido" class="mx-auto max-w-[1400px] px-4 py-24">
    <h1 class="display text-4xl">Esta página no existe</h1>
    <p class="mt-4 max-w-[50ch] text-muted">Puede que el enlace sea viejo. Desde el inicio encuentras servicios, horario y cómo llegar al taller.</p>
    <a class="mt-8 inline-flex bg-accent px-5 py-3 font-semibold text-on-accent" href="/">Ir al inicio</a>
  </main>
  <Footer />
</Base>
```

- [ ] **Paso 4: Página completa**

```astro
---
import Base from '../layouts/Base.astro';
import Header from '../components/Header.astro';
import Hero from '../components/Hero.astro';
import Services from '../components/Services.astro';
import Workshop from '../components/Workshop.astro';
import Reviews from '../components/Reviews.astro';
import Guide from '../components/Guide.astro';
import Booking from '../components/Booking.astro';
import Visit from '../components/Visit.astro';
import Footer from '../components/Footer.astro';
import MobileBar from '../components/MobileBar.astro';
import { site } from '../data/site';
---

<Base title={`${site.name}, taller automotriz en Samanes 5, Guayaquil`}>
  <Header />
  <main id="contenido">
    <Hero />
    <Services />
    <Workshop />
    <Reviews />
    <Guide />
    <Booking />
    <Visit />
  </main>
  <Footer />
  <MobileBar />
</Base>
```

- [ ] **Paso 5: Redirecciones de las rutas viejas**

`public/_redirects`:

```
/inicio / 301
/nuestros-servicios/catalogo /#servicios 301
/nuestros-servicios/cat%C3%A1logo /#servicios 301
/nuestros-servicios/blog /#guia 301
/acerca-de / 301
/acerca-de/ / 301
```

`public/_headers`:

```
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
```

`public/robots.txt`:

```
User-agent: *
Allow: /

Sitemap: https://rodmotors.ec/sitemap-index.xml
```

- [ ] **Paso 6: Verificar todo junto**

```bash
npm run verify && npm run test:e2e
```

Esperado: `astro check` sin errores, build de 2 páginas, 67 tests de vitest y los e2e en verde.

- [ ] **Paso 7: Commit**

```bash
git add -A && git commit -m "feat: pie, barra móvil, 404 y redirecciones de las rutas viejas"
```

### Tarea 16: Revisión previa al lanzamiento

**Archivos:**
- Modificar: `CLAUDE.md` (agregar las reglas del proyecto al final de lo que generó Astro)
- Modificar: los componentes que hagan falta según los hallazgos

Esta tarea es de revisión, no de código nuevo. Se corre con `taste-skill:design-taste-frontend` cargada.

- [ ] **Paso 1: Lista de verificación de taste-skill sobre la página construida**

Recorre y marca una por una. Cualquier casilla que no se pueda marcar con honestidad es trabajo pendiente, no un detalle:

- [ ] Cero em dash y en dash en el texto visible (ya está automatizado en `tests/build`).
- [ ] Un solo tema por página: ninguna sección se invierte a claro dentro del modo oscuro.
- [ ] El azul de marca (`bg-brand`) es el color que domina: header, "El taller" y pie, no solo el hero.
- [ ] Un solo acento en toda la página (el ámbar), reservado para el CTA, el foco y los errores; nunca decorativo.
- [ ] Un solo sistema de esquinas: aquí todo es recto, sin `rounded-*` sueltos.
- [ ] Contraste del texto de cada botón contra su fondo (cubierto por `tests/unit/tokens.test.ts`).
- [ ] Ninguna etiqueta de CTA se parte en dos líneas en escritorio.
- [ ] El hero entra en pantalla: titular de 2 líneas como máximo, subtítulo de 20 palabras, CTA visible sin scroll (cubierto por el e2e de celular).
- [ ] El panel del hero es un `bg-brand` sólido, no una capa semitransparente ni un degradado sobre la foto.
- [ ] Cero etiquetas en mayúsculas encima de los títulos.
- [ ] Ninguna familia de layout se repite: hero a ancho completo, bento, galería, cita, lista de definición, formulario, mapa.
- [ ] Ninguna sección es solo texto sobre fondo plano sin imagen ni contraste.
- [ ] Las animaciones se justifican en una frase: entrada del hero y respuesta táctil de los botones. Nada más.
- [ ] `prefers-reduced-motion` respetado.
- [ ] Modo claro y modo oscuro revisados en el navegador, los dos.
- [ ] Ningún número inventado en pantalla.
- [ ] Ninguna foto de stock: o es del taller, o es el gris provisional.

- [ ] **Paso 2: Lighthouse**

```bash
npm run build && npm run preview &
npx lighthouse http://localhost:4321 --preset=desktop --view
npx lighthouse http://localhost:4321 --view
```

Objetivo: rendimiento 95 o más, accesibilidad 100, SEO 100. Si el LCP se pasa, revisa que la foto del hero tenga `loading="eager"` y `fetchpriority="high"` y que no haya entrado ninguna imagen sin optimizar.

- [ ] **Paso 3: Reglas del repo para el futuro**

Agrega al final de `CLAUDE.md` el contenido que viene en `CLAUDE.md` de este paquete de planificación (stack, reglas de copy y diseño, comandos, qué no tocar).

- [ ] **Paso 4: Commit**

```bash
git add -A && git commit -m "chore: revisión previa al lanzamiento y reglas del repo"
```

### Tarea 17: Despliegue y dominios

**Archivos:**
- Crear: `wrangler.jsonc`

**Interfaces:**
- Consume: `dist/` generado por `npm run build`.

Requiere accesos que tiene el dueño del negocio: cuenta de Cloudflare y control de los dominios. Si el cliente no quiere mover los nameservers de rodmotors.ec, usa Netlify: lee los mismos `_redirects` y `_headers` y basta con apuntar un registro A al balanceador.

- [ ] **Paso 1: Configuración de Cloudflare Workers con static assets**

```jsonc
{
  "name": "rodmotors",
  "compatibility_date": "2026-09-01",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "404-page"
  }
}
```

Un sitio totalmente estático no necesita adaptador de Astro: se sube `dist` como assets y `not_found_handling` hace que `404.html` responda en las rutas que no existen.

- [ ] **Paso 2: Primer despliegue**

```bash
npm run build
npx wrangler deploy
```

- [ ] **Paso 3: Dominio principal**

En el panel de Cloudflare, agrega `rodmotors.ec` como dominio del Worker (apex y `www`). Antes de cambiar nada, exporta el contenido del WordPress actual por si acaso.

- [ ] **Paso 4: Redirección del dominio viejo**

`tecnicentro80.com` no se apaga: se redirige. Con la zona en Cloudflare, crea una regla de redirección única, 301, de `tecnicentro80.com/*` a `https://rodmotors.ec/$1`. Así las rutas viejas caen en `public/_redirects` del sitio nuevo y terminan en la sección correcta.

- [ ] **Paso 5: Verificación en producción**

```bash
curl -I https://rodmotors.ec/
curl -I https://tecnicentro80.com/inicio
curl -I https://rodmotors.ec/nuestros-servicios/blog
curl https://rodmotors.ec/sitemap-index.xml
```

Esperado: 200 en la portada, 301 en las dos rutas viejas, sitemap servido. Prueba también el rich results test de Google con la URL para confirmar que el JSON-LD `AutoRepair` se lee.

- [ ] **Paso 6: Tareas del negocio, fuera del repo**

- Actualizar el sitio web en Google Business Profile y evaluar renombrar la ficha de "Tecnicentro 80" a "Rod Motors".
- Cambiar el enlace del perfil de Instagram.
- Dar de baja el Google Sites y el plan de WordPress.com solo después de confirmar que las redirecciones responden.

- [ ] **Paso 7: Commit**

```bash
git add -A && git commit -m "chore: configuración de despliegue en cloudflare"
```

---

## Revisión del plan

Hecha contra el spec, sección por sección:

- Cobertura: decisión de sitio único (tareas 15 y 17), framework (1), sistema de diseño (2, 8), contenido (3, 9, 10, 11), orden de trabajo (5, 12), horario (4, 14), SEO y migración (6, 8, 15, 17), accesibilidad y rendimiento (13, 16), pruebas (2 a 15), despliegue (17). Sin huecos.
- Marcadores de posición: no quedan "por definir" en los pasos. Lo único deliberadamente pendiente son las fotos reales y las reseñas, que dependen del cliente, y los dos tienen puerta automática (`LAUNCH=1` y sección condicional).
- Consistencia de tipos: los nombres que cruzan tareas (`site`, `serviceNames`, `WeeklySchedule`, `BookingInput`, `validateBooking`, `buildWhatsAppUrl`, `getOpenStatus`, `groupSchedule`, `buildAutoRepairJsonLd`) se definen en las tareas 3 a 6 y se consumen con la misma firma en 8 a 15.

## Cómo ejecutar

Plan guardado en `docs/superpowers/plans/2026-09-17-rodmotors-landing.md`. Dos opciones:

1. **Subagentes (recomendado):** `superpowers:subagent-driven-development`, un subagente por tarea y revisión entre tareas.
2. **En línea:** `superpowers:executing-plans`, ejecución por lotes con puntos de control.

Antes de la tarea 2 hace falta el logo del cliente, y antes de la tarea 17 los accesos de dominio. Todo lo demás se puede ejecutar de corrido.
