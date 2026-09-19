/**
 * Genera la imagen de Open Graph a partir de una foto del taller.
 * Uso: node scripts/og-image.mjs [entrada] [salida]
 */
import sharp from 'sharp';

const [input = 'src/assets/photos/fachada.jpg', output = 'public/og.jpg'] = process.argv.slice(2);
await sharp(input).resize(1200, 630, { fit: 'cover', position: 'centre' }).jpeg({ quality: 82 }).toFile(output);
console.log(`og listo: ${output} (1200x630) desde ${input}`);
