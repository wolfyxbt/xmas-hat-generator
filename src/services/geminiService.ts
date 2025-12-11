// 为了确保项目在没有安装 @google/genai 或配置 API Key 的情况下也能成功构建，
// 此文件已修改为 Mock 实现。

export const generateChristmasGreeting = async (): Promise<string> => {
  // 模拟网络请求延迟，保持原有交互体验
  await new Promise((resolve) => setTimeout(resolve, 600));

  // 返回固定的备选文案
  return "圣诞快乐，喜乐长安！🎄";
};