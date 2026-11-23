import type { Profile } from '../data/profile';
import { BabyFace } from './icons';

/**
 * Round avatar: the baby's photo if one is set (0.18.0), else the initial if a name is set (mockup),
 * otherwise the logo face (spec 6.2). Decorative: the name stands next to it.
 */
export function Avatar({ profile, size = 48 }: { profile: Profile | undefined; size?: number }) {
  return (
    <div class="avatar" style={{ width: `${size}px`, height: `${size}px` }} aria-hidden="true">
      {profile?.photo ? (
        <img class="avatar-photo" src={profile.photo} alt="" width={size} height={size} />
      ) : profile?.babyName ? (
        <span class="avatar-initial">{profile.babyName.charAt(0).toUpperCase()}</span>
      ) : (
        <BabyFace size={size} />
      )}
    </div>
  );
}
