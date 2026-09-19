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
