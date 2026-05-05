import { Button } from '../../../shared/components';

/** Login form stub for the authentication feature. */
export function LoginForm(): JSX.Element {
  return (
    <form aria-label="Login form">
      <h2>Login Form</h2>
      <input aria-label="Email" placeholder="Email" type="email" />
      <input aria-label="Password" placeholder="Password" type="password" />
      <Button>Sign in</Button>
    </form>
  );
}
