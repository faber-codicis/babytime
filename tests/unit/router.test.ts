import { describe, expect, it } from 'vitest';
import { parseHash } from '../../src/router';

describe('parseHash', () => {
  it('maps #/stillen to the feeding screen', () => {
    expect(parseHash('#/stillen')).toBe('feeding');
  });

  it('maps #/verlauf to the history', () => {
    expect(parseHash('#/verlauf')).toBe('history');
  });

  it('falls back to today for empty, root and unknown hashes', () => {
    expect(parseHash('')).toBe('today');
    expect(parseHash('#/')).toBe('today');
    expect(parseHash('#/meilensteine')).toBe('today');
  });
});
