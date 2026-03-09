import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function testUpdate() {
    const id = 'allen';
    const newLlcNames = ['Unit One LLC'];

    console.log('Fetching current...');
    const { data: dorm } = await supabase.from('dorms').select('categorized_tags').eq('id', id).single();
    console.log('Current:', JSON.stringify(dorm?.categorized_tags));

    const ct = { ...dorm?.categorized_tags } as any;
    ct.llcNames = newLlcNames;

    console.log('Updating with:', JSON.stringify(ct));
    const { error } = await supabase.from('dorms').update({ categorized_tags: ct }).eq('id', id);
    if (error) console.error('Error:', error);
    else {
        const { data: after } = await supabase.from('dorms').select('categorized_tags').eq('id', id).single();
        console.log('After update:', JSON.stringify(after?.categorized_tags));
    }
}
testUpdate();
