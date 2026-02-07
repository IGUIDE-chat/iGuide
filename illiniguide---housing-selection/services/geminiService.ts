import { GoogleGenAI } from "@google/genai";
import { UIUC_DORMS } from '../constants';

const SYSTEM_INSTRUCTION = `
You are the IlliniGuide Housing Assistant, an expert on University of Illinois at Urbana-Champaign (UIUC) dormitories.
You have the following knowledge about specific dorms:
${JSON.stringify(UIUC_DORMS.map(d => ({ name: d.name, tags: d.tags, pros: d.pros, cons: d.cons, location: d.location })))}

Your goal is to help students choose a dorm.
- If they ask about engineering, recommend ISR or dorms near Green St.
- If they want social life, recommend Ikenberry (The Ike).
- If they want arts/creative, recommend Allen Hall.
- If they ask about food, mention PAR (Late night), ISR (New), and Ikenberry Dining.
- Be concise, friendly, and spirited (Use "I-L-L!" occasionally).
- Do not make up fake dorms. Only discuss official UIUC housing.
`;

class GeminiService {
  private ai: GoogleGenAI;
  private model: string = 'gemini-3-flash-preview';

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async sendMessage(history: { role: string; parts: { text: string }[] }[], newMessage: string): Promise<string> {
    try {
      // We will use a fresh generateContent call for simplicity in this demo,
      // constructing the prompt manually.

      const prompt = `
        User History: ${history.map(h => `${h.role}: ${h.parts[0].text}`).join('\n')}
        Current User Question: ${newMessage}
      `;

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          // Add search grounding to get real-time info about housing rates or construction if needed
          tools: [{ googleSearch: {} }]
        }
      });

      return response.text || "I'm having trouble connecting to the Illini network right now. Try again?";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Oops! I tripped over a squirrel on the Quad. Can you ask that again?";
    }
  }
}

export const geminiService = new GeminiService();