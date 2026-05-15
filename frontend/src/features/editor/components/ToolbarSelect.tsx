/** Select option used by editor toolbar selects. */
export interface ToolbarSelectOption {
  /** User-facing option label. */
  label: string;
  /** Command value. Empty string clears the corresponding formatting. */
  value: string;
}

/** Props for a compact editor sidebar select. */
export interface ToolbarSelectProps {
  /** Whether the select is disabled. */
  disabled?: boolean;
  /** Stable select id used by the visible label. */
  id: string;
  /** Visible select label. */
  label: string;
  /** Handles value changes. */
  onChange: (value: string) => void;
  /** Available options. */
  options: readonly ToolbarSelectOption[];
  /** Current selected value. */
  value: string;
}

/**
 * Renders a labeled select sized for the editor sidebar.
 *
 * @param props - Toolbar select props.
 * @returns Compact toolbar select.
 */
export function ToolbarSelect({
  disabled = false,
  id,
  label,
  onChange,
  options,
  value,
}: ToolbarSelectProps): JSX.Element {
  return (
    <label className="grid gap-1.5 text-xs font-medium text-slate-600" htmlFor={id}>
      <span>{label}</span>
      <select
        className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-sm text-slate-950 shadow-sm transition-colors focus:border-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
        disabled={disabled}
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={`${id}-${option.value || option.label}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
