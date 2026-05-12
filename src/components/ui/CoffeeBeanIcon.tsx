'use client';

import { useId } from 'react';

interface Props {
  size?: number;
  className?: string;
}

/**
 * Золотое кофейное зерно, наклон вправо (как символ «Бин»).
 */
export default function CoffeeBeanIcon({ size = 14, className }: Props) {
  const uid = useId().replace(/:/g, '');
  const gradId = `bean-gold-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="35%" y1="15%" x2="65%" y2="85%">
          <stop offset="0%" stopColor="#e8a030" />
          <stop offset="45%" stopColor="#c55602" />
          <stop offset="100%" stopColor="#7a3d12" />
        </linearGradient>
      </defs>
      <ellipse
        cx="12"
        cy="12"
        rx="7"
        ry="10"
        fill={`url(#${gradId})`}
        transform="rotate(28 12 12)"
      />
      <path
        d="M8.2 9.5 Q12 12 15.8 14.5"
        fill="none"
        stroke="#4a3410"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.55"
        transform="rotate(28 12 12)"
      />
    </svg>
  );
}
