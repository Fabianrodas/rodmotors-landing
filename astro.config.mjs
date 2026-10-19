// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://rodmotors.ec',
  integrations: [icon({ include: { ph: ['*'] } }), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    // Windows: el watcher no debe tocar archivos del sistema en la raíz del disco (EINVAL/EBUSY).
    server: {
      watch: {
        ignored: ['**/DumpStack.log*', '**/pagefile.sys', '**/hiberfil.sys', '**/swapfile.sys', '**/System Volume Information/**', '**/$Recycle.Bin/**'],
      },
    },
  },
});
