/**
 * @file ./src/scripts/fixData.ts
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })
const supabase = createClient(
  process.env.VITE_SUPABASE_URL ?? "",
  process.env.VITE_SUPABASE_ANON_KEY ?? ""
)

const MAPPING: Record<string, string[]> = {
  allen: ["Unit One LLC"],
  isr: ["Innovation LLC", "Sustainability LLC", "Honors LLC"],
  nugent: ["Business LLC", "Beckwith Residential Community"],
  par: ["Intersections LLC", "Global Crossroads LLC"],
  far: ["WIMSE LLC", "Health Professions LLC"],
  weston: ["Exploration LLC", "LEADS LLC"],
  lar: ["Scholars Community"],
  scott: ["Transfer Community"],
  bousefield: ["Transfer Community"],
}

async function fixAll() {
  await Promise.all(
    Object.entries(MAPPING).map(async ([id, names]) => {
      const { data: dorm } = await supabase
        .from("dorms")
        .select("categorized_tags")
        .eq("id", id)
        .single()
      if (!dorm) {
        return
      }

      const ct = (dorm.categorized_tags as Record<string, string[]>) || {
        lifestyle: [],
        facilities: [],
        livingConditions: [],
      }
      ct.llcNames = names
      if (!ct.lifestyle.includes("llc")) {
        ct.lifestyle.push("llc")
      }

      const { error } = await supabase
        .from("dorms")
        .update({ categorized_tags: ct })
        .eq("id", id)
      if (error) {
        console.error(`Error ${id}:`, error)
      } else {
        // Verify immediately
        const { data: verified } = await supabase
          .from("dorms")
          .select("categorized_tags")
          .eq("id", id)
          .single()
        console.log(
          `Updated ${id}:`,
          JSON.stringify(verified?.categorized_tags?.llcNames)
        )
      }
    })
  )
}
await fixAll()
