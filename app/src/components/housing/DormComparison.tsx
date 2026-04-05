/**
 * @file ./src/components/housing/DormComparison.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, { useState, useMemo, useEffect } from 'react'
import { Dorm, FloorPlan } from './types/index'
import { formatPrice } from './constants/pricing'
import { getHousingTypeMeta, getLocalizedLabel } from './constants/metadata'
import { Language } from '../../types'
import {
  X,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  BedSingle,
  Bath,
  SquareDashed,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  deriveRoomOptions,
  getRoomRangeSummary,
  normalizeFloorPlan,
  getBathroomScopeLabel,
  getRoomOptionLabels,
  getStorageBathroomScope,
} from '../../utils/roomOptions'

interface DormComparisonProps {
  dorms: Dorm[]
  onClose: () => void
  language?: Language
}

interface ComparisonRow {
  label: string
  getValue: (dorm: Dorm) => React.ReactNode
  highlightBest?: boolean
  bestCondition?: (dorm: Dorm) => boolean
}

const TEXT = {
  en: {
    title: 'Compare Dorms',
    close: 'Close',
    yes: 'Yes',
    no: 'No',
    urh: 'URH',
    pch: 'PCH',
    feature: 'Feature',
    bestOption: 'Best option',
    roomOptions: 'Room Options',
    bathroom: 'Bathroom',
    name: 'Name',
    location: 'Location',
    housingType: 'Housing Type',
    price: 'Price',
    ac: 'Air Conditioning',
    dining: 'Dining Hall',
  },
  zh: {
    title: '宿舍对比',
    close: '关闭',
    yes: '有',
    no: '无',
    urh: '校内宿舍',
    pch: '认证校外宿舍',
    feature: '项目',
    bestOption: '推荐项',
    roomOptions: '房型',
    bathroom: '卫浴',
    name: '名称',
    location: '位置',
    housingType: '住宿类型',
    price: '价格',
    ac: '空调',
    dining: '食堂',
  },
}

const hasPublishedPrice = (price: FloorPlan['price']): price is number =>
  typeof price === 'number' && Number.isFinite(price) && price > 0

const DormComparison: React.FC<DormComparisonProps> = ({
  dorms,
  onClose,
  language = 'en',
}) => {
  const t = TEXT[language]

  // Per-dorm selected floor plan index
  const [selectedPlanIdx, setSelectedPlanIdx] = useState<
    Record<string, number>
  >(() => {
    const init: Record<string, number> = {}
    dorms.forEach((d) => {
      init[d.id] = 0
    })
    return init
  })

  // Normalized floor plans per dorm
  const dormPlans = useMemo(() => {
    const map: Record<string, FloorPlan[]> = {}
    dorms.forEach((dorm) => {
      const defaultScope = getStorageBathroomScope(
        dorm.bathroomType,
        dorm.floorPlans
      )
      map[dorm.id] = (dorm.floorPlans ?? []).map((p) =>
        normalizeFloorPlan(p, p.bathroomScope ?? defaultScope)
      )
    })
    return map
  }, [dorms])

  const comparisonRows: ComparisonRow[] = [
    {
      label: t.name,
      getValue: (dorm) => {
        const dormName =
          language === 'zh' && dorm.name_zh ? dorm.name_zh : dorm.name
        return (
          <div className="gap-2 flex items-center">
            <img
              src={dorm.imageUrl}
              alt={dormName}
              className="h-10 w-10 rounded-lg object-cover"
            />
            <span className="text-base font-medium">{dormName}</span>
          </div>
        )
      },
    },
    {
      label: t.location,
      getValue: (dorm) => {
        const locationLabel =
          language === 'zh' && dorm.location_zh
            ? dorm.location_zh
            : dorm.location
        return <span className="text-sm text-gray-600">{locationLabel}</span>
      },
    },
    {
      label: t.housingType,
      getValue: (dorm) => {
        const housingTypeMeta = getHousingTypeMeta(dorm.housingType)
        return (
          <span
            className={`
              px-2 py-1 text-xs rounded-full
              ${housingTypeMeta.badgeClassName}
            `}
          >
            {getLocalizedLabel(housingTypeMeta, language)}
          </span>
        )
      },
    },
    {
      label: t.price,
      getValue: (dorm) => (
        <span className="font-bold text-illini-orange">
          {formatPrice(dorm.price)}
        </span>
      ),
      highlightBest: true,
      bestCondition: (dorm) => dorm.price <= 10000,
    },
    {
      label: t.ac,
      getValue: (dorm) =>
        dorm.ac ? (
          <span className="gap-1 text-sm text-green-600 flex items-center">
            <Check size={16} /> {t.yes}
          </span>
        ) : (
          <span className="gap-1 text-sm text-red-500 flex items-center">
            <AlertCircle size={16} /> {t.no}
          </span>
        ),
      highlightBest: true,
      bestCondition: (dorm) => dorm.ac,
    },
    {
      label: t.dining,
      getValue: (dorm) =>
        dorm.dining === 'inside' ? (
          <span className="gap-1 text-sm text-green-600 flex items-center">
            <Check size={16} /> {t.yes}
          </span>
        ) : (
          <span className="gap-1 text-sm text-red-500 flex items-center">
            <AlertCircle size={16} /> {t.no}
          </span>
        ),
      highlightBest: true,
      bestCondition: (dorm) => dorm.dining === 'inside',
    },
    {
      label: t.roomOptions,
      getValue: (dorm) => {
        const roomOptions =
          dorm.roomOptions ??
          deriveRoomOptions(dorm.floorPlans, dorm.bathroomType).roomOptions
        const roomSummary = getRoomRangeSummary(roomOptions, language)
        return (
          <span className="text-sm text-gray-700">
            {roomSummary.occupancyLabel}
          </span>
        )
      },
    },
    {
      label: t.bathroom,
      getValue: (dorm) => {
        const roomOptions =
          dorm.roomOptions ??
          deriveRoomOptions(dorm.floorPlans, dorm.bathroomType).roomOptions
        const roomSummary = getRoomRangeSummary(roomOptions, language)
        return (
          <span className="text-sm text-gray-600">
            {roomSummary.bathroomLabel}
          </span>
        )
      },
    },
  ]

  // Mobile: track which dorm card is active (for swipe navigation)
  const [mobileActiveIdx, setMobileActiveIdx] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Build floor plan detail rows (shared between mobile & desktop)
  const getFloorPlanRows = () => {
    const selectedPlans = dorms.map((dorm) => {
      const plans = dormPlans[dorm.id] ?? []
      const idx = selectedPlanIdx[dorm.id] ?? 0
      return plans[idx] ?? null
    })

    const planRows: {
      label: string
      icon?: React.ReactNode
      values: React.ReactNode[]
    }[] = [
      {
        label: language === 'zh' ? '房型' : 'Room Type',
        values: selectedPlans.map((plan) => {
          if (!plan) return '—'
          const opt = {
            bedCount: plan.bedCount ?? null,
            bathroomCount: plan.bathroomCount ?? null,
            bathroomScope: plan.bathroomScope ?? ('communal' as const),
            labelCode: plan.labelCode,
          }
          return (
            <span className="font-semibold text-gray-800">
              {plan.officialName ||
                getRoomOptionLabels(opt, language).primaryLabel}
            </span>
          )
        }),
      },
      {
        label: language === 'zh' ? '床位' : 'Beds',
        icon: <BedSingle className="h-3.5 w-3.5 text-gray-400" />,
        values: selectedPlans.map((plan) => {
          if (!plan) return '—'
          if (plan.bedSize) return plan.bedSize
          if (plan.bedCount != null)
            return `${plan.bedCount} ${language === 'zh' ? '张床' : plan.bedCount === 1 ? 'Bed' : 'Beds'}`
          return '—'
        }),
      },
      {
        label: language === 'zh' ? '卫浴' : 'Bathroom',
        icon: <Bath className="h-3.5 w-3.5 text-gray-400" />,
        values: selectedPlans.map((plan) => {
          if (!plan) return '—'
          const scope = plan.bathroomScope ?? 'communal'
          const scopeLabel = getBathroomScopeLabel(scope, language)
          if (plan.bathroomCount != null && plan.bathroomCount > 0) {
            return `${plan.bathroomCount} ${language === 'zh' ? '卫' : plan.bathroomCount === 1 ? 'Bath' : 'Baths'} · ${scopeLabel}`
          }
          return scopeLabel
        }),
      },
      {
        label: language === 'zh' ? '面积' : 'Area',
        icon: <SquareDashed className="h-3.5 w-3.5 text-gray-400" />,
        values: selectedPlans.map((plan) => {
          if (!plan?.sqft) return '—'
          return `${plan.sqft} sqft (~${Math.round(plan.sqft * 0.092903)}㎡)`
        }),
      },
      {
        label: language === 'zh' ? '年租金' : 'Annual Price',
        values: selectedPlans.map((plan) => {
          if (!plan) return '—'
          const p = hasPublishedPrice(plan.price) ? plan.price : null
          if (p != null)
            return (
              <span className="font-bold text-illini-orange">
                {formatPrice(p)}
              </span>
            )
          if (plan.available === false)
            return (
              <span className="text-red-500 text-[13px]">
                {language === 'zh' ? '暂不可订' : 'Sold out'}
              </span>
            )
          return '—'
        }),
      },
      {
        label: language === 'zh' ? '月租金' : 'Monthly',
        values: selectedPlans.map((plan) => {
          if (!plan) return '—'
          const p = hasPublishedPrice(plan.price) ? plan.price : null
          return p != null ? (
            <span className="font-semibold text-gray-700">
              ~{formatPrice(Math.round(p / 12))}
            </span>
          ) : (
            '—'
          )
        }),
      },
    ]

    const prices = selectedPlans.map((p) =>
      p && hasPublishedPrice(p.price) ? p.price : null
    )
    const validPrices = prices.filter((p): p is number => p !== null)
    const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : null

    return { planRows, prices, minPrice, validPrices }
  }

  if (dorms.length < 2) return null

  // ── Mobile: stacked card layout with swipe navigation ──
  const renderMobileView = () => {
    const activeDorm = dorms[mobileActiveIdx]
    const dormName = (d: Dorm) =>
      language === 'zh' && d.name_zh ? d.name_zh : d.name
    const hasFloorPlans = dorms.some((d) => (dormPlans[d.id]?.length ?? 0) > 0)
    const { planRows, prices, minPrice, validPrices } = getFloorPlanRows()

    return (
      <div className="px-4 pb-6 max-h-[calc(90vh-56px)] overflow-y-auto">
        {/* Dorm tab switcher */}
        <div className="top-0 gap-2 bg-white py-3 sticky z-10 flex items-center">
          <button
            type="button"
            onClick={() => setMobileActiveIdx((i) => Math.max(0, i - 1))}
            disabled={mobileActiveIdx === 0}
            className="
              h-8 w-8 bg-gray-100 flex shrink-0 items-center justify-center
              rounded-full
              disabled:opacity-30
            "
          >
            <ChevronLeft size={16} />
          </button>
          <div className="no-scrollbar gap-1.5 flex flex-1 overflow-x-auto">
            {dorms.map((d, i) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setMobileActiveIdx(i)}
                className={`
                  gap-1.5 px-3 py-1.5 text-xs font-medium flex shrink-0
                  items-center rounded-full whitespace-nowrap transition-colors
                  ${
                  i === mobileActiveIdx
                    ? 'bg-illini-blue text-white'
                    : 'bg-gray-100 text-gray-600'
                }
                `}
              >
                <img
                  src={d.imageUrl}
                  alt={dormName(d)}
                  className="h-5 w-5 rounded-full object-cover"
                />
                {dormName(d)}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setMobileActiveIdx((i) => Math.min(dorms.length - 1, i + 1))
            }
            disabled={mobileActiveIdx === dorms.length - 1}
            className="
              h-8 w-8 bg-gray-100 flex shrink-0 items-center justify-center
              rounded-full
              disabled:opacity-30
            "
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Page indicator dots */}
        <div className="gap-1.5 pb-3 flex justify-center">
          {dorms.map((_, i) => (
            <div
              key={i}
              className={`
                h-1.5 w-1.5 rounded-full transition-colors
                ${i === mobileActiveIdx ? `bg-illini-blue` : `bg-gray-300`}
              `}
            />
          ))}
        </div>

        {/* Active dorm card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeDorm.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="
              rounded-2xl border-gray-200 bg-white shadow-sm overflow-hidden
              border
            "
          >
            {/* Dorm header */}
            <div className="
              gap-3 border-gray-200 bg-gray-50 p-4 flex items-center border-b
            ">
              <img
                src={activeDorm.imageUrl}
                alt={dormName(activeDorm)}
                className="h-12 w-12 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-gray-900 truncate">
                  {dormName(activeDorm)}
                </h3>
                <p className="text-xs text-gray-500 truncate">
                  {language === 'zh' && activeDorm.location_zh
                    ? activeDorm.location_zh
                    : activeDorm.location}
                </p>
              </div>
            </div>

            {/* Basic info rows */}
            <div className="divide-gray-100 divide-y">
              {comparisonRows.slice(2).map((row) => {
                const isBest = row.bestCondition?.(activeDorm)
                return (
                  <div
                    key={row.label}
                    className={`
                      px-4 py-3 flex items-center justify-between
                      ${isBest ? `bg-emerald-50/60` : ''}
                    `}
                  >
                    <span className="text-sm text-gray-600 shrink-0">
                      {row.label}
                    </span>
                    <div className="text-sm text-right">
                      {row.getValue(activeDorm)}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Floor plan section */}
            {hasFloorPlans &&
              (dormPlans[activeDorm.id]?.length ?? 0) > 0 &&
              (() => {
                const plans = dormPlans[activeDorm.id] ?? []
                const di = dorms.indexOf(activeDorm)
                const currentIdx = selectedPlanIdx[activeDorm.id] ?? 0

                return (
                  <div className="border-gray-100 border-t-4">
                    <div className="
                      border-gray-200 bg-gray-50 px-4 py-3 border-b
                    ">
                      <h4 className="text-sm font-bold text-gray-900">
                        {language === 'zh' ? '房型详情' : 'Floor Plan'}
                      </h4>
                    </div>
                    <div className="border-gray-100 px-4 py-3 border-b">
                      <div className="relative">
                        <select
                          value={currentIdx}
                          onChange={(e) =>
                            setSelectedPlanIdx((prev) => ({
                              ...prev,
                              [activeDorm.id]: Number(e.target.value),
                            }))
                          }
                          className="
                            rounded-lg border-gray-200 bg-white px-3 py-2.5 pr-8
                            text-sm font-medium text-gray-800
                            focus:ring-illini-blue/30
                            w-full appearance-none border
                            focus:ring-2 focus:outline-none
                          "
                        >
                          {plans.map((plan, i) => {
                            const opt = {
                              bedCount: plan.bedCount ?? null,
                              bathroomCount: plan.bathroomCount ?? null,
                              bathroomScope:
                                plan.bathroomScope ?? ('communal' as const),
                              labelCode: plan.labelCode,
                            }
                            const label =
                              plan.officialName ||
                              getRoomOptionLabels(opt, language).primaryLabel
                            const price = hasPublishedPrice(plan.price)
                              ? ` · ${formatPrice(plan.price)}`
                              : ''
                            return (
                              <option key={i} value={i}>
                                {label}
                                {price}
                              </option>
                            )
                          })}
                        </select>
                        <ChevronDown className="
                          right-2.5 h-4 w-4 text-gray-400 pointer-events-none
                          absolute top-1/2 -translate-y-1/2
                        " />
                      </div>
                    </div>
                    <div className="divide-gray-100 divide-y">
                      {planRows.map((row, ri) => {
                        const isAnnualPrice =
                          row.label ===
                          (language === 'zh' ? '年租金' : 'Annual Price')
                        const isCheapest =
                          isAnnualPrice &&
                          minPrice !== null &&
                          prices[di] === minPrice &&
                          validPrices.length > 1
                        return (
                          <div
                            key={ri}
                            className={`
                              px-4 py-3 flex items-center justify-between
                              ${isCheapest ? `bg-emerald-50/60` : ''}
                            `}
                          >
                            <div className="
                              gap-1.5 text-sm text-gray-600 flex shrink-0
                              items-center
                            ">
                              {row.icon}
                              <span>{row.label}</span>
                            </div>
                            <div className="text-sm text-right">
                              {row.values[di]}
                              {isCheapest && (
                                <span className="
                                  ml-1.5 bg-emerald-100 px-1.5 py-0.5
                                  font-medium text-emerald-700 rounded-full
                                  text-[10px]
                                ">
                                  {language === 'zh' ? '最低' : 'Lowest'}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  // ── Desktop: original table layout ──
  const renderDesktopView = () => {
    const { planRows, prices, minPrice, validPrices } = getFloorPlanRows()

    return (
      <div className="max-h-[calc(85vh-72px)] overflow-x-auto overflow-y-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="
                left-0 border-gray-200 bg-gray-50 px-4 py-3 text-sm
                font-semibold text-gray-700 sticky z-10 border-r border-b
                text-left
              ">
                {t.feature}
              </th>
              {dorms.map((dorm) => {
                const dormName =
                  language === 'zh' && dorm.name_zh ? dorm.name_zh : dorm.name
                return (
                  <th
                    key={dorm.id}
                    className="
                      border-gray-200 px-4 py-3 text-sm font-semibold
                      text-gray-700 min-w-[220px] border-b text-left
                    "
                  >
                    <div className="gap-2 flex items-center">
                      <img
                        src={dorm.imageUrl}
                        alt={dormName}
                        className="h-8 w-8 rounded-sm object-cover"
                      />
                      <span className="text-base truncate">{dormName}</span>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row, rowIndex) => (
              <tr
                key={row.label}
                className={rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
              >
                <td className="
                  left-0 border-gray-200 px-4 py-4 text-sm font-medium
                  text-gray-700 sticky z-10 border-r border-b bg-inherit
                ">
                  <div className="gap-2 flex items-center">
                    <span>{row.label}</span>
                    {row.highlightBest && (
                      <span className="
                        bg-emerald-100 px-1.5 py-0.5 text-emerald-700
                        rounded-full text-[10px]
                      ">
                        {t.bestOption}
                      </span>
                    )}
                  </div>
                </td>
                {dorms.map((dorm) => {
                  const isBest = row.bestCondition?.(dorm)
                  return (
                    <td
                      key={`${row.label}-${dorm.id}`}
                      className={`
                        border-gray-200 px-4 py-4 text-sm border-b align-top
                        ${
                        isBest ? 'bg-emerald-50/60' : ''
                      }
                      `}
                    >
                      {row.getValue(dorm)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Cross-dorm floor plan comparison ── */}
        {dorms.some((d) => (dormPlans[d.id]?.length ?? 0) > 0) && (
          <div className="border-gray-100 border-t-4">
            <div className="
              border-gray-200 bg-gray-50 px-4 py-4
              md:px-6
              border-b
            ">
              <h3 className="
                font-bold text-gray-900
                md:text-base
                text-[15px]
              ">
                {language === 'zh' ? '房型对比' : 'Floor Plan Comparison'}
              </h3>
              <p className="
                mt-0.5 text-gray-500
                md:text-[13px]
                text-[12px]
              ">
                {language === 'zh'
                  ? '选择每个宿舍的房型进行对比'
                  : 'Select a floor plan from each dorm to compare'}
              </p>
            </div>

            {/* Plan selectors */}
            <div
              className="border-gray-200 grid border-b"
              style={{
                gridTemplateColumns: `140px repeat(${dorms.length}, 1fr)`,
              }}
            >
              <div className="
                border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium
                text-gray-500 flex items-center border-r
              ">
                {language === 'zh' ? '选择房型' : 'Select Plan'}
              </div>
              {dorms.map((dorm) => {
                const plans = dormPlans[dorm.id] ?? []
                if (plans.length === 0) {
                  return (
                    <div
                      key={dorm.id}
                      className="
                        border-gray-200 px-3 py-3 text-sm text-gray-400 flex
                        items-center border-r italic
                        last:border-r-0
                      "
                    >
                      {language === 'zh' ? '暂无房型' : 'No plans'}
                    </div>
                  )
                }
                const currentIdx = selectedPlanIdx[dorm.id] ?? 0
                return (
                  <div
                    key={dorm.id}
                    className="
                      border-gray-200 px-3 py-3 border-r
                      last:border-r-0
                    "
                  >
                    <div className="relative">
                      <select
                        value={currentIdx}
                        onChange={(e) =>
                          setSelectedPlanIdx((prev) => ({
                            ...prev,
                            [dorm.id]: Number(e.target.value),
                          }))
                        }
                        className="
                          rounded-lg border-gray-200 bg-white px-3 py-2 pr-8
                          font-medium text-gray-800
                          focus:border-illini-blue focus:ring-illini-blue/30
                          w-full cursor-pointer appearance-none border
                          text-[13px]
                          focus:ring-2 focus:outline-none
                        "
                      >
                        {plans.map((plan, i) => {
                          const opt = {
                            bedCount: plan.bedCount ?? null,
                            bathroomCount: plan.bathroomCount ?? null,
                            bathroomScope:
                              plan.bathroomScope ?? ('communal' as const),
                            labelCode: plan.labelCode,
                          }
                          const label =
                            plan.officialName ||
                            getRoomOptionLabels(opt, language).primaryLabel
                          const price = hasPublishedPrice(plan.price)
                            ? ` · ${formatPrice(plan.price)}`
                            : ''
                          return (
                            <option key={i} value={i}>
                              {label}
                              {price}
                            </option>
                          )
                        })}
                      </select>
                      <ChevronDown className="
                        right-2.5 h-4 w-4 text-gray-400 pointer-events-none
                        absolute top-1/2 -translate-y-1/2
                      " />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Plan comparison rows */}
            <table className="w-full min-w-[760px] border-collapse">
              <tbody>
                {planRows.map((row, ri) => (
                  <tr
                    key={ri}
                    className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="
                      left-0 border-gray-200 px-4 py-3 text-sm font-medium
                      text-gray-600 sticky z-10 w-[140px] border-r border-b
                      bg-inherit
                    ">
                      <div className="gap-1.5 flex items-center">
                        {row.icon}
                        <span>{row.label}</span>
                      </div>
                    </td>
                    {row.values.map((val, ci) => {
                      const isAnnualPrice =
                        row.label ===
                        (language === 'zh' ? '年租金' : 'Annual Price')
                      const isCheapest =
                        isAnnualPrice &&
                        minPrice !== null &&
                        prices[ci] === minPrice &&
                        validPrices.length > 1
                      return (
                        <td
                          key={ci}
                          className={`
                            border-gray-200 px-4 py-3 text-sm border-b
                            ${isCheapest ? `bg-emerald-50/60` : ''}
                          `}
                        >
                          {val}
                          {isCheapest && (
                            <span className="
                              ml-1.5 bg-emerald-100 px-1.5 py-0.5 font-medium
                              text-emerald-700 rounded-full text-[10px]
                            ">
                              {language === 'zh' ? '最低' : 'Lowest'}
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="inset-0 fixed z-3000 flex items-end justify-center"
        style={{ pointerEvents: 'auto' }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="inset-0 bg-black/30 absolute"
          onClick={onClose}
        />

        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="
            max-w-4xl rounded-t-3xl bg-white shadow-2xl
            md:max-h-[85vh]
            relative max-h-[90vh] w-full overflow-hidden
          "
          style={{ pointerEvents: 'auto' }}
        >
          <div className="
            top-0 border-gray-200 bg-white px-4 py-3
            md:px-6 md:py-4
            sticky z-10 flex items-center justify-between border-b
          ">
            <h2 className="
              text-base font-bold text-gray-900
              md:text-lg
            ">
              {t.title}
            </h2>
            <button
              onClick={onClose}
              type="button"
              className="
                h-8 w-8 bg-gray-100
                hover:bg-gray-200
                flex items-center justify-center rounded-full transition-colors
              "
              aria-label={t.close}
            >
              <X size={18} className="text-gray-600" />
            </button>
          </div>

          {isMobile ? renderMobileView() : renderDesktopView()}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default DormComparison
