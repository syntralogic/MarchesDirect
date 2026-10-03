// DEV-02 (plan de corrections, 3 Oct): show a PRECISE deadline instead of a bare
// "1 jour" - the date and, only when the source gave one, the hour, in the
// French (Paris) time zone. "Aujourd'hui à 19 h" the same day. A deadline
// stored at exactly 00:00 Paris is a date without a time: no hour is invented.

const TZ = 'Europe/Paris';

function parisParts(d: Date) {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(d);
  const get = (t: string) => Number(parts.find(p => p.type === t)?.value);
  return { y: get('year'), m: get('month'), d: get('day'), h: get('hour'), min: get('minute') };
}

const dayNumber = (p: { y: number; m: number; d: number }) => Math.floor(Date.UTC(p.y, p.m - 1, p.d) / 86400000);

export function formatHour(h: number, min: number): string {
  return min === 0 ? `${h} h` : `${h} h ${String(min).padStart(2, '0')}`;
}

/** Precise, human deadline text, or null when the date is missing/invalid. */
export function formatDeadlineExact(deadline: string | null | undefined, now: Date = new Date()): string | null {
  if (!deadline) return null;
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return null;
  const p = parisParts(date);
  const hasTime = !(p.h === 0 && p.min === 0);
  const diffDays = dayNumber(p) - dayNumber(parisParts(now));
  const hour = hasTime ? ` à ${formatHour(p.h, p.min)}` : '';
  if (diffDays === 0) return `Aujourd’hui${hour}`;
  if (diffDays === 1) return `Demain${hour}`;
  const day = new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  return `${day}${hour}`;
}
