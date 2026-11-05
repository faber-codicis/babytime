import { LaughingBaby } from './icons';

/**
 * Splash-style banner with the laughing baby, on top of the update popup and "Was ist neu":
 * rosé like the app splash (muted in the dark design), soft blobs and dots, a gentle giggle.
 */
export function NewsHero({ compact = false }: { compact?: boolean }) {
  return (
    <div class={`news-hero${compact ? ' news-hero--compact' : ''}`} aria-hidden="true">
      <span class="news-hero-blob news-hero-blob--a" />
      <span class="news-hero-blob news-hero-blob--b" />
      <span class="news-hero-dot" style={{ width: '12px', height: '12px', right: '16%', top: '18%' }} />
      <span class="news-hero-dot news-hero-dot--peach" style={{ width: '8px', height: '8px', left: '14%', bottom: '22%' }} />
      <span class="news-hero-dot news-hero-dot--lavender" style={{ width: '10px', height: '10px', left: '22%', top: '14%' }} />
      <LaughingBaby size={compact ? 112 : 140} />
    </div>
  );
}
