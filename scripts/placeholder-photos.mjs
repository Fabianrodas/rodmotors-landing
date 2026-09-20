/**
 * Genera las seis imágenes provisionales de la landing como ilustraciones de marca
 * (un plano técnico de taller, en el azul y ámbar de Rod Motors), no como rectángulos
 * grises vacíos ni como fotos de stock de un taller ajeno.
 *
 * Por qué así y no una foto de stock: no hay una herramienta de generación de imágenes
 * fotorrealistas disponible en este entorno, y usar una foto real de otro taller para
 * representar a Rod Motors sería engañoso (y un riesgo de derechos de autor) mientras
 * no sean las fotos reales del negocio. Este "plano de taller" es una decisión de
 * diseño con intención propia (ver docs/superpowers/specs, sección 7.1): conecta
 * visualmente con el posicionamiento real del negocio (diagnóstico computarizado,
 * alineación computarizada) y es honesto sobre ser una ilustración, no una fotografía.
 *
 * Reemplazo cuando lleguen las fotos reales: cada imagen sale con el mismo nombre de
 * archivo y las mismas proporciones que hoy. Basta con sobrescribir el .jpg; ningún
 * componente cambia.
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

  // DIAGNÓSTICO: escáner OBD conectado, con una lectura tipo osciloscopio en pantalla.
  // Formato vertical: la composición sube y baja para llenar el alto sin dejar aire
  // muerto ni depender de una mano ambigua.
  'diagnostico.jpg': (w, h) => {
    const scannerY = h * 0.52;
    return frame(
      w,
      h,
      `
      <!-- tablero, insinuado arriba -->
      <path d="M 0 ${h * 0.22} Q ${w * 0.5} ${h * 0.04} ${w} ${h * 0.22} L ${w} 0 L 0 0 Z" fill="${LINE_SOFT}" />
      <!-- puerto OBD -->
      <rect x="${w * 0.4}" y="${h * 0.24}" width="${w * 0.2}" height="${h * 0.05}" fill="none" stroke="${LINE}" stroke-width="2" />
      <!-- cable en espiral hasta el escáner -->
      <path d="M ${w * 0.5} ${h * 0.29}
               C ${w * 0.66} ${h * 0.33}, ${w * 0.34} ${h * 0.37}, ${w * 0.5} ${h * 0.41}
               C ${w * 0.66} ${h * 0.45}, ${w * 0.34} ${h * 0.48}, ${w * 0.5} ${h * 0.52}"
            fill="none" stroke="${LINE}" stroke-width="3" />
      <!-- cuerpo del escáner, más grande: es el sujeto de la imagen -->
      <rect x="${w * 0.2}" y="${scannerY}" width="${w * 0.6}" height="${h * 0.36}" rx="0" fill="${BG}" stroke="${LINE}" stroke-width="3.5" />
      <!-- pantalla con la lectura, en ámbar -->
      <rect x="${w * 0.28}" y="${scannerY + h * 0.045}" width="${w * 0.44}" height="${h * 0.15}" fill="rgba(224,168,46,0.14)" stroke="${ACCENT}" stroke-width="2.5" />
      <polyline points="${w * 0.31},${scannerY + h * 0.14} ${w * 0.38},${scannerY + h * 0.075} ${w * 0.45},${scannerY + h * 0.15} ${w * 0.5},${scannerY + h * 0.09} ${w * 0.56},${scannerY + h * 0.145} ${w * 0.62},${scannerY + h * 0.1} ${w * 0.67},${scannerY + h * 0.125}"
                fill="none" stroke="${ACCENT}" stroke-width="2.5" />
      <!-- botones -->
      <circle cx="${w * 0.3}" cy="${scannerY + h * 0.27}" r="8" fill="none" stroke="${LINE}" stroke-width="2" />
      <circle cx="${w * 0.44}" cy="${scannerY + h * 0.27}" r="8" fill="none" stroke="${LINE}" stroke-width="2" />
      <circle cx="${w * 0.58}" cy="${scannerY + h * 0.27}" r="8" fill="none" stroke="${LINE}" stroke-width="2" />
      <circle cx="${w * 0.71}" cy="${scannerY + h * 0.27}" r="8" fill="none" stroke="${LINE}" stroke-width="2" />
      ${dimensionLine(w * 0.15, scannerY, w * 0.15, scannerY + h * 0.36)}
      `,
    );
  },

  // ALINEACIÓN: rueda con las líneas de geometría (cámber y avance) como en un plano.
  'alineadora.jpg': (w, h) => {
    const cx = w * 0.42;
    const cy = h * 0.52;
    const r = Math.min(w, h) * 0.26;
    return frame(
      w,
      h,
      `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="${BG}" stroke="${LINE}" stroke-width="3" />
      <circle cx="${cx}" cy="${cy}" r="${r * 0.36}" fill="none" stroke="${LINE}" stroke-width="2" />
      ${Array.from({ length: 5 })
        .map((_, i) => {
          const a = (i / 5) * Math.PI * 2;
          return `<line x1="${cx + Math.cos(a) * r * 0.36}" y1="${cy + Math.sin(a) * r * 0.36}" x2="${cx + Math.cos(a) * r * 0.88}" y2="${cy + Math.sin(a) * r * 0.88}" stroke="${LINE}" stroke-width="2" />`;
        })
        .join('')}
      <!-- líneas de cámber / avance, con cota -->
      <line x1="${cx}" y1="${cy - r * 1.5}" x2="${cx}" y2="${cy + r * 1.5}" stroke="${LINE_SOFT}" stroke-width="1.5" stroke-dasharray="6 6" />
      <line x1="${cx}" y1="${cy - r * 1.5}" x2="${cx + r * 0.5}" y2="${cy - r * 1.9}" stroke="${ACCENT}" stroke-width="2" />
      <line x1="${cx}" y1="${cy + r * 1.5}" x2="${cx - r * 0.35}" y2="${cy + r * 1.85}" stroke="${LINE}" stroke-width="2" />
      <circle cx="${cx}" cy="${cy}" r="5" fill="${ACCENT}" />
      ${dimensionLine(cx + r * 1.3, cy - r * 0.9, cx + r * 1.3, cy + r * 0.9)}
      `,
    );
  },

  // PESADOS: primer plano del camión, sangrando fuera del cuadro por arriba y por la
  // derecha, para que se sienta grande dentro de la bahía en vez de flotar en el vacío.
  'pesados.jpg': (w, h) => {
    const groundY = h * 0.88;
    const cabW = w * 0.24;
    const cabH = h * 0.62;
    const cabX = w * 0.06;
    const trailerH = h * 0.82;
    const trailerX = cabX + cabW;
    const trailerW = w * 1.02 - trailerX;
    const wheelR = h * 0.09;
    return frame(
      w,
      h,
      `
      <line x1="0" y1="${groundY}" x2="${w}" y2="${groundY}" stroke="${LINE}" stroke-width="2" />
      <!-- cabina -->
      <rect x="${cabX}" y="${groundY - cabH}" width="${cabW}" height="${cabH}" fill="${BG}" stroke="${LINE}" stroke-width="3.5" />
      <rect x="${cabX + cabW * 0.16}" y="${groundY - cabH * 0.82}" width="${cabW * 0.68}" height="${cabH * 0.32}" fill="${LINE_SOFT}" />
      <rect x="${cabX - 6}" y="${groundY - cabH}" width="6" height="${cabH}" fill="${ACCENT}" />
      <!-- caja / trailer, sangra por la derecha del cuadro -->
      <rect x="${trailerX}" y="${groundY - trailerH}" width="${trailerW}" height="${trailerH}" fill="${BG}" stroke="${LINE}" stroke-width="3.5" />
      <line x1="${trailerX}" y1="${groundY - trailerH * 0.28}" x2="${trailerX + trailerW}" y2="${groundY - trailerH * 0.28}" stroke="${LINE_SOFT}" stroke-width="2" />
      <line x1="${trailerX + trailerW * 0.34}" y1="${groundY - trailerH}" x2="${trailerX + trailerW * 0.34}" y2="${groundY}" stroke="${LINE_SOFT}" stroke-width="1.5" />
      <!-- ruedas -->
      <circle cx="${cabX + cabW * 0.52}" cy="${groundY}" r="${wheelR}" fill="${BG}" stroke="${LINE}" stroke-width="3.5" />
      <circle cx="${cabX + cabW * 0.52}" cy="${groundY}" r="${wheelR * 0.36}" fill="none" stroke="${LINE}" stroke-width="2" />
      <circle cx="${trailerX + trailerW * 0.22}" cy="${groundY}" r="${wheelR}" fill="${BG}" stroke="${LINE}" stroke-width="3.5" />
      <circle cx="${trailerX + trailerW * 0.22}" cy="${groundY}" r="${wheelR * 0.36}" fill="none" stroke="${LINE}" stroke-width="2" />
      <circle cx="${trailerX + trailerW * 0.42}" cy="${groundY}" r="${wheelR}" fill="${BG}" stroke="${LINE}" stroke-width="3.5" />
      <circle cx="${trailerX + trailerW * 0.42}" cy="${groundY}" r="${wheelR * 0.36}" fill="none" stroke="${LINE}" stroke-width="2" />
      ${dimensionLine(cabX, groundY + 34, trailerX + trailerW, groundY + 34)}
      `,
    );
  },

  // EQUIPO: llave ajustando un perno sobre el bloque de motor, formato cuadrado.
  // Escala grande a propósito: llena el cuadro igual que las demás ilustraciones.
  'equipo.jpg': (w, h) => {
    const cx = w * 0.48;
    const cy = h * 0.58;
    const s = Math.min(w, h) / 1200; // factor de escala sobre las medidas de referencia
    return frame(
      w,
      h,
      `
      <!-- bloque de motor, formas simples apiladas -->
      <rect x="${cx - 340 * s}" y="${cy - 120 * s}" width="${680 * s}" height="${440 * s}" fill="${BG}" stroke="${LINE}" stroke-width="${5 * s}" />
      <rect x="${cx - 260 * s}" y="${cy - 260 * s}" width="${240 * s}" height="${160 * s}" fill="${BG}" stroke="${LINE}" stroke-width="${5 * s}" />
      ${[0, 1, 2]
        .map((i) => `<circle cx="${cx - 180 * s + i * 80 * s}" cy="${cy - 260 * s}" r="${18 * s}" fill="none" stroke="${LINE}" stroke-width="${3 * s}" />`)
        .join('')}
      <line x1="${cx - 340 * s}" y1="${cy - 20 * s}" x2="${cx + 340 * s}" y2="${cy - 20 * s}" stroke="${LINE_SOFT}" stroke-width="${2.5 * s}" />
      <line x1="${cx - 340 * s}" y1="${cy + 120 * s}" x2="${cx + 340 * s}" y2="${cy + 120 * s}" stroke="${LINE_SOFT}" stroke-width="${2.5 * s}" />
      <!-- perno destacado en ámbar -->
      <circle cx="${cx + 80 * s}" cy="${cy + 20 * s}" r="${28 * s}" fill="${ACCENT}" />
      <circle cx="${cx + 80 * s}" cy="${cy + 20 * s}" r="${9 * s}" fill="${BG}" />
      <!-- llave girando el perno -->
      <g transform="rotate(-28 ${cx + 80 * s} ${cy + 20 * s})">
        <rect x="${cx + 80 * s - 20 * s}" y="${cy + 20 * s - 400 * s}" width="${40 * s}" height="${420 * s}" fill="none" stroke="${LINE}" stroke-width="${6 * s}" stroke-linejoin="round" />
        <rect x="${cx + 80 * s - 38 * s}" y="${cy + 20 * s - 56 * s}" width="${76 * s}" height="${72 * s}" fill="none" stroke="${LINE}" stroke-width="${6 * s}" />
      </g>
      ${dimensionLine(cx - 340 * s, cy + 160 * s, cx + 340 * s, cy + 160 * s)}
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
  'diagnostico.jpg': [1200, 1500],
  'alineadora.jpg': [1200, 900],
  'pesados.jpg': [1600, 900],
  'equipo.jpg': [1200, 1200],
  'fachada.jpg': [1600, 1000],
};

await mkdir(OUT, { recursive: true });
for (const [file, build] of Object.entries(illustrations)) {
  const [width, height] = dimensions[file];
  const svg = build(width, height);
  await sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toFile(fileURLToPath(new URL(file, OUT)));
  console.log('ilustración:', file, `${width}x${height}`);
}
