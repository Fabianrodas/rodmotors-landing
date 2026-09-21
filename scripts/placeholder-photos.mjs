/**
 * Genera las dos imágenes provisionales que quedan en la landing, como ilustración de
 * marca (plano técnico de taller en el azul y ámbar de Rod Motors), no como rectángulos
 * grises vacíos ni como fotos de stock de un taller ajeno.
 *
 * Eran seis. El 2026-09-20 salieron cuatro (diagnostico, alineadora, pesados, equipo):
 * ocupaban cerca del 60% del alto de la página y, siendo azul sobre azul, desaparecían
 * dentro de las secciones `brand` y se leían como huecos dentro de las secciones claras.
 * Ese espacio pasó a tener contenido real. Quedan solo las dos que sí funcionan:
 *
 *   hero.jpg     el fondo del hero, que se lee bien sobre todo en celular
 *   fachada.jpg  fuente de public/og.jpg, la imagen social; no se muestra en la página
 *
 * Por qué ilustración y no una foto de stock: no hay generación de imágenes
 * fotorrealistas en este entorno, y usar la foto de otro taller para representar a Rod
 * Motors sería engañoso y un riesgo de derechos de autor. Los pósters de video de
 * src/assets/video/ sí son fotos reales del taller, sacadas de los videos del propio
 * cliente (ver CLAUDE.md, sección Fotos).
 *
 * Reemplazo cuando lleguen las fotos reales: mismo nombre de archivo, mismas
 * proporciones. Se sobrescribe el .jpg y ningún componente cambia.
 *
 * Uso: node scripts/placeholder-photos.mjs
 */
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const OUT = new URL('../src/assets/photos/', import.meta.url);

// Paleta fija de la ilustración: no depende del tema del sitio (son JPG estáticos).
// bg = brand-soft; line = on-brand tenue, para el trazo; accent = el único ámbar de marca.
const BG = '#25394f';
const LINE = 'rgba(238,242,247,0.55)';
const LINE_SOFT = 'rgba(238,242,247,0.22)';
const ACCENT = '#e0a82e';

/** Cuadrícula de fondo tipo plano técnico: líneas finas, muy tenues, nunca decoración sola. */
function gridPattern(id, size = 64) {
  return `
    <pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse">
      <path d="M ${size} 0 L 0 0 0 ${size}" fill="none" stroke="${LINE_SOFT}" stroke-width="1" />
    </pattern>`;
}

