import { Hat } from './types';

// 定义帽子素材的总数量
// 如果你在 public/hats/ 下添加了更多图片，请修改这里的数字
const TOTAL_HATS_COUNT = 15;

export const STATIC_HATS: Hat[] = Array.from({ length: TOTAL_HATS_COUNT }, (_, i) => {
  const index = i + 1;
  return {
    id: `hat-${index}`,
    name: `款式 ${index}`,
    src: `/hats/${index}.png` // 直接指向 public 目录下的绝对路径
  };
});