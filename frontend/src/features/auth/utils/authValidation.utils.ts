/**
 * Minimum password length enforced by the frontend validation helpers.
 */
export const minPasswordLength = 8;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Checks whether a value has a valid email address shape. */
export function isValidEmail(email: string): boolean {
  return emailPattern.test(email);
}

/** Returns an accessible email validation message, or undefined when valid. */
export function validateEmail(email: string): string | undefined {
  if (!email.trim()) {
    return 'Email is required.';
  }

  if (!isValidEmail(email)) {
    return 'Enter a valid email address.';
  }

  return undefined;
}

/** Returns an accessible password validation message, or undefined when valid. */
export function validatePassword(password: string): string | undefined {
  if (!password) {
    return 'Password is required.';
  }

  if (password.length < minPasswordLength) {
    return `Password must be at least ${minPasswordLength} characters.`;
  }

  return undefined;
}

/** Checks whether a field error object contains any active validation errors. */
export function hasNoValidationErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).every((error) => !error);
}
