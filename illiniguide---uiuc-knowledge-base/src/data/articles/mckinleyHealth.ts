/**
 * @file ./src/data/articles/mckinleyHealth.ts
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

// [DATA] Article content for McKinley Health Center guide.
// [数据] 麦金利校医院指南的文章内容。
import { Article } from '../../types';

export const mckinleyHealth: Article = {
  id: 'mckinley-health',
  category: 'safety',
  title: 'McKinley Health Center: Free Services',
  summary: 'Did you know you already paid for healthcare? How to use McKinley.',
  content: `
### McKinley Health Center

Your student fees cover most services here!

**What's Free?**
*   **Doctor Visits:** Primary care appointments are generally free.
*   **Over-the-Counter Packs:** You can get "Cold Care Packs" (cough drops, tissues, meds) and "Wound Care Packs" for free at the welcome desk.
*   **Dial-A-Nurse:** 24/7 medical advice over the phone if you aren't sure if you need to go to the ER.

**Location:** Lincoln Avenue, near the Ike and FAR/PAR.
  `,
  tags: ['health', 'doctor', 'medicine', 'mckinley', 'safety', 'free'],
  title_zh: 'McKinley 校医院：免费服务',
  summary_zh: '你知道你已经付过医疗费了吗？如何使用 McKinley。',
  content_zh: `
### McKinley 校医院

你的学杂费已经包含了这里的大部分服务！

**什么免费？**
*   **看医生:** 全科医生预约通常是免费的。
*   **非处方药包:** 你可以在前台免费领取 "感冒包" (含喉糖、纸巾、退烧药) 和 "外伤包"。
*   **Dial-A-Nurse:** 24/7 电话护士咨询。如果你不确定是否需要去急诊，可以先打这个电话。

**位置:** Lincoln Avenue，靠近 Ike 和 FAR/PAR。
  `,
  tags_zh: ['健康', '医生', '药', 'McKinley', '安全', '免费'],
  lastUpdated: '2024-08-01'
};
