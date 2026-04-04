/**
 * @file ./src/data/articles/veoRide.ts
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

// [DATA] Article content for VeoRide guide.
// [数据] VeoRide 共享单车指南的文章内容。
import { Article } from '../../types'

export const veoRide: Article = {
  id: 'veoride-rules',
  category: 'transport',
  title: 'E-Scooters & Bikes (VeoRide)',
  summary: 'How to use campus scooters without getting fined.',
  content: `
### Using VeoRide

You will see teal e-scooters and bikes everywhere.

1.  **App:** Download the Veo app to unlock them.
2.  **Cost:** Usually $1 unlock + per minute fee. It adds up fast!
3.  **Parking:** **Crucial!** You must park in designated bike racks. If you leave it in the middle of a sidewalk, you might get fined or banned.
4.  **Riding:** Do NOT ride on the sidewalks on Green Street. Use the bike lanes.
  `,
  tags: ['scooter', 'bike', 'veo', 'transport', 'fines'],
  title_zh: '共享单车与滑板车 (VeoRide)',
  summary_zh: '如何使用校园滑板车并不被罚款。',
  content_zh: `
### 使用 VeoRide

你会看到满校园都是青色的电动滑板车和自行车。

1.  **App:** 下载 Veo App 扫码解锁。
2.  **费用:** 通常是 $1 解锁费 + 每分钟计费。骑久了很贵！
3.  **停车:** **关键！** 必须停在指定的自行车架区域。如果你把它扔在人行道中间，可能会被罚款或封号。
4.  **骑行:** 严禁在 Green Street 的人行道上骑行。请使用自行车道。
  `,
  tags_zh: ['滑板车', '自行车', 'Veo', '交通', '罚款'],
  lastUpdated: '2023-09-01',
}
