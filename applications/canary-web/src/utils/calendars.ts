interface CalendarLike {
  capabilities: string[];
  provider?: string | null;
  calendarType: string;
}

export const canPull = (calendar: CalendarLike): boolean =>
  calendar.capabilities.includes("pull");

export const canPush = (calendar: CalendarLike): boolean =>
  calendar.capabilities.includes("push");

export function partitionCalendars<T extends CalendarLike>(calendars: T[]): { pull: T[]; push: T[] } {
  const pull: T[] = [];
  const push: T[] = [];
  for (const calendar of calendars) {
    if (canPull(calendar)) pull.push(calendar);
    if (canPush(calendar)) push.push(calendar);
  }
  return { pull, push };
}

export const getCalendarProvider = (
  calendar: Pick<CalendarLike, "provider" | "calendarType">,
): string => calendar.provider ?? calendar.calendarType;
