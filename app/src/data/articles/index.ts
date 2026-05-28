/**
 * @file ./src/data/articles/index.ts
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

// [DATA] Exports all articles as a single collection.
// [数据] 导出所有文章为单一集合。
import { type Article } from "../../types";
import { dormSelection } from "./dormSelection";
import { mtdGuide } from "./mtdGuide";
import { veoRide } from "./veoRide";
import { registration101 } from "./registration101";
import { graingerLibrary } from "./graingerLibrary";
import { greenStreetEats } from "./greenStreetEats";
import { mckinleyHealth } from "./mckinleyHealth";
import { safeWalks } from "./safeWalks";
import { quadDay } from "./quadDay";
import { arcVsCrce } from "./arcVsCrce";

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
  arcVsCrce,
];
