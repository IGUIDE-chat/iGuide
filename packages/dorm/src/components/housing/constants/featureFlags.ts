/**
 * 控制是否展示来自 Google Maps 的爬取评论数据。
 * - false（默认）：隐藏 Google Reviews，评论列表和统计数据仅显示 Supabase 真实用户评论。
 * - true：合并 Google Reviews 数据到评论列表和统计中。
 */
export const SHOW_GOOGLE_REVIEWS = false

/**
 * 控制是否展示宿舍好评率（点赞占比）的 UI。
 * - false（默认）：隐藏卡片角标、详情页主图角标以及评价区标题中的好评率。
 * - true：正常展示好评率。
 *
 * 注意：此开关仅影响展示，不影响点赞数据的读写与统计。
 */
export const SHOW_POSITIVE_RATING = false

/**
 * 宿舍评论功能总开关。
 * - false（当前）：关闭整个评论功能——详情页评论区不渲染，不再请求评论列表和
 *   评论统计，发表/编辑/删除、投票、管理员隐藏操作全部为空操作，列表页也不会
 *   跳转到 #reviews。依赖评论数据的好评率随之为空。
 * - true：正常启用评论功能。
 */
export const SHOW_COMMENTS = false
