import React from 'react';
import { BlockIIcon } from './BlockIIcon';

interface BrandMarkProps {
    className?: string;
    iconClassName?: string;
}

export const BrandMark: React.FC<BrandMarkProps> = ({
    className = 'h-10 w-10 rounded-xl',
    iconClassName = 'text-lg',
}) => (
    <div
        className={`flex items-center justify-center bg-illini-orange text-white shadow-sm ${className}`}
        aria-hidden="true"
    >
        <BlockIIcon className={iconClassName} />
    </div>
);
