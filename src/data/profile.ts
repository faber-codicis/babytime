import { setLastSeenVersion, setTutorialPending } from './appState';
import { db } from './db';

export interface Profile {
  babyName?: string;
  birthDate?: string; // ISO date YYYY-MM-DD
  onboarded: boolean;
}

export const BABY_NAME_MAX = 60;
const PROFILE_KEY = 'profile';
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number) as [number, number, number];
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

/** Builds a clean profile from untrusted input; unknown fields are dropped. */
export function sanitizeProfile(input: unknown): Profile {
  const source = (typeof input === 'object' && input !== null ? input : {}) as Record<string, unknown>;
  const profile: Profile = { onboarded: source['onboarded'] === true };
  const name = typeof source['babyName'] === 'string' ? source['babyName'].trim().slice(0, BABY_NAME_MAX) : '';
  if (name) profile.babyName = name;
  const birthDate = source['birthDate'];
  if (typeof birthDate === 'string' && isValidIsoDate(birthDate)) profile.birthDate = birthDate;
  return profile;
}

export async function getProfile(): Promise<Profile> {
  const entry = await db.kv.get(PROFILE_KEY);
  return sanitizeProfile(entry?.value);
}

export async function saveProfile(profile: Profile): Promise<Profile> {
  const clean = sanitizeProfile(profile);
  await db.kv.put({ key: PROFILE_KEY, value: clean });
  return clean;
}

/**
 * Finishes the first start (spec 6.7): saves name and birth date (both optional) and marks the
 * current version as seen, so no update popup follows right away.
 */
export async function completeOnboarding(input: { babyName?: string; birthDate?: string }, version: string): Promise<Profile> {
  return db.transaction('rw', db.kv, async () => {
    const profile = await saveProfile({ ...pick(input), onboarded: true });
    await setLastSeenVersion(version);
    // 0.16.0: the short introduction follows the first start.
    await setTutorialPending(true);
    return profile;
  });
}

const pick = (input: { babyName?: string; birthDate?: string }): Omit<Profile, 'onboarded'> => {
  const out: Omit<Profile, 'onboarded'> = {};
  if (input.babyName !== undefined) out.babyName = input.babyName;
  if (input.birthDate !== undefined) out.birthDate = input.birthDate;
  return out;
};
