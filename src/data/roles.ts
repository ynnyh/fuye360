// 角色清单（可配置：想加「程序员」「银发族」以外的角色，改这里即可）
export interface Role {
  name: string;
  emoji: string;
  blurb: string; // 选中后的一句响应语
}

export const roles: Role[] = [
  { name: '上班族', emoji: '💼', blurb: '下班后两小时，够开一张新摊子' },
  { name: '宝妈宝爸', emoji: '🍼', blurb: '碎片时间接活儿，家里蹲也能跑' },
  { name: '学生党', emoji: '🎓', blurb: '本钱少不怕，先攒作品和口碑' },
  { name: '程序员', emoji: '💻', blurb: '别人用工具，你搭流水线' },
  { name: '设计师', emoji: '🎨', blurb: '审美是你的护城河，AI是你的学徒' },
  { name: '小店主', emoji: '🏪', blurb: '店是现成的流量口，加点AI多一条腿' },
  { name: '自由职业', emoji: '🧭', blurb: '单子要多线程，玩法卡就是你的项目库' },
  { name: '银发族', emoji: '🍵', blurb: '手艺和闲工夫，都是年轻人缺的' },
];
