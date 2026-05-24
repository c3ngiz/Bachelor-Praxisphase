import { useState, type FormEvent } from 'react';
import { Building2, Globe } from 'lucide-react';

import { Button, Card, Checkbox, Divider, Input } from '../../../shared/components';
import { DEFAULT_ROUTE } from '../../../shared/constants';
import { PasswordStrengthIndicator, SocialAuthButton } from '../components';
import { useAuth } from '../hooks/useAuth';
import {
  hasNoValidationErrors,
  validateEmail,
  validatePassword,
} from '../utils/authValidation.utils';

interface SignUpFormState {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}

type SignUpField = keyof SignUpFormState;
type SignUpErrors = Partial<Record<SignUpField, string>>;

/**
 * Validates registration fields before sending a sign-up request.
 *
 * @param values - Current sign-up form values.
 * @returns Field errors keyed by registration field name.
 */
function validateSignUpForm(values: SignUpFormState): SignUpErrors {
  const errors: SignUpErrors = {};

  if (!values.fullName.trim()) {
    errors.fullName = 'Full name is required.';
  }

  errors.email = validateEmail(values.email);
  errors.password = validatePassword(values.password);

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Confirm your password.';
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  if (!values.acceptedTerms) {
    errors.acceptedTerms = 'Accept the terms and conditions to continue.';
  }

  return errors;
}

/**
 * Renders the registration route and creates a new authenticated session.
 *
 * The page performs client-side validation, delegates account creation to the
 * auth provider, then redirects to the authenticated landing route.
 */
export function SignUpPage(): JSX.Element {
  const { error, isLoading, signUp } = useAuth();
  const [values, setValues] = useState<SignUpFormState>({
    acceptedTerms: false,
    confirmPassword: '',
    email: '',
    fullName: '',
    password: '',
  });
  const [errors, setErrors] = useState<SignUpErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const nextErrors = validateSignUpForm(values);
    setErrors(nextErrors);

    if (!hasNoValidationErrors(nextErrors)) {
      return;
    }

    try {
      await signUp({
        email: values.email,
        name: values.fullName,
        password: values.password,
      });
      window.location.assign(DEFAULT_ROUTE);
    } catch {
      // The auth provider exposes normalized errors for this page to render.
    }
  }

  return (
    <section className="w-full max-w-md">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
          Start fresh
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Create your account</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Set up your workspace with the essentials, then move straight into your dashboard.
        </p>
      </div>

      <Card className="shadow-lg shadow-slate-200/70">
        <Card.Content className="p-5 sm:p-6">
          <form className="grid gap-5" noValidate onSubmit={handleSubmit}>
            {error ? (
              <p className="m-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error.message}
              </p>
            ) : null}

            <div className="grid gap-4">
              <Input
                autoComplete="name"
                error={errors.fullName}
                label="Full name"
                name="fullName"
                onChange={(event) =>
                  setValues((current) => ({ ...current, fullName: event.target.value }))
                }
                placeholder="Alex Morgan"
                required
                type="text"
                value={values.fullName}
              />

              <Input
                autoComplete="email"
                error={errors.email}
                label="Email address"
                name="email"
                onChange={(event) =>
                  setValues((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="you@example.com"
                required
                type="email"
                value={values.email}
              />

              <div className="grid gap-2">
                <Input
                  autoComplete="new-password"
                  error={errors.password}
                  label="Password"
                  name="password"
                  onChange={(event) =>
                    setValues((current) => ({ ...current, password: event.target.value }))
                  }
                  placeholder="Create a password"
                  required
                  type="password"
                  value={values.password}
                />
                <PasswordStrengthIndicator password={values.password} />
              </div>

              <Input
                autoComplete="new-password"
                error={errors.confirmPassword}
                label="Confirm password"
                name="confirmPassword"
                onChange={(event) =>
                  setValues((current) => ({ ...current, confirmPassword: event.target.value }))
                }
                placeholder="Repeat your password"
                required
                type="password"
                value={values.confirmPassword}
              />
            </div>

            <Checkbox
              checked={values.acceptedTerms}
              error={errors.acceptedTerms}
              label={
                <span>
                  I agree to the{' '}
                  <a
                    className="font-semibold text-slate-950 underline-offset-4 hover:underline"
                    href="/terms"
                  >
                    terms and conditions
                  </a>
                </span>
              }
              name="acceptedTerms"
              onChange={(event) =>
                setValues((current) => ({ ...current, acceptedTerms: event.target.checked }))
              }
            />

            <Button className="w-full" loading={isLoading} size="lg" type="submit">
              Create account
            </Button>

            <div className="grid gap-4">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <Divider />
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                  or
                </span>
                <Divider />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <SocialAuthButton icon={<Globe className="h-4 w-4" />}>Google</SocialAuthButton>
                <SocialAuthButton icon={<Building2 className="h-4 w-4" />}>SSO</SocialAuthButton>
              </div>
            </div>

            <p className="m-0 text-center text-sm text-slate-600">
              Already have an account?{' '}
              <a
                className="font-semibold text-slate-950 underline-offset-4 hover:underline"
                href="/sign-in"
              >
                Sign in
              </a>
            </p>
          </form>
        </Card.Content>
      </Card>
    </section>
  );
}
