import { ProfileCard } from '../components/ProfileCard';
import { useProfile } from '../hooks/useProfile';

/** Profile page for current user details. */
export function ProfilePage(): JSX.Element {
  const { profile } = useProfile();

  return (
    <section>
      <h1>Profile Page</h1>
      <ProfileCard profile={profile} />
    </section>
  );
}
