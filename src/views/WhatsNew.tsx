import { changelog } from '../changelog';
import { goBack } from '../router';
import { lang, t } from '../strings';
import { GuideCard, openGuideTarget } from '../ui/Guide';
import { Icon } from '../ui/icons';
import { NewsHero } from '../ui/NewsHero';

const dateFormat = new Intl.DateTimeFormat(t.locale, { day: 'numeric', month: 'long', year: 'numeric' });

/** "21. Oktober 2026" from YYYY-MM-DD (local date, no time zone shift). */
export function formatChangelogDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return dateFormat.format(new Date(y, m - 1, d));
}

/** "Was ist neu" (#/neu, spec 6.9): one card per version, the running one marked "Aktuell". */
export function WhatsNew() {
  return (
    <div class="whatsnew">
      <header class="screen-head">
        <button type="button" class="round-btn" aria-label={t.whatsNew.back} onClick={goBack}>
          <Icon name="back" size={22} />
        </button>
        <h1 class="screen-title">{t.whatsNew.title}</h1>
      </header>

      <NewsHero />

      {changelog.map((entry) => (
        <section key={entry.version} class="news-card" aria-labelledby={`news-${entry.version}`}>
          <div class="news-head">
            <h2 id={`news-${entry.version}`} class="news-version">
              {t.whatsNew.version(entry.version)}
            </h2>
            {entry.version === __APP_VERSION__ && <span class="news-pill">{t.whatsNew.current}</span>}
          </div>
          <p class="news-date">{formatChangelogDate(entry.date)}</p>
          <ul class="news-list">
            {entry.items[lang].map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {entry.guide && <GuideCard guide={entry.guide} onGo={() => openGuideTarget(entry.guide!.target)} />}
        </section>
      ))}
    </div>
  );
}
