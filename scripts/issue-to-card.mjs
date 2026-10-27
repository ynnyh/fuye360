#!/usr/bin/env node
/**
 * 把投稿 Issue 转成玩法卡 markdown。
 *
 * 用法（审核通过后，在仓库根目录执行）：
 *   node scripts/issue-to-card.mjs <issue编号>
 *
 * 依赖 gh CLI 且已登录。脚本会：
 *   1. 读取 issue 的表单字段；
 *   2. 生成 slug，写出到 src/content/cards/<slug>.md；
 *   3. 打印后续 git 命令提示（不自动提交，由你过目后手动提交）。
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const num = process.argv[2];
if (!num) {
  console.error('用法：node scripts/issue-to-card.mjs <issue编号>');
  process.exit(1);
}

const raw = execFileSync('gh', ['issue', 'view', num, '--json', 'title,body,user'], {
  encoding: 'utf8',
  maxBuffer: 10 * 1024 * 1024,
});
const issue = JSON.parse(raw);

// GitHub issue 表单的 body 是「### 字段名\n\n值」的固定格式，按此切分
function parseForm(body) {
  const fields = {};
  const re = /^### (.+?)\n\n([\s\S]*?)(?=\n### |$)/gm;
  let m;
  while ((m = re.exec(body))) {
    fields[m[1].trim()] = m[2].trim();
  }
  return fields;
}
const f = parseForm(issue.body);
const get = (k) => (f[k] ?? '').replace(/^_/m, '').trim(); // 未填项为占位下划线
const list = (k) => get(k).split(/[,，、\n]/).map((s) => s.trim()).filter(Boolean);

const slugRaw = get('title') || issue.title;
const slug =
  [...slugRaw].filter((ch) => /[a-zA-Z0-9-]/.test(ch)).join('').toLowerCase().slice(0, 40) ||
  `issue-${num}`;

function toSlugName(ch) {
  const map = { '上班族': 'worker', '宝妈宝爸': 'parent', '学生党': 'student', '程序员': 'dev', '设计师': 'designer', '小店主': 'shopkeeper', '自由职业': 'freelancer', '银发族': 'senior' };
  return map[ch] ?? ch;
}

const audience = get('适合人群（可多选）')
  .split(/[,，\n]/)
  .map((s) => s.replace(/^\[x?\]?\s*/,'').trim())
  .filter((s) => s && s !== '[ ]');

const front = {
  title: slugRaw,
  summary: get('一句话简介'),
  industry: get('行当'),
  audience: audience.map(toSlugName),
  tools: list('AI 工具链'),
  cost: get('启动成本') || '低',
  difficulty: get('上手难度') || '入门',
  time: get('时间投入'),
  income: get('收益预估'),
  faceless: get('是否无需露脸') !== '否',
  tags: list('标签'),
  author: get('署名') || issue.user.login,
  featured: false,
  pubDate: new Date().toISOString().slice(0, 10),
};

const fm = Object.entries(front)
  .map(([k, v]) => {
    if (Array.isArray(v)) return `${k}: [${v.map((s) => JSON.stringify(s)).join(', ')}]`;
    if (typeof v === 'boolean') return `${k}: ${v}`;
    if (k === 'pubDate') return `${k}: ${v}`;
    return `${k}: ${JSON.stringify(v)}`;
  })
  .join('\n');

const body = `## 谁会为此付钱

${get('谁会为此付钱 + 一句话价值主张')}

## 工具链与成本

${list('AI 工具链').map((t) => `- **${t}**`).join('\n') || '- （待补充）'}

## 开工步骤

${get('开工步骤（SOP）')}

## 获客与定价

${get('获客与定价')}

## 风险与坑

${get('风险与坑')}

## Prompt 模板

${get('Prompt 模板（可选但强烈建议）') || '（暂无，欢迎在评论区补充）'}
`;

const outPath = join('src', 'content', 'cards', `${slug}.md`);
writeFileSync(outPath, `---\n${fm}\n---\n\n${body}`, 'utf8');
console.log(`✅ 已生成 ${outPath}`);
console.log('过目后手动提交：');
console.log(`  git add ${outPath} && git commit -m "收录玩法卡：${slugRaw} (issue #${num})" && git push`);
console.log('push 后 Pages 会自动重新部署。别忘了去 issue 打「已收录」标签并关闭。');
