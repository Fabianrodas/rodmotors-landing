/**
 * Genera imágenes provisionales para que el sitio compile antes de tener las fotos reales.
 * Uso: node scripts/placeholder-photos.mjs
 */
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
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
    .toFile(fileURLToPath(new URL(slot.file, OUT)));
  console.log('placeholder:', slot.file, `${slot.width}x${slot.height}`);
}
