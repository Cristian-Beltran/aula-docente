type DateOptions = Intl.DateTimeFormatOptions;

export function formatSessionDate(
  sessionDate?: string | null,
  locale = 'es-BO',
  options: DateOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
) {
  if (!sessionDate) return '';
  return new Date(`${sessionDate}T12:00:00`).toLocaleDateString(locale, options);
}

export function formatSessionTime(dateTime?: string | null) {
  if (!dateTime) return '';
  const match = String(dateTime).match(/T(\d{2}):(\d{2})/);
  if (!match) return '';
  return `${match[1]}:${match[2]}`;
}

export function formatSessionRange(
  session: { sessionDate?: string | null; startsAt?: string | null; endsAt?: string | null },
  withDate = false,
  locale = 'es-BO',
) {
  const startTime = formatSessionTime(session.startsAt);
  const endTime = formatSessionTime(session.endsAt);
  const prefix = withDate
    ? `${formatSessionDate(session.sessionDate, locale, {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
      })} `
    : '';

  if (!startTime) return prefix.trim();
  return endTime ? `${prefix}${startTime} - ${endTime}`.trim() : `${prefix}${startTime}`.trim();
}
