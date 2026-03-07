// [UTILITY] Tag label i18n map — translates English tag strings to Chinese.
// [工具] 标签中英文映射表。
import { Language } from '../types';

/** All known dorm tags with their Chinese translations. */
const TAG_ZH_MAP: Record<string, string> = {
    // Style / vibe
    'Engineering': '工程学院',
    'Renovated': '已翻新',
    'Modern': '现代',
    'STEM': 'STEM',
    'Social': '社交活跃',
    'Popular': '热门',
    'Diverse': '多元',
    'Quiet': '安静',
    'Historic': '历史建筑',
    'Artsy': '艺术氛围',
    'Affordable': '经济实惠',
    'Freshmen': '新生友好',
    // Features
    'Late Night Dining': '深夜食堂',
    'Bus Routes': '公交便利',
    'Trellis Dining': 'Trellis 餐厅',
    'South Campus': '南校区',
    'No AC': '无空调',
    'Private Bath': '独立卫浴',
    'Singles': '单人间',
    'Graduate': '研究生',
    'Upperclassmen': '高年级生',
    'Transfer Cluster': '转学生聚集',
    'Ike South': 'Ike 南区',
    'Ike North': 'Ike 北区',
    'Small Community': '小型社区',
    'Unit One': 'Unit One',
    'Music': '音乐',
    'Female-Identified': '女性宿舍',
    // Amenities (also a structuredTag but duplicated in tags[])
    'Elevator': '电梯',
    'Laundry': '洗衣房',
    'Study Rooms': '自习室',
    'Kitchen': '厨房',
    'Parking': '停车位',
    'Gym Nearby': '健身房附近',
    'Pool': '泳池',
    'Gender-Inclusive': '性别包容',
    'Quiet Floors': '安静楼层',
    'Substance-Free': '无烟无酒',
    // Proximity
    'Near Main Quad': '近 Main Quad',
    'Near Engineering': '近工程学院',
    'Near Business': '近商学院',
    'Near ARC/CRCE': '近 ARC/CRCE',
    'Near Green Street': '近 Green Street',
    'Near Ikenberry Dining': '近 Ike 食堂',
    // LLCs
    'Engineering LLC': '工程 LLC',
    'Innovation LLC': '创新 LLC',
    'LEADS LLC': 'LEADS LLC',
    'Focus LLC': 'Focus LLC',
    'Exploration LLC': 'Exploration LLC',
    'Sustainability LLC': '可持续 LLC',
    'Scholars LLC': 'Scholars LLC',
    'Wohlers LLC': 'Wohlers LLC',
    'Intersections LLC': 'Intersections LLC',
    // PCH
    'Furnished': '带家具',
    'Apartment': '公寓型',
    'Suite Style': '套房型',
    'Premium': '高端',
};

/**
 * All known tag values, as a sorted list.
 * Used for the multi-select UI in the admin edit panel.
 */
export const KNOWN_TAGS: string[] = Object.keys(TAG_ZH_MAP).sort();

/**
 * Return the localised label for a tag.
 * Falls back to the original English string if no translation exists.
 */
export function getTagLabel(tag: string, language: Language): string {
    if (language === 'zh') {
        return TAG_ZH_MAP[tag] ?? tag;
    }
    return tag;
}
