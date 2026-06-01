/**
 * @file ./src/components/housing/filter-modal/PriceSection.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import Slider from "rc-slider"
import React, {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"

import { HISTOGRAM_DATA, type ModalText } from "./modalText"

interface PriceSectionProps {
  t: ModalText
  priceLimits: [number, number]
  value: [number, number]
  onChange: (range: [number, number]) => void
  normalizeRange: (range: [number, number]) => [number, number]
}

const PriceSection: React.FC<PriceSectionProps> = ({
  t,
  priceLimits,
  value,
  onChange,
  normalizeRange,
}) => {
  const pendingRangeRef = useRef<[number, number] | null>(null)
  const frameRef = useRef<number | null>(null)
  const [minInput, setMinInput] = useState<string>(() => String(value[0]))
  const [maxInput, setMaxInput] = useState<string>(() => String(value[1]))
  const minEditingRef = useRef(false)
  const maxEditingRef = useRef(false)

  const flushPending = useCallback(() => {
    frameRef.current = null
    const pending = pendingRangeRef.current
    if (!pending) {
      return
    }
    pendingRangeRef.current = null
    onChange(pending)
  }, [onChange])

  const queueRangeChange = useCallback(
    (nextRange: [number, number]) => {
      pendingRangeRef.current = nextRange
      if (frameRef.current !== null) {
        return
      }
      frameRef.current = window.requestAnimationFrame(flushPending)
    },
    [flushPending]
  )

  const commitRangeChange = useCallback(
    (nextRange: [number, number]) => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      pendingRangeRef.current = null
      onChange(nextRange)
    },
    [onChange]
  )

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])

  useLayoutEffect(() => {
    if (!minEditingRef.current) {
      setMinInput(String(value[0]))
    }
    if (!maxEditingRef.current) {
      setMaxInput(String(value[1]))
    }
  }, [value])

  const commitMinInput = useCallback(
    (raw: string) => {
      const parsed = Number.parseInt(raw, 10)
      const nextMin = Number.isFinite(parsed) ? parsed : value[0]
      commitRangeChange(normalizeRange([nextMin, value[1]]))
    },
    [commitRangeChange, normalizeRange, value]
  )

  const commitMaxInput = useCallback(
    (raw: string) => {
      const parsed = Number.parseInt(raw, 10)
      const nextMax = Number.isFinite(parsed) ? parsed : value[1]
      commitRangeChange(normalizeRange([value[0], nextMax]))
    },
    [commitRangeChange, normalizeRange, value]
  )

  return (
    <section className="mb-8">
      <h3 className="mb-2 text-xl font-bold">{t.priceRange}</h3>
      <p className="mb-6 text-sm text-gray-500">{t.avgPrice}</p>

      <div className="mb-2 flex h-16 items-end gap-1 px-4">
        {HISTOGRAM_DATA.map((height, i) => (
          <div
            key={`item-${String(i)}`}
            className="flex-1 rounded-t-sm bg-gray-200 transition-colors duration-200"
            style={{
              height: `${height}%`,
              backgroundColor: i > 3 && i < 10 ? "#13294B" : "#E5E7EB",
            }}
          />
        ))}
      </div>

      <div className="mb-8 px-2">
        <Slider
          className="slider-modern"
          range
          min={priceLimits[0]}
          max={priceLimits[1]}
          step={100}
          value={value}
          onChange={(val) => {
            if (!Array.isArray(val) || val.length !== 2) {
              return
            }
            const next = normalizeRange([Number(val[0]), Number(val[1])])
            queueRangeChange(next)
          }}
          onChangeComplete={(val) => {
            if (!Array.isArray(val) || val.length !== 2) {
              return
            }
            const next = normalizeRange([Number(val[0]), Number(val[1])])
            commitRangeChange(next)
          }}
          trackStyle={[{ backgroundColor: "#13294B", height: 4 }]}
          railStyle={{ backgroundColor: "#E5E7EB", height: 4 }}
          handleStyle={[
            {
              borderColor: "#13294B",
              backgroundColor: "white",
              opacity: 1,
              boxShadow: "0 0 0 2px white, 0 0 0 3px #13294B",
              height: 22,
              width: 22,
              marginTop: -9,
            },
            {
              borderColor: "#13294B",
              backgroundColor: "white",
              opacity: 1,
              boxShadow: "0 0 0 2px white, 0 0 0 3px #13294B",
              height: 22,
              width: 22,
              marginTop: -9,
            },
          ]}
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="focus-within:border-illini-orange focus-within:ring-illini-orange hover:border-illini-orange flex-1 rounded-xl border border-gray-300 px-3 py-2 transition-colors focus-within:ring-2">
          <div className="text-xs text-gray-500">{t.minPrice}</div>
          <div className="flex items-center">
            <span className="text-lg">$</span>
            <input
              aria-label="Number input"
              type="number"
              step={100}
              value={minInput}
              onFocus={() => {
                minEditingRef.current = true
              }}
              onChange={(e) => {
                setMinInput(e.target.value)
              }}
              onBlur={(e) => {
                minEditingRef.current = false
                commitMinInput(e.target.value)
              }}
              onKeyDown={(e) => {
                if (e.key !== "Enter") {
                  return
                }
                commitMinInput((e.currentTarget as HTMLInputElement).value)
                e.currentTarget.blur()
              }}
              className="ml-1 w-full text-lg outline-none"
            />
          </div>
        </div>
        <div className="text-gray-400">-</div>
        <div className="focus-within:border-illini-orange focus-within:ring-illini-orange hover:border-illini-orange flex-1 rounded-xl border border-gray-300 px-3 py-2 transition-colors focus-within:ring-2">
          <div className="text-xs text-gray-500">{t.maxPrice}</div>
          <div className="flex items-center">
            <span className="text-lg">$</span>
            <input
              aria-label="Number input"
              type="number"
              step={100}
              value={maxInput}
              onFocus={() => {
                maxEditingRef.current = true
              }}
              onChange={(e) => {
                setMaxInput(e.target.value)
              }}
              onBlur={(e) => {
                maxEditingRef.current = false
                commitMaxInput(e.target.value)
              }}
              onKeyDown={(e) => {
                if (e.key !== "Enter") {
                  return
                }
                commitMaxInput((e.currentTarget as HTMLInputElement).value)
                e.currentTarget.blur()
              }}
              className="ml-1 w-full text-lg outline-none"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default memo(PriceSection)
