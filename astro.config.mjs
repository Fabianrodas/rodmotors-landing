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
