import { getProfileInitials } from '../utils/profile.utils';
import type { UserProfile } from '../types/profile.types';

/** Props for the profile card component. */
export interface ProfileCardProps {
  /** Profile displayed in the card. */
  profile: UserProfile;
}

/** Displays a compact user profile card. */
export function ProfileCard({ profile }: ProfileCardProps): JSX.Element {
  return (
    <article aria-label="Profile card">
      <strong>{getProfileInitials(profile)}</strong>
      <h2>Profile Card</h2>
      <p>{profile.name}</p>
      <p>{profile.bio}</p>
    </article>
  );
}
