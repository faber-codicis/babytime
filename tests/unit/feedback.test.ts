import { describe, expect, it } from 'vitest';
import { FEEDBACK_EMAIL, feedbackMailto } from '../../src/ui/feedback';

describe('feedback mail (0.13.0)', () => {
  const url = feedbackMailto('0.13.0', '15. November 2026, 21:00', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_1 like Mac OS X)', true);
  const params = new URLSearchParams(url.slice(url.indexOf('?') + 1));

  it('goes to the feedback address with the version in the subject', () => {
    expect(url.startsWith(`mailto:${FEEDBACK_EMAIL}?`)).toBe(true);
    expect(params.get('subject')).toBe('Baby Time 0.13.0: Feedback');
  });

  it('the draft carries version, install state and device, but nothing else', () => {
    const body = params.get('body')!;
    expect(body).toContain('Version: 0.13.0 (15. November 2026, 21:00)');
    expect(body).toContain('Als App installiert: ja');
    expect(body).toContain('Gerät: Mozilla/5.0 (iPhone; CPU iPhone OS 26_1 like Mac OS X)');
  });

  it('line breaks are encoded as %0A (mail apps on iOS and Android need that, not "+")', () => {
    expect(url).toContain('%0A');
    expect(url).not.toContain('+');
  });
});
