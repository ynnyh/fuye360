# 副业360（fuye360）

> 360 行，行行用 AI。AI 副业玩法库：每张「玩法卡」拆清一个行当怎么用 AI 接活儿——工具链、SOP、成本、收益预估、坑，照着就能开工。

## 本地开发

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # 产物在 dist/
npm run preview
```

## 目录结构

```
src/
  config.ts            # 全站配置：站点名/SEO/仓库链接/giscus（改这里）
  content.config.ts    # 玩法卡字段 schema（zod 校验）
  content/cards/*.md   # 玩法卡：一张卡一个 .md 文件
  data/industries.ts   # 行当清单（首页行当墙）
  data/roles.ts        # 角色清单（可配置的人群）
  pages/               # 首页 / 玩法库 / 详情 / 投稿 / 关于
.github/ISSUE_TEMPLATE # 投稿表单（访客填表 → Issue）
scripts/issue-to-card.mjs  # 审核 Issue → 生成玩法卡
```

## 上线前必改的配置

1. `astro.config.mjs`：`site` 改成你的 Pages 地址（如 `https://yourname.github.io/fuye360`），同步改 `public/robots.txt` 里的 Sitemap 地址。
2. `src/config.ts`：`github` 填仓库地址（投稿按钮和页脚指向它）。
3. （可选）`src/config.ts`：`giscus` 填 giscus 参数后，玩法卡详情页自动出现评论区。去 https://giscus.app 按向导拿参数。
4. `src/pages/about.astro` 底部的仓库链接会自动跟随 `config.ts`，无需单独改。

## 部署（GitHub Pages）

1. 在 GitHub 建仓库 `fuye360`，把代码推到 `main`。
2. 仓库 Settings → Pages → Source 选 **GitHub Actions**。
3. 此后每次 push 到 `main` 自动构建部署（`.github/workflows/deploy.yml`）。

## 日常运营流程（收录一篇投稿）

1. 访客通过「投稿」页填表单 → 生成一条 Issue。
2. 审核：步骤可执行、收益靠谱、无引流广告。不合规就留言打回。
3. 通过后本地执行：

   ```bash
   node scripts/issue-to-card.mjs <issue编号>
   ```

   生成 `src/content/cards/<slug>.md`，人工过目润色后 commit + push，站点自动更新。
4. 去 Issue 打「已收录」标签并关闭。

## 加一个行当 / 角色

- 行当：`src/data/industries.ts` 加一项 + 投稿表单 `.github/ISSUE_TEMPLATE/new-card.yml` 的 dropdown 同步加。
- 角色：`src/data/roles.ts` 加一项 + 表单 checkboxes 同步加（`scripts/issue-to-card.mjs` 里的映射也要补）。

## SEO 说明（要老实话）

- 站点标题/描述已把「副业 / AI副业 / 搞钱 / 副业项目」等高频词占住（`src/config.ts`），每张玩法卡单独输出 title/description/keywords。
- 但 `*.github.io` 在国内访问不稳、百度收录差。要吃到国内搜索流量，后续需绑自有域名 + 考虑国内可达的托管（那时再谈备案）。
- 现阶段现实渠道：小红书/即刻/V2EX 发「玩法拆解」导流，GitHub Star 与投稿量是早期北极星指标。

## 内容红线

所有收益一律标注「预估」；不收会费、不卖课、不带私域引流；投稿审核后发布（流程见上）。
