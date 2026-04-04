/**
 * @file ./src/data/articles/arcVsCrce.ts
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

// [DATA] Article content for ARC vs CRCE guide.
// [数据] ARC 与 CRCE 指南的文章内容。
import { Article } from '../../types';

export const arcVsCrce: Article = {
    id: 'arc-vs-crce',
    category: 'social',
    title: 'Gym Wars: ARC vs. CRCE',
    summary: 'Which campus recreation center fits your workout style?',
    content: `
### ARC (Activities and Recreation Center)
*   **Vibe:** Massive, energetic, crowded.
*   **Best For:** Pickup basketball, huge weight lifting selection, rock climbing wall, cooking classes.
*   **Location:** Next to Memorial Stadium (near the Ike).

### CRCE (Campus Recreation Center East)
*   **Vibe:** Chill, quieter, more relaxed.
*   **Best For:** A quick treadmill run, swimming (has a slide and hot tub!), racquetball.
*   **Location:** Near Allen Hall and PAR/FAR.

**Access:** Both are free with your iCard!
  `,
    tags: ['gym', 'workout', 'sports', 'arc', 'crce', 'health'],
    title_zh: '健身房之战：ARC vs. CRCE',
    summary_zh: '哪个校园健身中心适合你？',
    content_zh: `
### ARC (Activities and Recreation Center)
*   **氛围:** 巨大、活力四射、拥挤。
*   **适合:** 打篮球、举重（器械极多）、攀岩墙、烹饪课。
*   **位置:** 纪念体育场旁边 (靠近 Ike)。

### CRCE (Campus Recreation Center East)
*   **氛围:** 冷静、安静、放松。
*   **适合:** 快速跑个步、游泳 (有滑梯和热水按摩池！)、壁球。
*   **位置:** 靠近 Allen Hall 和 PAR/FAR。

**权限:** 凭 iCard 均可免费进入！
  `,
    tags_zh: ['健身房', '运动', '体育', 'ARC', 'CRCE', '健康'],
    lastUpdated: '2024-01-20'
};
