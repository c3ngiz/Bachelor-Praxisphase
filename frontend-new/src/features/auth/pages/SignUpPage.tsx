import { useState, type FormEvent } from 'react';

import { Button, Card, Checkbox, Divider, Input } from '../../../shared/components';
import { PasswordStrengthIndicator, SocialAuthButton } from '../components';

interface SignUpFormState {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}

type SignUpField = keyof SignUpFormState;
type SignUpErrors = Partial<Record<SignUpField, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateSignUpForm(values: SignUpFormState): SignUpErrors {
  const errors: SignUpErrors = {};

  if (!values.fullName.trim()) {
    errors.fullName = 'Full name is required.';
  }

  if (!values.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!emailPattern.test(values.email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!values.password) {
    errors.password = 'Password is required.';
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

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

export function SignUpPage(): JSX.Element {
  const [values, setValues] = useState<SignUpFormState>({
    acceptedTerms: false,
    confirmPassword: '',
    email: '',
    fullName: '',
    password: '',
  });
  const [errors, setErrors] = useState<SignUpErrors>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const nextErrors = validateSignUpForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      window.location.assign('/dashboard');
    }
  }

  return (
    <section className="w-full max-w-md">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Start fresh</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Create your account</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Set up your workspace with the essentials, then move straight into your dashboard.
        </p>
      </div>

      <Card className="shadow-lg shadow-slate-200/70">
        <Card.Content className="p-5 sm:p-6">
          <form className="grid gap-5" noValidate onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <Input
                autoComplete="name"
                error={errors.fullName}
                label="Full name"
                name="fullName"
                onChange={(event) => setValues((current) => ({ ...current, fullName: event.target.value }))}
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
                onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
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
                  onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))}
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
                onChange={(event) => setValues((current) => ({ ...current, confirmPassword: event.target.value }))}
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
                  <a className="font-semibold text-slate-950 underline-offset-4 hover:underline" href="/terms">
                    terms and conditions
                  </a>
                </span>
              }
              name="acceptedTerms"
              onChange={(event) => setValues((current) => ({ ...current, acceptedTerms: event.target.checked }))}
            />

            <Button className="w-full" size="lg" type="submit">
              Create account
            </Button>

            <div className="grid gap-4">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <Divider />
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">or</span>
                <Divider />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <SocialAuthButton mark="G">Google</SocialAuthButton>
                <SocialAuthButton mark="S">SSO</SocialAuthButton>
              </div>
            </div>

            <p className="m-0 text-center text-sm text-slate-600">
              Already have an account?{' '}
              <a className="font-semibold text-slate-950 underline-offset-4 hover:underline" href="/sign-in">
                Sign in
              </a>
            </p>
          </form>
        </Card.Content>
      </Card>
    </section>
  );
}
