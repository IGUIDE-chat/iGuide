// TODO: Once AI prompt can accept dynamic dorms, switch to dormService.getAllDorms()
import { UIUC_DORMS } from '../constants/housing';
import { ChatMessage } from '../types/housing';

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
- FORMATTING: Use Markdown. ALWAYS use bold for dorm names (e.g., **ISR**, **Allen Hall**, **Ikenberry**).
`;

class DeepSeekService {
    private apiUrl: string = '/api/deepseek';

    async sendMessage(history: ChatMessage[], newMessage: string): Promise<string> {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    history,
                    newMessage,
                    systemInstruction: SYSTEM_INSTRUCTION
                })
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                console.error('DeepSeek API Error:', response.status, errorText);
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data = await response.json() as { reply?: string };
            return data.reply || "I'm having trouble connecting to the Illini network right now. Try again?";
        } catch (error) {
            console.error('DeepSeek Service Error:', error);
            return 'Oops! I tripped over a squirrel on the Quad. Can you ask that again?';
        }
    }
}

export const deepSeekService = new DeepSeekService();