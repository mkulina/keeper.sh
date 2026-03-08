import { extendByRecurrenceRule, type IcsRecurrenceRule } from "ts-ics";

const MIN_RECURRENCE_COUNT = 0;

const RECURRENCE_FREQUENCIES: IcsRecurrenceRule["frequency"][] = [
  "SECONDLY",
  "MINUTELY",
  "HOURLY",
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "YEARLY",
];
const WEEK_DAYS: NonNullable<IcsRecurrenceRule["workweekStart"]>[] = [
  "SU",
  "MO",
  "TU",
  "WE",
  "TH",
  "FR",
  "SA",
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const parseJson = (value: string | null): unknown => {
  if (value === null) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const parseWeekDay = (
  value: unknown,
): NonNullable<IcsRecurrenceRule["workweekStart"]> | null => {
  if (typeof value !== "string") {
    return null;
  }

  for (const weekDay of WEEK_DAYS) {
    if (weekDay === value) {
      return weekDay;
    }
  }

  return null;
};

const parseRecurrenceFrequency = (value: unknown): IcsRecurrenceRule["frequency"] | null => {
  if (typeof value !== "string") {
    return null;
  }

  for (const frequency of RECURRENCE_FREQUENCIES) {
    if (frequency === value) {
      return frequency;
    }
  }

  return null;
};

const parseNumberArray = (value: unknown): number[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  if (value.some((entry) => typeof entry !== "number")) {
    return undefined;
  }

  return value;
};

const parseRecurrenceByDay = (value: unknown): IcsRecurrenceRule["byDay"] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const byDay: NonNullable<IcsRecurrenceRule["byDay"]> = [];

  for (const entry of value) {
    if (!isRecord(entry)) {
      continue;
    }

    const parsedDay = parseWeekDay(entry.day);
    if (!parsedDay) {
      continue;
    }

    if (entry.occurrence !== undefined && typeof entry.occurrence !== "number") {
      continue;
    }

    if (typeof entry.occurrence === "number") {
      byDay.push({ day: parsedDay, occurrence: entry.occurrence });
      continue;
    }

    byDay.push({ day: parsedDay });
  }

  return byDay.length > MIN_RECURRENCE_COUNT ? byDay : undefined;
};

const parseUntilDate = (value: unknown): IcsRecurrenceRule["until"] | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const { date } = value;
  if (date instanceof Date) {
    return Number.isNaN(date.getTime()) ? undefined : { date };
  }

  if (typeof date !== "string") {
    return undefined;
  }

  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime()) ? undefined : { date: parsedDate };
};

const parseExceptionDatesFromJson = (exceptionDates: string | null): Date[] | undefined => {
  const parsedExceptionDates = parseJson(exceptionDates);
  if (!Array.isArray(parsedExceptionDates)) {
    return undefined;
  }

  const dates = parsedExceptionDates.flatMap((exceptionDate) => {
    if (!isRecord(exceptionDate)) {
      return [];
    }

    const { date } = exceptionDate;
    if (!(date instanceof Date) && typeof date !== "string") {
      return [];
    }

    const parsedDate = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return [];
    }

    return [parsedDate];
  });

  return dates.length > MIN_RECURRENCE_COUNT ? dates : undefined;
};

const parseRecurrenceRuleFromJson = (recurrenceRule: string | null): IcsRecurrenceRule | null => {
  const parsedRecurrenceRule = parseJson(recurrenceRule);
  if (!isRecord(parsedRecurrenceRule)) {
    return null;
  }

  const frequency = parseRecurrenceFrequency(parsedRecurrenceRule.frequency);
  if (!frequency) {
    return null;
  }

  const normalizedRule: IcsRecurrenceRule = { frequency };

  if (typeof parsedRecurrenceRule.count === "number") {
    normalizedRule.count = parsedRecurrenceRule.count;
  }
  if (typeof parsedRecurrenceRule.interval === "number") {
    normalizedRule.interval = parsedRecurrenceRule.interval;
  }

  const until = parseUntilDate(parsedRecurrenceRule.until);
  if (until) {
    normalizedRule.until = until;
  }

  const bySecond = parseNumberArray(parsedRecurrenceRule.bySecond);
  if (bySecond) {
    normalizedRule.bySecond = bySecond;
  }

  const byMinute = parseNumberArray(parsedRecurrenceRule.byMinute);
  if (byMinute) {
    normalizedRule.byMinute = byMinute;
  }

  const byHour = parseNumberArray(parsedRecurrenceRule.byHour);
  if (byHour) {
    normalizedRule.byHour = byHour;
  }

  const byDay = parseRecurrenceByDay(parsedRecurrenceRule.byDay);
  if (byDay) {
    normalizedRule.byDay = byDay;
  }

  const byMonthday = parseNumberArray(parsedRecurrenceRule.byMonthday);
  if (byMonthday) {
    normalizedRule.byMonthday = byMonthday;
  }

  const byYearday = parseNumberArray(parsedRecurrenceRule.byYearday);
  if (byYearday) {
    normalizedRule.byYearday = byYearday;
  }

  const byWeekNo = parseNumberArray(parsedRecurrenceRule.byWeekNo);
  if (byWeekNo) {
    normalizedRule.byWeekNo = byWeekNo;
  }

  const byMonth = parseNumberArray(parsedRecurrenceRule.byMonth);
  if (byMonth) {
    normalizedRule.byMonth = byMonth;
  }

  const bySetPos = parseNumberArray(parsedRecurrenceRule.bySetPos);
  if (bySetPos) {
    normalizedRule.bySetPos = bySetPos;
  }

  const workweekStart = parseWeekDay(parsedRecurrenceRule.workweekStart);
  if (workweekStart) {
    normalizedRule.workweekStart = workweekStart;
  }

  return normalizedRule;
};

const hasActiveFutureOccurrence = (
  startTime: Date,
  recurrenceRule: IcsRecurrenceRule | null,
  exceptionDates: Date[] | undefined,
  startOfToday: Date,
): boolean => {
  if (!recurrenceRule) {
    return false;
  }

  const dates = extendByRecurrenceRule(recurrenceRule, {
    exceptions: exceptionDates,
    start: startTime,
  });

  return dates.some((date) => date >= startOfToday);
};

export {
  hasActiveFutureOccurrence,
  parseExceptionDatesFromJson,
  parseRecurrenceRuleFromJson,
};
