/**
 * @file ./src/components/housing/edit-panel/MediaTab.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, { useState } from "react"
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react"
import {
  type BathroomScope,
  type BedSize,
  type FloorPlan,
} from "../types/index"
import {
  BATHROOM_SCOPE_OPTIONS,
  getLocalizedLabel,
} from "../constants/metadata"
import {
  getStorageBathroomScope,
  normalizeFloorPlan,
} from "../../../utils/roomOptions"
import { EditableList, Field, Toggle, inputCls } from "./EditPanelFields"
import {
  type DormEditFormState,
  createFloorPlan,
  getLayoutKind,
} from "./useDormEditForm"

interface MediaTabProps {
  form: DormEditFormState
}

const hasPublishedPrice = (price: FloorPlan["price"]): price is number =>
  typeof price === "number" && Number.isFinite(price) && price > 0

/** Small thumbnail chip for an uploaded image URL */
const ImageChip: React.FC<{
  url: string
  onRemove: () => void
  onClick?: () => void
}> = ({ url, onRemove, onClick }) => (
  <div
    className="group relative size-16 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
    onClick={onClick}
  >
    <img src={url} alt="" className="size-full object-cover" />
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onRemove()
      }}
      className="absolute -top-1 -right-1 rounded-full bg-red-500 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
    >
      <X size={10} />
    </button>
  </div>
)

/** Multi-image field: shows chips + URL input + upload button */
const MultiImageField: React.FC<{
  label: string
  urls: string[]
  onChange: (urls: string[]) => void
  form: DormEditFormState
}> = ({ label, urls, onChange, form }) => {
  const [inputValue, setInputValue] = useState("")
  const { t } = form

  const addUrl = (url: string) => {
    const trimmed = url.trim()
    if (trimmed && !urls.includes(trimmed)) {
      onChange([...urls, trimmed])
    }
    setInputValue("")
  }

  return (
    <Field label={label}>
      {urls.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {urls.map((url, i) => (
            <ImageChip
              key={i}
              url={url}
              onRemove={() => onChange(urls.filter((_, idx) => idx !== i))}
            />
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addUrl(inputValue)
            }
          }}
          className={inputCls}
          placeholder="https://..."
        />
        <label className="flex shrink-0 cursor-pointer items-center justify-center gap-1 rounded-lg border border-gray-300 bg-gray-100 px-3 text-gray-700 transition-colors hover:bg-gray-200">
          {form.uploadingImage ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Upload size={14} />
          )}
          <span className="text-xs font-medium">{t.actions.upload}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                void form.uploadImage(e.target.files[0], (url) => {
                  onChange([...urls, url])
                })
              }
              e.target.value = ""
            }}
          />
        </label>
        {inputValue.trim() && (
          <button
            type="button"
            onClick={() => addUrl(inputValue)}
            className="bg-illini-blue flex shrink-0 items-center justify-center rounded-lg px-2 text-white"
          >
            <Plus size={14} />
          </button>
        )}
      </div>
    </Field>
  )
}

