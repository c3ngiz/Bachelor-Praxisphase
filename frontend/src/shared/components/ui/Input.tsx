import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export default function Input({ label, error, className = "", id, ...props }: Props) {
  const inputId = id ?? props.name;

  return (
    <div className="w-full space-y-1.5">
      {label ? (
        <label htmlFor={inputId} className="block text-sm font-medium text-(--fg)">
          {label}
        </label>
      ) : null}

      <input
        id={inputId}
        className={[
          "w-full rounded-lg border bg-(--bg-elevated) px-3 py-2 text-sm text-(--fg)",
          "placeholder:text-(--fg-muted)",
          "border-(--border) focus:border-(--accent) focus:outline-none",
          className,
        ].join(" ")}
        {...props}
      />

      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}