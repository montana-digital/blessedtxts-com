import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { shouldIncludeInSitemap } from './src/lib/sitemap-filter.mjs';

export default defineConfig({
  site: 'https://blessedtxts.com',
  output: 'static',
  integrations: [
    sitemap({
      filter: (page) => shouldIncludeInSitemap(page),
    }),
  ],
  build: {
    format: 'directory',
  },
});
