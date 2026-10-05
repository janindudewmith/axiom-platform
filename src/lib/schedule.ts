/**
 * Utility to calculate the next occurrence of a weekly class.
 */
export function getNextClassDate(dayOfWeek: string | null, startTime: string | null): Date | null {
  if (!dayOfWeek || !startTime) return null;

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const targetDay = days.indexOf(dayOfWeek);
  if (targetDay === -1) return null;

  const [hours, minutes] = startTime.split(':').map(Number);
  const now = new Date();
  
  let result = new Date();
  result.setHours(hours, minutes, 0, 0);

  // Calculate days until the next occurrence
  let daysUntil = (targetDay - now.getDay() + 7) % 7;
  
  // If it's today but the time has already passed, move to next week
  if (daysUntil === 0 && result.getTime() < now.getTime()) {
    daysUntil = 7;
  }

  result.setDate(now.getDate() + daysUntil);
  return result;
}

export function formatDuration(duration: number | null): string {
  if (!duration) return "";
  const h = Math.floor(duration);
  const m = (duration - h) * 60;
  return `${h}h${m > 0 ? ` ${m}m` : ''}`;
}

/**
 * Converts a 24h time string (e.g. "15:30") to 12h format (e.g. "3:30 PM").
 */
export function formatTime(startTime: string | null): string {
  if (!startTime) return '';
  return new Date(`2000-01-01T${startTime}`).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Splits a class title into main title and medium sub-title.
 * Example: "Grade 10 Mathematics - English Medium" -> { main: "Grade 10 Mathematics", sub: "English Medium" }
 */
export function splitClassTitle(title: string) {
  if (!title) return { main: '', sub: '' };
  const parts = title.split(' - ');
  if (parts.length < 2) return { main: title, sub: '' };
  return { main: parts[0], sub: parts[1] };
}
