/**
 * @file ./src/data/articles/quadDay.ts
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

// [DATA] Article content for Quad Day guide.
// [数据] 迎新日（Quad Day）指南的文章内容。
import { type Article } from "../../types"

export const quadDay: Article = {
  id: "quad-day",
  category: "social",
  title: "Quad Day: The RSO Fair",
  summary:
    "The most chaotic and fun Sunday of the year. Join one of 1000+ clubs.",
  content: `
### What is Quad Day?

Held on the Sunday before classes start, Quad Day is where hundreds of Registered Student Organizations (RSOs) set up booths on the Main Quad.

**Strategy:**
1.  **Bring Water:** It is usually hot.
2.  **Sign Up:** Don't be afraid to put your email down for 20 clubs. You can unsubscribe later.
3.  **Free Stuff:** You will get tons of pens, frisbees, and coupons.

**Missed it?** Check out the connection portal online to find clubs year-round.
  `,
  tags: ["social", "clubs", "rso", "events", "quad day", "involvement"],
  title_zh: "Quad Day：社团招新日",
  summary_zh: "一年中最混乱也最有趣的周日。加入 1000+ 个社团之一。",
  content_zh: `
### 什么是 Quad Day?

在开学前的周日举行，数百个注册学生组织 (RSOs) 会在 Main Quad 摆摊招新。

**攻略:**
1.  **带水:** 通常那天巨热。
2.  **尽管报名:** 别害怕给 20 个社团留邮箱。反正以后可以退订。
3.  **拿赠品:** 你会拿到无数的笔、飞盘和优惠券。

**错过了?** 全年都可以在学校官网的 connection portal 查找社团。
  `,
  tags_zh: ["社交", "社团", "RSO", "活动", "Quad Day"],
  lastUpdated: "2024-08-15",
}
