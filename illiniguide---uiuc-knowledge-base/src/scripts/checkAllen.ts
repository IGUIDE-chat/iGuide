/**
 * @file ./src/scripts/checkAllen.ts
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

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
