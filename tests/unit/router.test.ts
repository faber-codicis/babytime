import { describe, expect, it } from 'vitest';
import { parseHash } from '../../src/router';

describe('parseHash', () => {
  it('maps #/stillen to the feeding screen', () => {
    expect(parseHash('#/stillen')).toBe('feeding');
  });

  it('maps #/verlauf to the history', () => {
    expect(parseHash('#/verlauf')).toBe('history');
  });

  it('maps #/meilensteine to the milestones tab (0.10.0)', () => {
    expect(parseHash('#/meilensteine')).toBe('milestones');
  });

  it('maps the settings sub pages (0.17.0)', () => {
    expect(parseHash('#/einstellungen')).toBe('settings');
    expect(parseHash('#/einstellungen/erfassen')).toBe('settingsTrackers');
    expect(parseHash('#/einstellungen/darstellung')).toBe('settingsLook');
    expect(parseHash('#/einstellungen/daten')).toBe('settingsData');
    expect(parseHash('#/einstellungen/app')).toBe('settingsAbout');
    expect(parseHash('#/einstellungen/gibtsnicht')).toBe('today');
  });

  it('falls back to today for empty, root and unknown hashes', () => {
    expect(parseHash('')).toBe('today');
    expect(parseHash('#/')).toBe('today');
    expect(parseHash('#/gibtsnicht')).toBe('today');
  });
});
