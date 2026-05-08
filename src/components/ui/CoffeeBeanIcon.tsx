interface Props {
  size?: number;
  className?: string;
}

/** Компактное кофейное зерно рядом с числовой «ценой» в бонусах */
export default function CoffeeBeanIcon({ size = 14, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
    >
      <ellipse
        cx="12"
        cy="12"
        rx="7"
        ry="10"
        fill="currentColor"
        transform="rotate(-26 12 12)"
      />
      <path
        d="M8.2 9.5 Q12 12 15.8 14.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.4"
        transform="rotate(-26 12 12)"
      />
    </svg>
  );
}
