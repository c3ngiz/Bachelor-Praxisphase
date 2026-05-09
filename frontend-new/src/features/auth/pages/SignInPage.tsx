import { useState, type FormEvent } from 'react';
import { Building2, Globe } from 'lucide-react';

import { Button, Card, Checkbox, Divider, Input } from '../../../shared/components';
import { SocialAuthButton } from '../components';
import {
  hasNoValidationErrors,
  validateEmail,
  validatePassword,
} from '../utils/authValidation.utils';

interface SignInFormState {
  email: string;
  password: string;
  remember: boolean;
}

type SignInErrors = Partial<Record<keyof Pick<SignInFormState, 'email' | 'password'>, string>>;

function validateSignInForm(values: SignInFormState): SignInErrors {
  return {
    email: validateEmail(values.email),
    password: validatePassword(values.password),
  };
}

export function SignInPage(): JSX.Element {
  const [values, setValues] = useState<SignInFormState>({
    email: '',
    password: '',
    remember: true,
  });
  const [errors, setErrors] = useState<SignInErrors>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const nextErrors = validateSignInForm(values);
    setErrors(nextErrors);

    if (hasNoValidationErrors(nextErrors)) {
      window.location.assign('/dashboard');
    }
  }

  return (
    <section className="w-full max-w-md">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
          Secure access
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Welcome back</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Sign in to continue working with your documents, profile, and dashboard.
        </p>
      </div>

      <Card className="shadow-lg shadow-slate-200/70">
        <Card.Content className="p-5 sm:p-6">
          <form className="grid gap-5" noValidate onSubmit={handleSubmit}>
            <div className="grid gap-4">
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

              <Input
                autoComplete="current-password"
                error={errors.password}
                label="Password"
                name="password"
                onChange={(event) =>
                  setValues((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="Enter your password"
                required
                type="password"
                value={values.password}
              />
            </div>

            <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-start sm:justify-between">
              <Checkbox
                checked={values.remember}
                label="Remember me"
                name="remember"
                onChange={(event) =>
                  setValues((current) => ({ ...current, remember: event.target.checked }))
                }
              />
              <a
                className="font-medium text-slate-900 underline-offset-4 hover:underline"
                href="/forgot-password"
              >
                Forgot password?
              </a>
            </div>

            <Button className="w-full" size="lg" type="submit">
              Sign in
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
              New here?{' '}
              <a
                className="font-semibold text-slate-950 underline-offset-4 hover:underline"
                href="/sign-up"
              >
                Create an account
              </a>
            </p>
          </form>
        </Card.Content>
      </Card>
    </section>
  );
}
