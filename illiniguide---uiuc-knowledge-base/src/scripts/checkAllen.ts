import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkDorm(id: string) {
    const { data, error } = await supabase.from('dorms').select('id, name, categorized_tags').eq('id', id).single();
    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));
}
checkDorm('allen');
