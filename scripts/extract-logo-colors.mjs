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

// Agrupa en pasos de 32 para juntar tonos parecidos, pero suma los valores reales:
// lo que se imprime es el promedio medido de cada grupo, no la clave redondeada.
const buckets = new Map();
for (let i = 0; i < data.length; i += info.channels) {
  const rgb = [data[i], data[i + 1], data[i + 2]];
  const key = rgb.map((c) => Math.round(c / 32)).join(',');
  const bucket = buckets.get(key) ?? { sum: [0, 0, 0], count: 0 };
  rgb.forEach((c, channel) => (bucket.sum[channel] += c));
  bucket.count += 1;
  buckets.set(key, bucket);
}

const total = data.length / info.channels;
const top = [...buckets.values()].sort((a, b) => b.count - a.count).slice(0, 8);

console.log('Colores dominantes del logo:');
for (const { sum, count } of top) {
  const hex = `#${sum.map((c) => Math.round(c / count).toString(16).padStart(2, '0')).join('')}`;
  console.log(`  ${hex}  ${((count / total) * 100).toFixed(1)}%`);
}
console.log('\nSi alguno es un azul cercano al de marca (no gris ni negro), reemplaza --brand con ese azul, deriva --brand-soft un poco más claro y ajusta --accent-strong hasta que pasen los tests de contraste.');
