import { Dorm } from '../types/housing';
import { UIUC_DORMS } from '../constants/housing/dormData';

/**
 * Checks if a given text fragment is a dorm name or a significant part of one.
 * Used for selective highlighting in chat.
 */
export const isDormMention = (text: string, dorms: Dorm[] = UIUC_DORMS): boolean => {
    if (!text || text.length < 2) return false;

    const lowerText = text.toLowerCase().trim();

    return dorms.some(dorm => {
        const dormName = dorm.name.toLowerCase();
        // Check for full name match (e.g., "Allen Hall")
        if (dormName.includes(lowerText)) return true;

        // Check for ID match (e.g., "isr", "par")
        if (dorm.id.toLowerCase() === lowerText) return true;

        // Check for known abbreviations or variations if they exist in name
        // e.g. "ISR" is in "Illinois Street Residence (ISR)"
        if (lowerText.length > 2 && dormName.includes(`(${lowerText})`)) return true;

        return false;
    });
};

/**
 * Helper to find dorms mentioned in a longer text block.
 * Used for showing dorm cards.
 */
export const findMentionedDorms = (text: string, dorms: Dorm[] = UIUC_DORMS) => {
    const lowerText = text.toLowerCase();
    return dorms.filter(dorm =>
        lowerText.includes(dorm.name.toLowerCase()) ||
        dorm.name.toLowerCase().split(' ').some(part => part.length > 3 && lowerText.includes(part))
    );
};
