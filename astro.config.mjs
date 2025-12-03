// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
// import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://arceapps.com',

  // integrations: [tailwind()],
  base: '/',

  vite: {
    plugins: [tailwindcss()],
  },
});