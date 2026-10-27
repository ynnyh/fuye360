// 行当清单（「360行」的门面，后续加行当只改这里）
export interface Industry {
  name: string;
  emoji: string;
  note: string; // 一句行当注脚，首页行当墙悬停/副标题用
}

export const industries: Industry[] = [
  { name: '餐饮', emoji: '🍜', note: '菜单、外卖、探店' },
  { name: '宠物', emoji: '🐾', note: '店务、内容、周边' },
  { name: '电商', emoji: '🛒', note: '详情页、主图、客服' },
  { name: '教育辅导', emoji: '📚', note: '讲义、绘本、题库' },
  { name: '自媒体', emoji: '📱', note: '脚本、起号、代运营' },
  { name: '设计创意', emoji: '🎨', note: '海报、头像、贺卡' },
  { name: '摄影影像', emoji: '📷', note: '修复、精修、跟拍' },
  { name: '文字翻译', emoji: '✍️', note: '文案、翻译、润色' },
  { name: '本地生活', emoji: '🧹', note: '家政、维修、获客' },
  { name: '二手闲置', emoji: '♻️', note: '代卖、翻新、文案' },
  { name: '职场服务', emoji: '💼', note: '简历、面试、咨询' },
  { name: '跨境出海', emoji: '🌏', note: 'Listing、选品、客服' },
];

export function industryCount(counts: Record<string, number>) {
  return (name: string) => counts[name] ?? 0;
}
