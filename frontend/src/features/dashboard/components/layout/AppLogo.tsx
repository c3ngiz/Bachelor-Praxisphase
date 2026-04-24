type Props = {
  className?: string;
  labelClassName?: string;
  name?: string;
};

/**
 * AppLogo component.
 */
export default function AppLogo({
  className = "",
  labelClassName = "",
  name = "DocFlow",
}: Props) {
  return (
    <div className={["flex min-w-0 items-center gap-3", className].join(" ")}>
      <div className="relative h-9 w-9 shrink-0">
        <svg
          viewBox="0 0 40 40"
          className="h-full w-full"
          aria-hidden="true"
          fill="none"
        >
          <defs>
            <linearGradient id="docflow-gradient" x1="6" y1="6" x2="34" y2="34">
              <stop offset="0%" stopColor="#AEAFCA" />
              <stop offset="100%" stopColor="#4943BE" />
            </linearGradient>
          </defs>

          {/* base */}
          <rect
            x="4"
            y="4"
            width="32"
            height="32"
            rx="10"
            fill="url(#docflow-gradient)"
          />

          {/* document shape */}
          <rect
            x="11"
            y="10"
            width="14"
            height="18"
            rx="3"
            fill="white"
            fillOpacity="0.96"
          />

          {/* flow line */}
          <path
            d="M13.5 21 C16 17, 20 25, 23.5 19"
            stroke="#4943BE"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* subtle secondary page */}
          <path
            d="M22 11H25C26.6569 11 28 12.3431 28 14V25C28 26.6569 26.6569 28 25 28H17"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <span
        className={[
          "truncate text-lg font-semibold tracking-tight text-(--fg)",
          labelClassName,
        ].join(" ")}
      >
        {name}
      </span>
    </div>
  );
}
