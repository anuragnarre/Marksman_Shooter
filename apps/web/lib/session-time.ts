export function formatSessionStart(
  value: Date | string,
  options?: { includeYear?: boolean },
): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const datePart = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(options?.includeYear ? { year: 'numeric' as const } : {}),
  });

  const timePart = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // Use non-breaking spaces so timestamp never wraps into a second line.
  const safeTime = timePart.replace(' ', '\u00A0');
  return `${datePart}\u00A0·\u00A0${safeTime}`;
}

export function toLocalDateTimeInput(value: Date | string = new Date()): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const localMs = date.getTime() - date.getTimezoneOffset() * 60000;
  return new Date(localMs).toISOString().slice(0, 16);
}
