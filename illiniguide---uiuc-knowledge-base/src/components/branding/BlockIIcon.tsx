import React from 'react';

interface BlockIIconProps {
    className?: string;
}

export const BlockIIcon: React.FC<BlockIIconProps> = ({ className = 'text-lg' }) => (
    <span
        className={`select-none font-black leading-none tracking-[-0.06em] ${className}`}
        aria-hidden="true"
    >
        I
    </span>
);
