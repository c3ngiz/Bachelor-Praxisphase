import { cn } from '../../../shared/utils';

/**
 * Props for the password strength indicator shown on the sign-up form.
 */
export interface PasswordStrengthIndicatorProps {
  password: string;
}

/**
 * Scores password strength from the client-side validation signals displayed to users.
 *
 * @param password - Password text currently entered by the user.
 * @returns Number of strength checks passed, from zero to four.
 */
function getPasswordScore(password: string): number {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];

  return checks.filter(Boolean).length;
}

/**
 * Renders a compact password strength meter for registration.
 *
 * The indicator is advisory only; the canonical password rules are still
 * validated by the form and backend authentication service.
 *
 * @param props - Password strength indicator props.
 * @returns Accessible strength meter and label.
 */
export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps): JSX.Element {
  const score = getPasswordScore(password);
  const label = score <= 1 ? 'Weak' : score <= 3 ? 'Good' : 'Strong';

  return (
    <div aria-live="polite" className="grid gap-2">
      <div className="flex gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((item) => (
          <span
            key={item}
            className={cn(
              'h-1.5 flex-1 rounded-full bg-slate-200',
              item <= score && score <= 1 && 'bg-red-500',
              item <= score && score > 1 && score <= 3 && 'bg-amber-500',
              item <= score && score > 3 && 'bg-teal-600',
            )}
          />
        ))}
      </div>
      <p className="m-0 text-xs text-slate-500">Password strength: {password ? label : 'Enter a password'}</p>
    </div>
  );
}
