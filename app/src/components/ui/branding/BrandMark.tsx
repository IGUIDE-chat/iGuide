/**
 * @file ./src/components/ui/branding/BrandMark.tsx
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React from "react";
import { BlockIIcon } from "./BlockIIcon";

interface BrandMarkProps {
  className?: string;
  iconClassName?: string;
}

export const BrandMark: React.FC<BrandMarkProps> = ({
  className = "h-10 w-10 rounded-xl",
  iconClassName = "text-lg",
}) => (
  <div
    className={`
      flex items-center justify-center bg-illini-orange text-white shadow-sm
      ${className}
    `}
    aria-hidden="true"
  >
    <BlockIIcon className={iconClassName} />
  </div>
);
