/**
 * @file ./src/data/articles/dormSelection.ts
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

// [DATA] Article content for Dorm Selection guide.
// [数据] 宿舍选择指南的文章内容。
import { Article } from "../../types";

export const dormSelection: Article = {
  id: "dorm-selection",
  category: "housing",
  title: "Freshman Dorm Selection Guide",
  summary:
    "ISR vs. Ike vs. PAR/FAR. How to choose the right residence hall for you.",
  content: `
### Choosing Your Home at UIUC

**ISR (Illinois Street Residence)**
Best for engineering students. Recently renovated with a massive dining hall and modern amenities. Located practically on the engineering quad.

**The IKE (Ikenberry Commons)**
The social hub. "Six Pack" area. Great dining hall, huge gym (ARC) nearby. Very social atmosphere, mostly freshmen.

**PAR/FAR (Pennsylvania/Florida Avenue)**
Further south. Known for Late Night dining at PAR. Quieter, but very tight-knit communities. Good bus access to the Main Quad.

**Allen Hall**
Known for artsy, creative vibes and Unit One LLC.
  `,
  tags: ["housing", "freshman", "dorms", "isr", "ike", "par", "far"],
  title_zh: "大一新生宿舍选择指南",
  summary_zh: "ISR、Ike 还是 PAR/FAR？如何选择最适合你的宿舍。",
  content_zh: `
### 在 UIUC 选择你的家

**ISR (Illinois Street Residence)**
工科生的首选。最近刚翻新过，拥有巨大的食堂和现代化的设施。地理位置极佳，就在工学院 Quad 旁边。

**The IKE (Ikenberry Commons)**
社交中心，俗称 "Six Pack"。拥有很棒的食堂，旁边就是巨大的 ARC 健身房。社交氛围浓厚，绝大多数是大一新生。

**PAR/FAR (Pennsylvania/Florida Avenue)**
位于校园南端。以 PAR 的 Late Night (夜宵) 闻名。相对安静，但社区氛围紧密。去 Main Quad 的公交车很方便。

**Allen Hall**
以艺术、创意氛围和 Unit One LLC (学习生活社区) 闻名。
  `,
  tags_zh: ["住宿", "大一", "宿舍", "ISR", "Ike", "PAR", "FAR"],
  lastUpdated: "2024-05-15",
};
