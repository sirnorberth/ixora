import { differenceInCalendarDays, format, parseISO } from 'date-fns';

export function daysSince(dateStr) {
  if (!dateStr) return 0;
  try {
    return Math.max(0, differenceInCalendarDays(new Date(), parseISO(dateStr)));
  } catch {
    return 0;
  }
}

export function daysBetween(a, b) {
  if (!a || !b) return 0;
  try {
    return Math.max(0, differenceInCalendarDays(parseISO(a), parseISO(b)));
  } catch {
    return 0;
  }
}

export function fmtDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return format(parseISO(dateStr), 'd MMM yyyy');
  } catch {
    return dateStr;
  }
}

export function todayISODate() {
  return format(new Date(), 'yyyy-MM-dd');
}