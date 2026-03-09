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
        <rect x="42" y="20" width="16" height="60" rx="2" />
    </svg>
);
