/**
 * @file ./src/data/articles/safeWalks.ts
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

// [DATA] Article content for SafeWalks & SafeRides guide.
// [数据] 安全行走（SafeWalks）与安全乘车（SafeRides）指南的文章内容。
import { type Article } from "../../types";

export const safeWalks: Article = {
  id: "safe-walks",
  category: "safety",
  title: "SafeWalks & SafeRides",
  summary: "Never walk home alone at night. Campus safety services explained.",
  content: `
### Staying Safe at Night

UIUC offers services to ensure you don't have to travel alone at night.

**SafeWalks**
*   **What:** Student Patrol officers will walk with you.
*   **Number:** 217-333-1216
*   **Hours:** 9 PM to 2:30 AM.

**SafeRides**
*   **What:** MTD vans that pick you up if you are in an area not served by fixed bus routes at night.
*   **How:** Use the MTD Connect app or call.
*   **Rule:** It is *not* a free Uber. It is for safety when buses aren't running or accessible.
  `,
  tags: ["safety", "police", "walking", "night", "saferides", "safewalks"],
  title_zh: "SafeWalks 与 SafeRides",
  summary_zh: "永远不要独自走夜路。校园安全服务详解。",
  content_zh: `
### 夜间安全指南

UIUC 提供多种服务确保你不用独自走夜路。

**SafeWalks (陪走服务)**
*   **内容:** 学生巡逻员会陪你走到目的地。
*   **电话:** 217-333-1216
*   **时间:** 晚 9 点 至 凌晨 2:30。

**SafeRides (安全乘车)**
*   **内容:** MTD 面包车，在夜间固定公交线路覆盖不到的地方接你。
*   **方式:** 使用 MTD Connect App 或电话预约。
*   **规则:** 这*不是*免费的 Uber。它仅用于常规公交停运或无法到达时的安全保障。
  `,
  tags_zh: ["安全", "警察", "夜路", "SafeRides", "SafeWalks"],
  lastUpdated: "2024-08-01",
};
