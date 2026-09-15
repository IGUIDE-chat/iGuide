/**
 * @file ./src/components/housing/constants/featureFlags.ts
 * @description Feature flags for the Housing domain.
 * @description_zh Housing 域的特性开关常量。修改此文件中的布尔值即可切换对应功能的可见性。
 */

/**
 * 控制是否展示来自 Google Maps 的爬取评论数据。
 * - false（默认）：隐藏 Google Reviews，评论列表和统计数据仅显示 Supabase 真实用户评论。
 * - true：合并 Google Reviews 数据到评论列表和统计中。
 */
export const SHOW_GOOGLE_REVIEWS = false;

/**
 * 控制是否展示宿舍好评率（点赞占比）的 UI。
 * - false（默认）：隐藏卡片角标、详情页主图角标以及评价区标题中的好评率。
 * - true：正常展示好评率。
 *
 * 注意：此开关仅影响展示，不影响点赞数据的读写与统计。
 */
export const SHOW_POSITIVE_RATING = false;