function frame(width, height, body, { patternId = 'grid' } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>${gridPattern(patternId)}</defs>
    <rect width="${width}" height="${height}" fill="${BG}" />
    <rect width="${width}" height="${height}" fill="url(#${patternId})" />
    ${body}
  </svg>`;
}

/** Marca de cota tipo dibujo técnico: línea con flechas en los extremos. */
function dimensionLine(x1, y1, x2, y2, stroke = LINE) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const tick = 7;
  const perp = angle + Math.PI / 2;
  const tx1 = Math.cos(perp) * tick;
  const ty1 = Math.sin(perp) * tick;
  return `
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="1.5" />
    <line x1="${x1 - tx1}" y1="${y1 - ty1}" x2="${x1 + tx1}" y2="${y1 + ty1}" stroke="${stroke}" stroke-width="1.5" />
    <line x1="${x2 - tx1}" y1="${y2 - ty1}" x2="${x2 + tx1}" y2="${y2 + ty1}" stroke="${stroke}" stroke-width="1.5" />`;
}

const illustrations = {
  // HERO: sedán en un elevador de dos columnas. Es el elemento más grande de la
  // página (LCP), así que lleva el trazo más limpio y el gesto más claro.
  'hero.jpg': (w, h) => {
    const groundY = h * 0.82;
    const liftTop = h * 0.34;
    const carY = h * 0.4;
    return frame(
      w,
      h,
      `
      <line x1="0" y1="${groundY}" x2="${w}" y2="${groundY}" stroke="${LINE}" stroke-width="2" />
      <!-- columnas del elevador -->
      <rect x="${w * 0.16}" y="${liftTop}" width="18" height="${groundY - liftTop}" fill="${LINE_SOFT}" />
      <rect x="${w * 0.78}" y="${liftTop}" width="18" height="${groundY - liftTop}" fill="${LINE_SOFT}" />
      <!-- brazo elevador, en ámbar: el único acento de la imagen -->
      <rect x="${w * 0.16}" y="${carY + 60}" width="${w * 0.62}" height="16" fill="${ACCENT}" />
      <!-- carrocería, vista de perfil -->
      <path d="M ${w * 0.22} ${carY + 60}
               L ${w * 0.22} ${carY + 10}
               Q ${w * 0.24} ${carY - 30} ${w * 0.34} ${carY - 34}
               L ${w * 0.42} ${carY - 34}
               Q ${w * 0.47} ${carY - 78} ${w * 0.58} ${carY - 78}
               L ${w * 0.68} ${carY - 78}
               Q ${w * 0.76} ${carY - 78} ${w * 0.78} ${carY - 50}
               L ${w * 0.82} ${carY - 34}
               Q ${w * 0.9} ${carY - 30} ${w * 0.9} ${carY + 10}
               L ${w * 0.9} ${carY + 60} Z"
            fill="none" stroke="${LINE}" stroke-width="3" stroke-linejoin="round" />
      <!-- vidrios -->
      <path d="M ${w * 0.44} ${carY - 34} Q ${w * 0.48} ${carY - 66} ${w * 0.58} ${carY - 66}
               L ${w * 0.66} ${carY - 66} Q ${w * 0.72} ${carY - 66} ${w * 0.75} ${carY - 46}
               L ${w * 0.75} ${carY - 34} Z" fill="${LINE_SOFT}" />
      <line x1="${w * 0.58}" y1="${carY - 66}" x2="${w * 0.58}" y2="${carY - 34}" stroke="${BG}" stroke-width="2" />
      <!-- ruedas, elevadas del piso -->
      <circle cx="${w * 0.3}" cy="${carY + 60}" r="30" fill="${BG}" stroke="${LINE}" stroke-width="3" />
      <circle cx="${w * 0.3}" cy="${carY + 60}" r="11" fill="none" stroke="${LINE}" stroke-width="2" />
      <circle cx="${w * 0.76}" cy="${carY + 60}" r="30" fill="${BG}" stroke="${LINE}" stroke-width="3" />
      <circle cx="${w * 0.76}" cy="${carY + 60}" r="11" fill="none" stroke="${LINE}" stroke-width="2" />
      ${dimensionLine(w * 0.16, groundY + 26, w * 0.94, groundY + 26)}
      `,
    );
  },

  // FACHADA: usada solo como fuente de la imagen social (og.jpg), elevación simple del local.
  'fachada.jpg': (w, h) => {
    const groundY = h * 0.86;
    const roofY = h * 0.22;
    return frame(
      w,
      h,
      `
      <line x1="0" y1="${groundY}" x2="${w}" y2="${groundY}" stroke="${LINE}" stroke-width="2" />
      <rect x="${w * 0.08}" y="${roofY}" width="${w * 0.84}" height="${groundY - roofY}" fill="${BG}" stroke="${LINE}" stroke-width="3" />
      <rect x="${w * 0.08}" y="${roofY - 26}" width="${w * 0.84}" height="26" fill="${ACCENT}" />
      <!-- bahía abierta, puerta enrollable -->
      <rect x="${w * 0.14}" y="${roofY + 30}" width="${w * 0.32}" height="${groundY - roofY - 30}" fill="none" stroke="${LINE}" stroke-width="3" />
      ${Array.from({ length: 7 })
        .map((_, i) => `<line x1="${w * 0.14}" y1="${roofY + 30 + (i * (groundY - roofY - 30)) / 7}" x2="${w * 0.14 + w * 0.32}" y2="${roofY + 30 + (i * (groundY - roofY - 30)) / 7}" stroke="${LINE_SOFT}" stroke-width="1.5" />`)
        .join('')}
      <!-- vidriera -->
      <rect x="${w * 0.54}" y="${roofY + 30}" width="${w * 0.32}" height="${groundY - roofY - 30}" fill="${LINE_SOFT}" stroke="${LINE}" stroke-width="2" />
      <line x1="${w * 0.7}" y1="${roofY + 30}" x2="${w * 0.7}" y2="${groundY}" stroke="${BG}" stroke-width="2" />
      `,
    );
  },
};

const dimensions = {
  'hero.jpg': [1600, 1200],
  'fachada.jpg': [1600, 1000],
};

await mkdir(OUT, { recursive: true });
for (const [file, build] of Object.entries(illustrations)) {
  const [width, height] = dimensions[file];
  const svg = build(width, height);
  await sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toFile(fileURLToPath(new URL(file, OUT)));
  console.log('ilustración:', file, `${width}x${height}`);
}
