/**
 * @file ./src/components/housing/dorm-list/FavoriteFlyEffect.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React from "react";
import { motion } from "framer-motion";
import { DEFAULT_FAVORITES_TARGET } from "./favoriteConstants";

const FAVORITES_HEART_SCALE = 12 / 24;

interface FavoriteFlyEffectProps {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  onComplete: () => void;
}

export const FavoriteFlyEffect: React.FC<FavoriteFlyEffectProps> = ({
  startX,
  startY,
  targetX,
  targetY,
  onComplete,
}) => (
  <motion.div
    className="pointer-events-none fixed top-0 left-0 z-100 origin-center"
    initial={{ x: startX, y: startY, scale: 1 }}
    animate={{
      x: targetX ?? DEFAULT_FAVORITES_TARGET.x,
      y: targetY ?? DEFAULT_FAVORITES_TARGET.y,
      scale: FAVORITES_HEART_SCALE,
    }}
    transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
    onAnimationComplete={onComplete}
    style={{ willChange: "transform" }}
  >
    <div className="-translate-1/2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="size-6 text-red-500 drop-shadow-md"
      >
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
      </svg>
    </div>
  </motion.div>
);
