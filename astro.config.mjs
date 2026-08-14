import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { shouldIncludeInSitemap } from './src/lib/sitemap-filter.mjs';
import { SITE_URL } from './src/site-url.mjs';

export default defineConfig({
  site: SITE_URL,
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
