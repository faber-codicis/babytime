import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../src/data/db';
import { getLastSeenVersion } from '../../src/data/appState';
import { BABY_NAME_MAX, completeOnboarding, getProfile, sanitizeProfile, saveProfile } from '../../src/data/profile';

beforeEach(async () => {
  await db.kv.clear();
});

describe('profile', () => {
  it('defaults to an empty, not onboarded profile', async () => {
    expect(await getProfile()).toEqual({ onboarded: false });
  });

  it('round-trips name and birth date', async () => {
    await saveProfile({ babyName: '  Lena ', birthDate: '2026-10-09', onboarded: true });
    expect(await getProfile()).toEqual({ babyName: 'Lena', birthDate: '2026-10-09', onboarded: true });
  });

  it('first start marks onboarded and the current version as seen (no popup right after)', async () => {
    await completeOnboarding({ babyName: 'Lena', birthDate: '' }, '0.3.0');
    expect(await getProfile()).toEqual({ babyName: 'Lena', onboarded: true });
    expect(await getLastSeenVersion()).toBe('0.3.0');

    await db.kv.clear();
    await completeOnboarding({}, '0.3.0');
    expect(await getProfile()).toEqual({ onboarded: true });
  });

  it('drops invalid values and unknown fields, and limits the name length', () => {
    const clean = sanitizeProfile({
      babyName: 'x'.repeat(100),
      birthDate: '2026-02-30',
      onboarded: 'yes',
      evil: '<script>',
    });
    expect(clean).toEqual({ babyName: 'x'.repeat(BABY_NAME_MAX), onboarded: false });
    expect(sanitizeProfile(null)).toEqual({ onboarded: false });
    expect(sanitizeProfile({ babyName: '   ' })).toEqual({ onboarded: false });
  });
});
