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
        <rect x="44" y="24" width="12" height="52" rx="1.5" />
    </svg>
);
