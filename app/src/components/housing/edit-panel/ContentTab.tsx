/**
 * @file ./src/components/housing/edit-panel/ContentTab.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React from "react"
import { RotateCcw } from "lucide-react"
import { LOCATION_PRESETS } from "../constants/metadata"
import { type DormEditFormState } from "./useDormEditForm"
import { EditableList, Field, inputCls } from "./EditPanelFields"

interface ContentTabProps {
  form: DormEditFormState
}

export const ContentTab: React.FC<ContentTabProps> = ({ form }) => {
  const { t } = form

  return (
    <>
      <div className="flex w-fit gap-1 rounded-lg bg-gray-100 p-1">
        {(["en", "zh"] as const).map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => form.setContentLang(lang)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              form.contentLang === lang
                ? "text-illini-blue bg-white shadow-sm"
                : `text-gray-500 hover:text-gray-700`
            } `}
          >
            {lang === "en" ? "English" : "中文"}
          </button>
        ))}
      </div>

      {form.contentLang === "en" ? (
        <>
          <Field label={t.labels.name}>
            <input
              aria-label="Input field"
              type="text"
              value={form.name}
              onChange={(event) => form.setName(event.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label={t.labels.description}>
            <textarea
              aria-label="Text input"
              rows={4}
              value={form.description}
              onChange={(event) => form.setDescription(event.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label={t.labels.location}>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {LOCATION_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      form.setLocation(preset.value)
                      form.setLocationZh(preset.zh)
                    }}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                      form.location === preset.value
                        ? `border-illini-blue bg-illini-blue text-white shadow-sm`
                        : `hover:border-illini-blue hover:text-illini-blue border-gray-300 bg-white text-gray-600`
                    } `}
                  >
                    {preset.en}
                  </button>
                ))}
              </div>
              <input
                aria-label="Input field"
                type="text"
                value={form.location}
                onChange={(event) => form.setLocation(event.target.value)}
                className={inputCls}
                placeholder={t.hints.customLocation}
              />
            </div>
          </Field>
          <Field label={t.labels.pros}>
            <EditableList
              items={form.pros}
              onChange={form.setPros}
              placeholder={t.actions.addPro}
            />
          </Field>
          <Field label={t.labels.cons}>
            <EditableList
              items={form.cons}
              onChange={form.setCons}
              placeholder={t.actions.addCon}
            />
          </Field>
        </>
      ) : (
        <>
          <Field label={t.labels.name}>
            <input
              aria-label="Input field"
              type="text"
              value={form.nameZh}
              onChange={(event) => form.setNameZh(event.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label={t.labels.description}>
            <textarea
              aria-label="Text input"
              rows={4}
              value={form.descriptionZh}
              onChange={(event) => form.setDescriptionZh(event.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label={t.labels.location}>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {LOCATION_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      form.setLocation(preset.value)
                      form.setLocationZh(preset.zh)
                    }}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                      form.locationZh === preset.zh
                        ? `border-illini-blue bg-illini-blue text-white shadow-sm`
                        : `hover:border-illini-blue hover:text-illini-blue border-gray-300 bg-white text-gray-600`
                    } `}
                  >
                    {preset.zh}
                  </button>
                ))}
              </div>
              <input
                aria-label="Input field"
                type="text"
                value={form.locationZh}
                onChange={(event) => form.setLocationZh(event.target.value)}
                className={inputCls}
                placeholder={t.hints.customLocation}
              />
            </div>
          </Field>
          <Field label={t.labels.pros}>
            <EditableList
              items={form.prosZh}
              onChange={form.setProsZh}
              placeholder={t.actions.addPro}
            />
          </Field>
          <Field label={t.labels.cons}>
            <EditableList
              items={form.consZh}
              onChange={form.setConsZh}
              placeholder={t.actions.addCon}
            />
          </Field>
        </>
      )}

      <hr className="border-gray-200" />
      <button
        type="button"
        onClick={form.reset}
        disabled={form.resetting}
        className="flex items-center gap-1.5 text-xs text-red-500 transition-colors hover:text-red-700 disabled:opacity-50"
      >
        <RotateCcw size={12} />
        {form.resetting ? t.actions.resetting : t.actions.reset}
      </button>
    </>
  )
}
