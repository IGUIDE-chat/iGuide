/**
 * @file ./src/data/articles/registration101.ts
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

// [DATA] Article content for Course Registration guide.
// [数据] 选课入门（Registration 101）指南的文章内容。
import { type Article } from "../../types"

export const registration101: Article = {
  id: "registration-101",
  category: "academics",
  title: "Course Registration Survival Guide",
  summary:
    "Using Enterprise, Course Explorer, and what to do if a class is full.",
  content: `
### Registration Tips

1. **Know your Time Ticket.** Check Enterprise well in advance.
2. **Course Explorer.** Use this to find CRNs. It updates faster than the registration system UI.
3. **Notify Me.** If a class is full, set up a notification. Spots often open up during the first week of classes ("Add/Drop period").

**Gen Eds:** Don't just take "easy" classes. Take something interesting!
  `,
  tags: [
    "registration",
    "classes",
    "academics",
    "course explorer",
    "enterprise",
  ],
  title_zh: "选课生存指南",
  summary_zh: "Enterprise 使用技巧，以及课满了该怎么办。",
  content_zh: `
### 选课技巧

1. **确人你的 Time Ticket (选课时间)。** 提前在 Enterprise 查好。
2. **Course Explorer。** 用这个网站查 CRN 码。它的更新速度比选课系统界面快。
3. **Notify Me。** 如果课满了，设置个提醒。开学第一周 ("Add/Drop period") 经常会有人退课。

**通识课 (Gen Eds):** 别只选"水课"。选点真正有趣的！
  `,
  tags_zh: ["选课", "课程", "学术", "Course Explorer", "Enterprise"],
  lastUpdated: "2024-01-10",
}
