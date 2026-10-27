import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// 上线前把 site 改成你的 GitHub Pages 地址，例如 https://yourname.github.io/fuye360
export default defineConfig({
  site: 'https://ynnyh.github.io/fuye360',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
});
