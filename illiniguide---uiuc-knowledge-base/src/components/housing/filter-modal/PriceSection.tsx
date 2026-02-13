import React, { memo, useCallback, useEffect, useRef } from 'react';
import Slider from 'rc-slider';
import { HISTOGRAM_DATA, ModalText } from './modalText';

interface PriceSectionProps {
    t: ModalText;
    priceLimits: [number, number];
    value: [number, number];
    onChange: (range: [number, number]) => void;
    normalizeRange: (range: [number, number]) => [number, number];
}

const PriceSection: React.FC<PriceSectionProps> = ({
    t,
    priceLimits,
    value,
    onChange,
    normalizeRange
}) => {
    const pendingRangeRef = useRef<[number, number] | null>(null);
    const frameRef = useRef<number | null>(null);

    const flushPending = useCallback(() => {
        frameRef.current = null;
        const pending = pendingRangeRef.current;
        if (!pending) return;
        pendingRangeRef.current = null;
        onChange(pending);
    }, [onChange]);

    const queueRangeChange = useCallback(
        (nextRange: [number, number]) => {
            pendingRangeRef.current = nextRange;
            if (frameRef.current !== null) return;
            frameRef.current = window.requestAnimationFrame(flushPending);
        },
        [flushPending]
    );

    const commitRangeChange = useCallback(
        (nextRange: [number, number]) => {
            if (frameRef.current !== null) {
                window.cancelAnimationFrame(frameRef.current);
                frameRef.current = null;
            }
            pendingRangeRef.current = null;
            onChange(nextRange);
        },
        [onChange]
    );

    useEffect(() => {
        return () => {
            if (frameRef.current !== null) {
                window.cancelAnimationFrame(frameRef.current);
            }
        };
    }, []);

    return (
        <section className="mb-8">
            <h3 className="text-xl font-bold mb-2">{t.priceRange}</h3>
            <p className="text-sm text-gray-500 mb-6">{t.avgPrice}</p>

            <div className="h-16 flex items-end gap-1 px-4 mb-2">
                {HISTOGRAM_DATA.map((height, i) => (
                    <div
                        key={i}
                        className="flex-1 bg-gray-200 rounded-t-sm transition-colors duration-200"
                        style={{
                            height: `${height}%`,
                            backgroundColor: i > 3 && i < 10 ? '#13294B' : '#E5E7EB'
                        }}
                    />
                ))}
            </div>

            <div className="px-2 mb-8">
                <Slider
                    className="slider-modern"
                    range
                    min={priceLimits[0]}
                    max={priceLimits[1]}
                    step={100}
                    value={value}
                    onChange={(val) => {
                        if (!Array.isArray(val) || val.length !== 2) return;
                        const next = normalizeRange([Number(val[0]), Number(val[1])]);
                        queueRangeChange(next);
                    }}
                    onChangeComplete={(val) => {
                        if (!Array.isArray(val) || val.length !== 2) return;
                        const next = normalizeRange([Number(val[0]), Number(val[1])]);
                        commitRangeChange(next);
                    }}
                    trackStyle={[{ backgroundColor: '#13294B', height: 4 }]}
                    railStyle={{ backgroundColor: '#E5E7EB', height: 4 }}
                    handleStyle={[
                        {
                            borderColor: '#13294B',
                            backgroundColor: 'white',
                            opacity: 1,
                            boxShadow: '0 0 0 2px white, 0 0 0 3px #13294B',
                            height: 22,
                            width: 22,
                            marginTop: -9
                        },
                        {
                            borderColor: '#13294B',
                            backgroundColor: 'white',
                            opacity: 1,
                            boxShadow: '0 0 0 2px white, 0 0 0 3px #13294B',
                            height: 22,
                            width: 22,
                            marginTop: -9
                        }
                    ]}
                />
            </div>

            <div className="flex items-center gap-4">
                <div className="border border-gray-300 rounded-xl px-3 py-2 flex-1 hover:border-illini-orange focus-within:ring-2 focus-within:ring-illini-orange focus-within:border-illini-orange transition-colors">
                    <div className="text-xs text-gray-500">{t.minPrice}</div>
                    <div className="flex items-center">
                        <span className="text-lg">$</span>
                        <input
                            type="number"
                            step={100}
                            value={value[0]}
                            onChange={(e) => {
                                const numeric = Number.parseInt(e.target.value, 10);
                                const minValue = Number.isFinite(numeric) ? numeric : priceLimits[0];
                                commitRangeChange(normalizeRange([minValue, value[1]]));
                            }}
                            className="w-full outline-none text-lg ml-1"
                        />
                    </div>
                </div>
                <div className="text-gray-400">-</div>
                <div className="border border-gray-300 rounded-xl px-3 py-2 flex-1 hover:border-illini-orange focus-within:ring-2 focus-within:ring-illini-orange focus-within:border-illini-orange transition-colors">
                    <div className="text-xs text-gray-500">{t.maxPrice}</div>
                    <div className="flex items-center">
                        <span className="text-lg">$</span>
                        <input
                            type="number"
                            step={100}
                            value={value[1]}
                            onChange={(e) => {
                                const numeric = Number.parseInt(e.target.value, 10);
                                const maxValue = Number.isFinite(numeric) ? numeric : priceLimits[1];
                                commitRangeChange(normalizeRange([value[0], maxValue]));
                            }}
                            className="w-full outline-none text-lg ml-1"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default memo(PriceSection);
