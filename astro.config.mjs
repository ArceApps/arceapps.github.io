// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
// import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://arceapps.com',

  integrations: [sitemap()],
  base: '/',

  vite: {
    plugins: [tailwindcss()],
  },
});