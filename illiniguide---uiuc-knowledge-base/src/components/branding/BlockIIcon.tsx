import React from 'react';

interface BlockIIconProps {
    className?: string;
}

export const BlockIIcon: React.FC<BlockIIconProps> = ({ className = 'h-5 w-5' }) => (
    <svg
        viewBox="0 0 100 100"
        fill="currentColor"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        <rect x="14" y="12" width="72" height="14" />
        <rect x="39" y="26" width="22" height="48" />
        <rect x="14" y="74" width="72" height="14" />
    </svg>
);
