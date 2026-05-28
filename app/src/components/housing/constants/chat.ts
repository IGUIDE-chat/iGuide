/**
 * @file ./src/components/housing/constants/chat.ts
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { type ChatMessage } from "../types/index";

export const INITIAL_CHAT_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "model",
  text: "Hi! I'm your Illini Housing Assistant. I can help you find the best dorm based on your major, lifestyle, or budget. Try asking 'Which dorm is best for engineering students?' or 'Where is the best food?'",
  timestamp: new Date(),
};
