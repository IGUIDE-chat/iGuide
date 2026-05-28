/**
 * @file ./src/components/housing/filter-modal/HousingTypeSection.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, { memo } from "react";
import {
  HOUSING_TYPE_OPTIONS,
  getHousingTypeMeta,
  getLocalizedLabel,
} from "../constants/metadata";
import { type FilterLanguage } from "./modalText";

interface HousingTypeSectionProps {
  title: string;
  language: FilterLanguage;
  value: "ALL" | "URH" | "PCH";
  onChange: (value: "ALL" | "URH" | "PCH") => void;
}

const HousingTypeSection: React.FC<HousingTypeSectionProps> = ({
  title,
  language,
  value,
  onChange,
}) => (
  <section className="mb-8">
    <h3 className="mb-6 text-xl font-bold">{title}</h3>
    <div
      className="
        grid grid-cols-1 gap-4
        md:grid-cols-2
      "
    >
      {HOUSING_TYPE_OPTIONS.map((option) => {
        const meta = getHousingTypeMeta(option.value);
        const selected = value === option.value;
        const accentClass =
          option.value === "URH"
            ? "border-illini-orange bg-illini-orange/10 ring-1 ring-illini-orange"
            : "border-illini-blue bg-blue-50/50 ring-1 ring-illini-blue";
        const hoverClass =
          option.value === "URH"
            ? "border-gray-200 hover:border-illini-orange hover:bg-illini-orange/10 active:border-illini-orange active:bg-illini-orange/10"
            : "border-gray-200 hover:border-illini-blue hover:bg-blue-50/50 active:border-illini-blue active:bg-blue-50/50";
        const checkboxClass =
          option.value === "URH"
            ? "accent-illini-orange"
            : "accent-illini-blue";

        return (
          <label
            key={option.value}
            className={`
              flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4
              transition-colors duration-200
              ${selected ? accentClass : hoverClass}
            `}
          >
            <input
              type="checkbox"
              className={`
                size-5 rounded-md
                ${checkboxClass}
              `}
              checked={selected}
              onChange={() => onChange(selected ? "ALL" : option.value)}
            />
            <div>
              <div className="font-bold">
                {getLocalizedLabel(option, language)}
              </div>
              <div className="text-sm text-gray-500">
                {getLocalizedLabel(meta.description, language)}
              </div>
            </div>
          </label>
        );
      })}
    </div>
  </section>
);

export default memo(HousingTypeSection);
