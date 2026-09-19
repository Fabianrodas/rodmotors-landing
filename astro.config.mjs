// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://rodmotors.ec',
  integrations: [icon({ include: { ph: ['*'] } }), sitemap()],
  image: { domains: ['i.ytimg.com'] },
  // Una sola página: el CSS (~4 KB comprimido) va dentro del HTML y se ahorra un viaje de red antes del primer render.
  build: { inlineStylesheets: 'always' },
  vite: { plugins: [tailwindcss()] },
});
