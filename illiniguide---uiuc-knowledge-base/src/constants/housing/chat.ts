import { ChatMessage } from '../../types/housing';

export const INITIAL_CHAT_MESSAGE: ChatMessage = {
    id: 'welcome',
    role: 'model',
    text: "Hi! I'm your Illini Housing Assistant. I can help you find the best dorm based on your major, lifestyle, or budget. Try asking 'Which dorm is best for engineering students?' or 'Where is the best food?'",
    timestamp: new Date()
};


