export function getISTDate(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 5.5 * 3600000);
}

export function getISTTimeString(): string {
  return getISTDate().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function getISTDateString(): string {
  return getISTDate().toISOString().split('T')[0];
}

export function getISTHour(): number {
  return getISTDate().getHours();
}

export function getISTMinute(): number {
  return getISTDate().getMinutes();
}

export function getISTTimeParts(): { hour: number; minute: number; second: number } {
  const d = getISTDate();
  return { hour: d.getHours(), minute: d.getMinutes(), second: d.getSeconds() };
}

export function formatISTTimeHHMMSS(): string {
  const { hour, minute, second } = getISTTimeParts();
  const period = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')} ${period}`;
}
