import { convertIcsCalendar } from "ts-ics";

interface ParseIcsCalendarOptions {
  icsString: string;
}

const parseIcsCalendar = (options: ParseIcsCalendarOptions) =>
  convertIcsCalendar(undefined, options.icsString);

export { parseIcsCalendar };
