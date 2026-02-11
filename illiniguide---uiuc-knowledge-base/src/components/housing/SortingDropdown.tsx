import React, { memo, useRef, useEffect, useState } from 'react';
import { ArrowUpDown, Check } from 'lucide-react';

interface SortingDropdownProps {
    sortBy: string;
    onSortChange: (value: string) => void;
    viewMode: 'list' | 'map';
}

const SORT_OPTIONS = [
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
    { value: 'price-asc', label: 'Price (Low-High)' },
    { value: 'price-desc', label: 'Price (High-Low)' },
] as const;

const SortingDropdown: React.FC<SortingDropdownProps> = memo(({ sortBy, onSortChange, viewMode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const previousViewModeRef = useRef<'list' | 'map' | null>(null);

    useEffect(() => {
        // Close dropdown if view mode changes
        if (previousViewModeRef.current !== null && previousViewModeRef.current !== viewMode) {
            setIsOpen(false);
        }
        previousViewModeRef.current = viewMode;
    }, [viewMode]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentLabel = SORT_OPTIONS.find((option) => option.value === sortBy)?.label || 'Sort';

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                type="button"
                className={`flex items-center justify-center p-2.5 rounded-full border transition-all ${isOpen
                        ? 'border-black bg-gray-50 text-black'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-black hover:text-black'
                    }`}
                title={`Sort by: ${currentLabel}`}
            >
                <ArrowUpDown size={18} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    {SORT_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => {
                                onSortChange(option.value);
                                setIsOpen(false);
                            }}
                            type="button"
                            className="w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                        >
                            <span className={sortBy === option.value ? 'font-medium text-black' : 'text-gray-600'}>
                                {option.label}
                            </span>
                            {sortBy === option.value && <Check size={14} className="text-black" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    return prevProps.sortBy === nextProps.sortBy &&
        prevProps.onSortChange === nextProps.onSortChange &&
        prevProps.viewMode === nextProps.viewMode; // Changed: viewMode might matter for closing
});

SortingDropdown.displayName = 'SortingDropdown';

export default SortingDropdown;
