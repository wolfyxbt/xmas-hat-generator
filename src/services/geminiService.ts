import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export const generateChristmasGreeting = async (): Promise<string> => {
  if (!apiKey) {
    return "请配置 API_KEY 以生成祝福语！";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "写一句简短、有趣且温暖的中文圣诞节祝福语，适合发在朋友圈或作为头像配文。请包含1-2个Emoji。",
    });
    return response.text || "圣诞快乐，喜乐长安！🎄";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "圣诞快乐，愿你拥有美好的一年！🎁";
  }
};