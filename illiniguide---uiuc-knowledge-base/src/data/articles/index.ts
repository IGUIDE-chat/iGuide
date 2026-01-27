// [DATA] Exports all articles as a single collection.
// [数据] 导出所有文章为单一集合。
import { Article } from '../../types';
import { dormSelection } from './dormSelection';
import { mtdGuide } from './mtdGuide';
import { veoRide } from './veoRide';
import { registration101 } from './registration101';
import { graingerLibrary } from './graingerLibrary';
import { greenStreetEats } from './greenStreetEats';
import { mckinleyHealth } from './mckinleyHealth';
import { safeWalks } from './safeWalks';
import { quadDay } from './quadDay';
import { arcVsCrce } from './arcVsCrce';

export const ARTICLES: Article[] = [
    dormSelection,
    mtdGuide,
    veoRide,
    registration101,
    graingerLibrary,
    greenStreetEats,
    mckinleyHealth,
    safeWalks,
    quadDay,
    arcVsCrce
];
