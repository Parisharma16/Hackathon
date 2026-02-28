/**
 * Merges a list of conditional class strings, filtering out falsy values.
 * Usage: cn('px-2 py-1', condition && 'bg-blue-600')
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Returns up to two-letter initials from a full name.
 * "Alice Johnson" → "AJ"
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Formats an ISO date string into a human-readable date + time.
 * "2026-02-27T10:30:00Z" → "Feb 27, 2026, 10:30 AM"
 */
export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
