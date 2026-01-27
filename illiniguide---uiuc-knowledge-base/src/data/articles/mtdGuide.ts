// [DATA] Article content for MTD Bus System guide.
// [数据] MTD 公交系统指南的文章内容。
import { Article } from '../../types';

export const mtdGuide: Article = {
  id: 'mtd-guide',
  category: 'transport',
  title: 'Mastering the CUMTD Bus System',
  summary: 'How to use your iCard for free rides and apps you need.',
  content: `
### Riding the Bus

UIUC students have unlimited access to the Champaign-Urbana Mass Transit District (MTD) with a valid **iCard**.

1. **Always carry your iCard.** You just flash it to the driver.
2. **Download an App.** Use 'Transit' or 'UIUC Bus' apps for real-time tracking. Google Maps is good but sometimes lags on live delays.
3. **The Illini (22) and Yellow (1)** are your best friends for getting between the Quad, Dorms, and Downtown.

**Late Night:** The SafeRides service operates after regular bus hours for on-demand safe transport.
  `,
  tags: ['bus', 'transport', 'icard', 'mtd', 'getting around'],
  title_zh: '玩转 CUMTD 公交系统',
  summary_zh: '如何用 iCard 免费乘车以及必备的公交 APP。',
  content_zh: `
### 乘坐公交车

UIUC 学生凭有效的 **iCard** 可以无限次免费乘坐香槟-厄巴纳公交系统 (MTD)。

1. **随身携带 iCard。** 上车时向司机出示即可。
2. **下载 APP。** 推荐使用 'Transit' 或 'UIUC Bus' 查看实时公交。Google Maps 也不错，但有时延迟更新不及时。
3. **Illini (22路) 和 Yellow (1路)** 是往返 Quad、宿舍和市中心的黄金线路。

**深夜出行：** 常规公交停运后，可以使用 SafeRides 服务进行点对点接送。
  `,
  tags_zh: ['公交', '交通', 'iCard', 'MTD', '出行'],
  lastUpdated: '2023-08-20'
};
