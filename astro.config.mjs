import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// 上线前把 site 改成你的 GitHub Pages 地址，例如 https://yourname.github.io/fuye360
// GitHub Pages 项目站部署在 /fuye360/ 子路径下：site 管域名，base 管资源与路由前缀
export default defineConfig({
  site: 'https://ynnyh.github.io/fuye360',
  base: '/fuye360',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
});
