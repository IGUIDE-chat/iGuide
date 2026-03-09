import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const MAPPING: Record<string, string[]> = {
    'allen': ['Unit One LLC'],
    'isr': ['Innovation LLC', 'Sustainability LLC', 'Honors LLC'],
    'nugent': ['Business LLC', 'Beckwith Residential Community'],
    'par': ['Intersections LLC', 'Global Crossroads LLC'],
    'far': ['WIMSE LLC', 'Health Professions LLC'],
    'weston': ['Exploration LLC', 'LEADS LLC'],
    'lar': ['Scholars Community'],
    'scott': ['Transfer Community'],
    'bousefield': ['Transfer Community']
};

async function fixAll() {
    for (const [id, names] of Object.entries(MAPPING)) {
        const { data: dorm } = await supabase.from('dorms').select('categorized_tags').eq('id', id).single();
        if (!dorm) continue;

        let ct = (dorm.categorized_tags as any) || { lifestyle: [], facilities: [], livingConditions: [] };
        ct.llcNames = names;
        if (!ct.lifestyle.includes('llc')) ct.lifestyle.push('llc');

        const { error } = await supabase.from('dorms').update({ categorized_tags: ct }).eq('id', id);
        if (error) console.error(`Error ${id}:`, error);
        else {
            // Verify immediately
            const { data: verified } = await supabase.from('dorms').select('categorized_tags').eq('id', id).single();
            console.log(`Updated ${id}:`, JSON.stringify(verified?.categorized_tags?.llcNames));
        }
    }
}
fixAll();
