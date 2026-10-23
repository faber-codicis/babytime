import type { Profile } from '../data/profile';
import { BabyFace } from './icons';

/** Round avatar: the baby's initial if a name is set (mockup), otherwise the logo face (spec 6.2). */
export function Avatar({ profile, size = 48 }: { profile: Profile | undefined; size?: number }) {
  return (
    <div class="avatar" style={{ width: `${size}px`, height: `${size}px` }} aria-hidden="true">
      {profile?.babyName ? (
        <span class="avatar-initial">{profile.babyName.charAt(0).toUpperCase()}</span>
      ) : (
        <BabyFace size={size} />
      )}
    </div>
  );
}