export const MediaTab: React.FC<MediaTabProps> = ({ form }) => {
  const { t } = form
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const toggleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx)
  }

  const moveFloorPlan = (fromIdx: number, toIdx: number) => {
    form.setFloorPlans((current) => {
      const arr = [...current]
      const [item] = arr.splice(fromIdx, 1)
      arr.splice(toIdx, 0, item)
      return arr
    })
    // Keep the moved item expanded
    setExpandedIndex(toIdx)
  }

  return (
    <>
      <Field label={t.labels.imageUrl}>
        <div className="flex gap-2">
          <input
            type="text"
            value={form.imageUrl || ""}
            onChange={(event) => form.setImageUrl(event.target.value)}
            className={inputCls}
            placeholder="https://..."
          />
          <label className="flex shrink-0 cursor-pointer items-center justify-center gap-1 rounded-lg border border-gray-300 bg-gray-100 px-3 text-gray-700 transition-colors hover:bg-gray-200">
            {form.uploadingImage ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            <span className="text-xs font-medium">{t.actions.upload}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                if (event.target.files?.[0]) {
                  void form.uploadImage(event.target.files[0], form.setImageUrl)
                }
                event.target.value = ""
              }}
            />
          </label>
        </div>
      </Field>
      <Field label={t.labels.galleryImages}>
        <EditableList
          items={form.galleryImages}
          onChange={form.setGalleryImages}
          placeholder={t.actions.addGalleryImage}
        />
      </Field>
      <Field label={t.labels.floorPlans}>
        <div className="space-y-2">
          {form.normalizedFloorPlans.map((plan, index) => {
            const layoutKind = getLayoutKind(plan)
            const scope =
              plan.bathroomScope ??
              getStorageBathroomScope(
                form.bathroomType,
                form.normalizedFloorPlans
              )
            const preview = form.getRoomDisplayLabel(
              {
                bedCount: plan.bedCount ?? null,
                bathroomCount: plan.bathroomCount ?? null,
                bathroomScope: scope,
                labelCode: plan.labelCode,
              },
              form.language
            )
            const update = (patch: Partial<FloorPlan>, renormalize = true) =>
              form.updateFloorPlan(index, (current) =>
                renormalize
                  ? normalizeFloorPlan(
                      { ...current, ...patch },
                      getStorageBathroomScope(
                        form.bathroomType,
                        form.normalizedFloorPlans
                      )
                    )
                  : ({ ...current, ...patch } as FloorPlan)
              )

            const isExpanded = expandedIndex === index

            // Multi-image arrays (fallback to legacy single)
            const photoUrls =
              plan.photoUrls ?? (plan.photoUrl ? [plan.photoUrl] : [])
            const imageUrls =
              plan.imageUrls ?? (plan.imageUrl ? [plan.imageUrl] : [])

            return (
              <div
                key={index}
                className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
              >
                {/* Collapsed header — always visible */}
                <div className="flex items-center gap-0">
                  {/* Reorder buttons — separate from toggle zone */}
                  <div className="flex shrink-0 flex-col border-r border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        if (index > 0) {
                          moveFloorPlan(index, index - 1)
                        }
                      }}
                      disabled={index === 0}
                      className="hover:text-illini-blue flex h-6 w-8 items-center justify-center text-gray-400 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-20"
                      title={form.language === "zh" ? "上移" : "Move up"}
                    >
                      <ChevronUp size={14} strokeWidth={2.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (index < form.normalizedFloorPlans.length - 1) {
                          moveFloorPlan(index, index + 1)
                        }
                      }}
                      disabled={index === form.normalizedFloorPlans.length - 1}
                      className="hover:text-illini-blue flex h-6 w-8 items-center justify-center text-gray-400 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-20"
                      title={form.language === "zh" ? "下移" : "Move down"}
                    >
                      <ChevronDown size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                  {/* Toggle expand zone */}
                  <div
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-3 py-2.5 transition-colors hover:bg-gray-100"
                    onClick={() => toggleExpand(index)}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-gray-500">
                        #{index + 1}
                      </span>
                      <div className="mt-0.5 min-w-0">
                        {plan.officialName && (
                          <div className="truncate text-xs font-semibold text-gray-700">
                            {plan.officialName}
                          </div>
                        )}
                        <span className="block truncate text-xs text-gray-400">
                          {preview}
                        </span>
                      </div>
                      {hasPublishedPrice(plan.price) && (
                        <span className="text-illini-blue ml-2 text-xs font-medium">
                          ${plan.price.toLocaleString()}/yr
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        form.setFloorPlans((current) =>
                          current.filter((_, i) => i !== index)
                        )
                        if (expandedIndex === index) {
                          setExpandedIndex(null)
                        } else if (
                          expandedIndex !== null &&
                          expandedIndex > index
                        ) {
                          setExpandedIndex(expandedIndex - 1)
                        }
                      }}
                      className="shrink-0 text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""} `}
                    />
                  </div>
                </div>

                {/* Expanded body */}
                {isExpanded && (
                  <div className="space-y-3 border-t border-gray-200 px-3 pt-1 pb-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Official Room Name">
                        <input
                          type="text"
                          value={plan.officialName ?? ""}
                          onChange={(event) =>
                            update(
                              {
                                officialName: event.target.value || undefined,
                              },
                              false
                            )
                          }
                          className={inputCls}
                          placeholder="e.g. East Double Standard Room"
                        />
                      </Field>
                      <Field label={t.labels.layoutKind}>
                        <select
                          value={layoutKind}
                          onChange={(event) =>
                            update(
                              {
                                type:
                                  event.target.value === "standard"
                                    ? undefined
                                    : (event.target.value as FloorPlan["type"]),
                                labelCode:
                                  event.target.value === "standard"
                                    ? undefined
                                    : event.target.value,
                              },
                              true
                            )
                          }
                          className={inputCls}
                        >
                          <option value="standard">{t.values.standard}</option>
                          <option value="Studio">{t.values.studio}</option>
                          <option value="Suite">{t.values.suite}</option>
                          <option value="Cluster">{t.values.cluster}</option>
                        </select>
                      </Field>
                      <Field label={t.labels.bathroomType}>
                        <select
                          value={scope}
                          onChange={(event) =>
                            update(
                              {
                                bathroomScope: event.target
                                  .value as BathroomScope,
                                bathroomCount:
                                  event.target.value === "communal"
                                    ? 0
                                    : (plan.bathroomCount ?? null),
                              },
                              true
                            )
                          }
                          className={inputCls}
                        >
                          {BATHROOM_SCOPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {getLocalizedLabel(option, form.language)}
                            </option>
                          ))}
                        </select>
                      </Field>
                      {layoutKind !== "Studio" && (
                        <Field label={t.labels.bedCount}>
                          <select
                            value={plan.bedCount ?? 1}
                            onChange={(event) =>
                              update(
                                {
                                  bedCount: Number(event.target.value),
                                },
                                true
                              )
                            }
                            className={inputCls}
                          >
                            {[1, 2, 3, 4, 5].map((count) => (
                              <option key={count} value={count}>
                                {count}
                              </option>
                            ))}
                          </select>
                        </Field>
                      )}
                      <Field label={t.labels.bathroomCount}>
                        <input
                          type="number"
                          min={0}
                          value={
                            scope === "communal"
                              ? 0
                              : (plan.bathroomCount ?? "")
                          }
                          onChange={(event) =>
                            update(
                              {
                                bathroomCount:
                                  event.target.value === ""
                                    ? null
                                    : Number(event.target.value),
                              },
                              true
                            )
                          }
                          className={inputCls}
                          disabled={scope === "communal"}
                        />
                      </Field>
                      <Field label={t.labels.pricePerYear}>
                        <input
                          type="number"
                          min={0}
                          value={plan.price ?? ""}
                          onChange={(event) =>
                            update(
                              {
                                price:
                                  event.target.value === ""
                                    ? undefined
                                    : Number(event.target.value),
                              },
                              false
                            )
                          }
                          className={inputCls}
                        />
                      </Field>
                      <Field label={t.labels.sqft}>
                        <input
                          type="number"
                          min={0}
                          value={plan.sqft ?? ""}
                          onChange={(event) =>
                            update(
                              {
                                sqft:
                                  event.target.value === ""
                                    ? undefined
                                    : Number(event.target.value),
                              },
                              false
                            )
                          }
                          className={inputCls}
                        />
                      </Field>
                      <Field label={t.labels.bedSize}>
                        <select
                          value={plan.bedSize ?? ""}
                          onChange={(event) =>
                            update(
                              {
                                bedSize:
                                  event.target.value === ""
                                    ? undefined
                                    : (event.target.value as BedSize),
                              },
                              false
                            )
                          }
                          className={inputCls}
                        >
                          <option value="">—</option>
                          <option value="Twin XL">Twin XL</option>
                          <option value="Full">Full</option>
                          <option value="Queen">Queen</option>
                          <option value="King">King</option>
                        </select>
                      </Field>
                    </div>
                    <Field label={t.labels.shortDescription}>
                      <input
                        type="text"
                        value={plan.description ?? ""}
                        onChange={(event) =>
                          update({ description: event.target.value }, false)
                        }
                        className={inputCls}
                      />
                    </Field>
                    <MultiImageField
                      label={
                        form.language === "zh"
                          ? "展示图（可多张）"
                          : "Room Photos"
                      }
                      urls={photoUrls}
                      onChange={(urls) =>
                        update(
                          {
                            photoUrls: urls.length > 0 ? urls : undefined,
                            photoUrl: undefined,
                          },
                          false
                        )
                      }
                      form={form}
                    />
                    <MultiImageField
                      label={
                        form.language === "zh"
                          ? "户型图（可多张）"
                          : "Floor Plans"
                      }
                      urls={imageUrls}
                      onChange={(urls) =>
                        update(
                          {
                            imageUrls: urls.length > 0 ? urls : undefined,
                            imageUrl: undefined,
                          },
                          false
                        )
                      }
                      form={form}
                    />
                    <Toggle
                      label={t.labels.available}
                      checked={plan.available !== false}
                      onChange={(value) => update({ available: value }, false)}
                    />
                  </div>
                )}
              </div>
            )
          })}
          <button
            type="button"
            onClick={() => {
              form.setFloorPlans((current) => [...current, createFloorPlan()])
              // Auto-expand the new plan
              setExpandedIndex(form.normalizedFloorPlans.length)
            }}
            className="text-illini-blue flex items-center gap-1 text-xs hover:underline"
          >
            <Plus size={12} /> {t.actions.addFloorPlan}
          </button>
        </div>
      </Field>
    </>
  )
}
