/**
 * Genera los iconos del sitio a partir del logo real (src/assets/brand/logo.png).
 * Uso: node scripts/favicon.mjs
 */
import sharp from 'sharp';

const SRC = 'src/assets/brand/logo.png';
const FONDO = '#0a1633';

async function square(size, padPct, output) {
  const inner = Math.round(size * (1 - padPct * 2));
  const logo = await sharp(SRC).resize({ width: inner, height: inner, fit: 'inside' }).toBuffer();
  const meta = await sharp(logo).metadata();
  await sharp({ create: { width: size, height: size, channels: 4, background: FONDO } })
    .composite([{ input: logo, left: Math.round((size - meta.width) / 2), top: Math.round((size - meta.height) / 2) }])
    .png()
    .toFile(output);
}

await square(64, 0.08, 'public/favicon.png');
await square(180, 0.14, 'public/apple-touch-icon.png');
console.log('favicon.png (64x64) y apple-touch-icon.png (180x180) listos, sobre --fondo con el logo real.');
