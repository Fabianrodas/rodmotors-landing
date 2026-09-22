/**
 * Genera public/og.jpg, la imagen que se ve al compartir el enlace.
 *
 * Si existe una foto real en src/assets/photos/fachada.jpg (ver src/data/photos.ts),
 * la usa recortada a 1200x630. Si no, arma una tarjeta de marca con el logo sobre el
 * azul de marca: no depende de tener ya una foto para verse terminada.
 *
 * Uso: node scripts/og-image.mjs
 */
import { existsSync } from 'node:fs';
import sharp from 'sharp';

const W = 1200;
const H = 630;
const OUT = 'public/og.jpg';
const FACHADA = 'src/assets/photos/fachada.jpg';
const MARCA = '#244587';
const FONDO = '#0a1633';
const AMARILLO = '#f8cb24';

if (existsSync(FACHADA)) {
  await sharp(FACHADA).resize(W, H, { fit: 'cover', position: 'centre' }).jpeg({ quality: 82 }).toFile(OUT);
  console.log(`og listo desde la foto real: ${OUT} (${W}x${H})`);
} else {
  const logo = await sharp('src/assets/brand/logo.png').resize({ height: 340 }).toBuffer();
  const card = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="${FONDO}" />
    <rect x="0" y="0" width="${Math.round(W * 0.46)}" height="${H}" fill="${MARCA}" />
    <rect x="${Math.round(W * 0.46)}" y="0" width="8" height="${H}" fill="${AMARILLO}" />
    <text x="60" y="${H - 60}" font-family="Arial, sans-serif" font-weight="700" font-size="30" fill="#eef2f7">Taller automotriz en Samanes 5, Guayaquil</text>
  </svg>`;
  await sharp({ create: { width: W, height: H, channels: 4, background: FONDO } })
    .composite([
      { input: Buffer.from(card), left: 0, top: 0 },
      { input: logo, left: Math.round(W * 0.63), top: Math.round((H - 340) / 2) },
    ])
    .jpeg({ quality: 88 })
    .toFile(OUT);
  console.log(`og listo, tarjeta de marca (sin foto real todavía): ${OUT} (${W}x${H})`);
}
