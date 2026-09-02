const SITE_TIMEZONE = 'Europe/Madrid';

function dayKeyInSiteTimezone(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SITE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Un post es visible si su día de publicación (interpretado en la
 * zona horaria del sitio) ya ha llegado. Comparar a granularidad de día
 * evita el "pubDate-future trap": un frontmatter `YYYY-MM-DD` se convierte
 * en medianoche UTC y `pubDate <= new Date()` lo excluye durante horas
 * cuando el build corre antes de medianoche UTC de esa fecha local.
 */
export function isPublished(pubDate: Date, now: Date = new Date()): boolean {
  return dayKeyInSiteTimezone(pubDate) <= dayKeyInSiteTimezone(now);
}
