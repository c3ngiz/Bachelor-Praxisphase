import { LoginForm } from '../components/LoginForm';

/** Login page for unauthenticated users. */
export function LoginPage(): JSX.Element {
  return (
    <section>
      <h1>Login Page</h1>
      <LoginForm />
    </section>
  );
}
