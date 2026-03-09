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
        <path d="M14 12 h72 v16 h-23 v44 h23 v16 h-72 v-16 h23 v-44 h-23 z" />
    </svg>
);
