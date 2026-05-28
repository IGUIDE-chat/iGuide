/**
 * @file ./src/scripts/testUpdate.ts
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function testUpdate() {
  const id = "allen";
  const newLlcNames = ["Unit One LLC"];

  console.log("Fetching current...");
  const { data: dorm } = await supabase
    .from("dorms")
    .select("categorized_tags")
    .eq("id", id)
    .single();
  console.log("Current:", JSON.stringify(dorm?.categorized_tags));

  const ct = { ...dorm?.categorized_tags } as any;
  ct.llcNames = newLlcNames;

  console.log("Updating with:", JSON.stringify(ct));
  const { error } = await supabase
    .from("dorms")
    .update({ categorized_tags: ct })
    .eq("id", id);
  if (error) {console.error("Error:", error);}
  else {
    const { data: after } = await supabase
      .from("dorms")
      .select("categorized_tags")
      .eq("id", id)
      .single();
    console.log("After update:", JSON.stringify(after?.categorized_tags));
  }
}
testUpdate();
