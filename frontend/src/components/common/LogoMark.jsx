import { useId } from "react";

const LogoMark = ({ className = "" }) => {
  const gradientId = useId();

  return (
    <span className={`logo-mark ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 48 48" focusable="false">
        <defs>
          <linearGradient id={gradientId} x1="8" x2="40" y1="6" y2="42">
            <stop offset="0" stopColor="#14b8a6" />
            <stop offset="1" stopColor="#2563eb" />
          </linearGradient>
        </defs>
        <path
          className="logo-mark-page"
          d="M15 6h14.5L39 15.5V39a3 3 0 0 1-3 3H15a6 6 0 0 1-6-6V12a6 6 0 0 1 6-6Z"
          fill={`url(#${gradientId})`}
        />
        <path className="logo-mark-fold" d="M29 6v9a2 2 0 0 0 2 2h8" />
        <path
          className="logo-mark-d"
          d="M17 17h7.5a7.5 7.5 0 0 1 0 15H17V17Zm5 5v5h2.5a2.5 2.5 0 0 0 0-5H22Z"
        />
        <path className="logo-mark-spark" d="M33.5 25.5 35 29l3.5 1.5L35 32l-1.5 3.5L32 32l-3.5-1.5L32 29l1.5-3.5Z" />
      </svg>
    </span>
  );
};

export default LogoMark;
