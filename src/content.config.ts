import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 玩法卡 schema：一张卡 = 一个 .md 文件。
// 与 .github/ISSUE_TEMPLATE/new-card.yml 投稿表单字段一一对应。
const cards = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cards' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(), // 一句话简介，列表页展示
    industry: z.string(), // 必须是 src/data/industries.ts 里的 name
    audience: z.array(z.string()).default([]), // 适合人群（roles.ts 里的 name）
    tools: z.array(z.string()).default([]), // AI 工具链
    cost: z.enum(['低', '中', '高']), // 启动成本
    difficulty: z.enum(['入门', '进阶', '专业']), // 上手难度
    time: z.string(), // 时间投入，如「每天1-2小时」
    income: z.string(), // 收益预期（必须写明是预估）
    faceless: z.boolean().default(true), // 是否无需露脸
    tags: z.array(z.string()).default([]),
    author: z.string().default('副业360编辑部'),
    featured: z.boolean().default(false), // 首页精选
    pubDate: z.coerce.date(),
  }),
});

export const collections = { cards };
