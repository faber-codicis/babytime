import { t } from '../strings.de';

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

// ---------------------------------------------------------------- day boundaries (local time zone)

/** Local midnight of the day containing `ts`. DST-safe (no fixed 24 h arithmetic). */
export function startOfDay(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Local midnight `days` days after the day containing `ts`. */
export function addDays(ts: number, days: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days).getTime();
}

/** [start, end) of the local day containing `ts`. */
export function dayRange(ts: number): [number, number] {
  return [startOfDay(ts), addDays(ts, 1)];
}

/** Whole calendar days from an ISO birth date (YYYY-MM-DD) to `now`, in local time. */
export function ageInDays(birthDate: string, now: number): number | undefined {
  const parts = birthDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n))) return undefined;
  const [y, m, d] = parts as [number, number, number];
  const birth = new Date(y, m - 1, d);
  const today = new Date(startOfDay(now));
  // Count via UTC dates so DST shifts never cost a day.
  const days = Math.round(
    (Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) -
      Date.UTC(birth.getFullYear(), birth.getMonth(), birth.getDate())) /
      DAY,
  );
  return days >= 0 ? days : undefined;
}

/** Local date as YYYY-MM-DD. */
export function isoDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Oldest birth date the profile accepts: 24 months back (the app is meant for babies and toddlers). */
export const BIRTH_MAX_MONTHS = 24;

export function earliestBirthDate(now: number): string {
  const d = new Date(now);
  return isoDate(new Date(d.getFullYear(), d.getMonth() - BIRTH_MAX_MONTHS, d.getDate()).getTime());
}

/** Why a birth date (YYYY-MM-DD) is not acceptable; undefined = fine. ISO strings compare correctly as text. */
export function birthDateProblem(birthDate: string, now: number): 'future' | 'tooOld' | undefined {
  if (birthDate > isoDate(now)) return 'future';
  if (birthDate < earliestBirthDate(now)) return 'tooOld';
  return undefined;
}

/** Completed calendar months since the birth date. */
function ageInMonths(birthDate: string, now: number): number | undefined {
  if (ageInDays(birthDate, now) === undefined) return undefined;
  const [y, m, d] = birthDate.split('-').map(Number) as [number, number, number];
  const today = new Date(now);
  const months = (today.getFullYear() - y) * 12 + (today.getMonth() + 1 - m);
  return today.getDate() < d ? months - 1 : months;
}

/**
 * Age for the header: days in the first two weeks ("12 Tage alt"), then weeks up to 3 months
 * ("5 Wochen alt"), then months ("4 Monate alt"), from 24 months years ("2 Jahre alt").
 */
export function formatAge(birthDate: string, now: number): string | undefined {
  const days = ageInDays(birthDate, now);
  const months = ageInMonths(birthDate, now);
  if (days === undefined || months === undefined) return undefined;
  if (days < 14) return t.time.ageDays(days);
  if (months < 3) return t.time.ageWeeks(Math.floor(days / 7));
  if (months < 24) return t.time.ageMonths(months);
  return t.time.ageYears(Math.floor(months / 12));
}

// ---------------------------------------------------------------- durations

function split(ms: number): { h: number; m: number } {
  const totalMinutes = Math.floor(Math.max(0, ms) / MINUTE);
  return { h: Math.floor(totalMinutes / 60), m: totalMinutes % 60 };
}

/** "35 Min", "1 Std 40 Min", "2 Std". */
export function formatDuration(ms: number): string {
  const { h, m } = split(ms);
  if (h === 0) return t.time.minutesShort(m);
  return m === 0 ? t.time.hours(h) : t.time.hoursMinutes(h, m);
}

/** Time passed since something: "gerade eben" in the first minute, then like formatDuration. */
export function formatElapsed(ms: number): string {
  return ms < MINUTE ? t.time.justNow : formatDuration(ms);
}

/** "seit 25 Min", or "gerade eben" in the first minute. */
export function formatSince(ms: number): string {
  return ms < MINUTE ? t.time.justNow : t.time.since(formatDuration(ms));
}

/** Like formatDuration, but "18 Minuten" below one hour (used in running text). */
export function formatDurationLong(ms: number): string {
  const { h, m } = split(ms);
  return h === 0 ? t.time.minutesLong(m) : formatDuration(ms);
}

/** Relative time: "gerade eben", "vor 35 Min", "vor 1 Std 40 Min", "vor 2 Tagen". */
export function formatRelative(then: number, now: number): string {
  const diff = Math.max(0, now - then);
  if (diff < MINUTE) return t.time.justNow;
  if (diff < DAY) return t.time.ago(formatDuration(diff));
  return t.time.daysAgo(Math.floor(diff / DAY));
}

/** Calendar days between two times in local time ("heute" = 0, "gestern" = 1), DST-safe. */
export function calendarDaysBetween(then: number, now: number): number {
  const a = new Date(startOfDay(then));
  const b = new Date(startOfDay(now));
  return Math.round(
    (Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / DAY,
  );
}

/** "heute", "gestern", "vor 12 Tagen" – for dates where the time of day does not matter. */
export function formatDaysAgo(then: number, now: number): string {
  const days = Math.max(0, calendarDaysBetween(then, now));
  if (days === 0) return t.time.today;
  if (days === 1) return t.time.yesterday;
  return t.time.daysAgo(days);
}

/** Timer display mm:ss with unbounded minutes ("72:05"). */
export function formatTimer(ms: number): string {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// ---------------------------------------------------------------- <input type="datetime-local">

const pad2 = (n: number) => String(n).padStart(2, '0');

/** epoch ms → "2026-10-21T14:20" in local time, the value format of datetime-local inputs. */
export function toLocalInput(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** "2026-10-21T14:20" (local) → epoch ms; undefined for empty or invalid input. */
export function fromLocalInput(value: string): number | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!m) return undefined;
  const [y, mo, d, h, mi, s] = m.slice(1).map((part) => Number(part ?? 0)) as [number, number, number, number, number, number];
  const date = new Date(y, mo - 1, d, h, mi, s);
  if (date.getMonth() !== mo - 1 || date.getDate() !== d) return undefined;
  return date.getTime();
}

// ---------------------------------------------------------------- clock and dates

const clockFormat = new Intl.DateTimeFormat(t.locale, { hour: '2-digit', minute: '2-digit', hour12: false });
const weekdayFormat = new Intl.DateTimeFormat(t.locale, { weekday: 'long' });

/** "07:42". */
export function formatClock(ts: number): string {
  return clockFormat.format(ts);
}

const stampFormat = new Intl.DateTimeFormat(t.locale, {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** "21.10., 10:50" (build stamp). */
export function formatStamp(ts: number): string {
  return stampFormat.format(ts);
}

/** "Mittwoch". */
export function formatWeekday(ts: number): string {
  return weekdayFormat.format(ts);
}

const shortWeekdayFormat = new Intl.DateTimeFormat(t.locale, { weekday: 'short' });
const dayMonthFormat = new Intl.DateTimeFormat(t.locale, { day: 'numeric', month: 'short' });

/** Day heading in the history: "Heute", "Gestern", otherwise "Mo, 19. Okt.". */
export function formatDayHeading(dayStart: number, now: number): string {
  const today = startOfDay(now);
  if (dayStart === today) return t.history.today;
  if (dayStart === addDays(today, -1)) return t.history.yesterday;
  const weekday = shortWeekdayFormat.format(dayStart).replace(/\.$/, '');
  return `${weekday}, ${dayMonthFormat.format(dayStart)}`;
}
