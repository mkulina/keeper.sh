import { DashboardCalendarProvider } from "./components/dashboard-calendar-context";
import {
  DashboardCalendar as DashboardCalendarComposition,
  DashboardCalendarGrid,
  DashboardCalendarFrame,
  DashboardCalendarDaysOfWeek,
} from "./components/dashboard-calendar";
import { MonthRow } from "./components/month-row";
import { WeekColumn } from "./components/week-column";
import { CalendarFrame } from "./components/calendar-frame";
import { CurrentTimeIndicator } from "./components/current-time-indicator";
import { DashboardCalendarSkeleton } from "./components/dashboard-calendar-skeleton";

const DashboardCalendar = Object.assign(DashboardCalendarComposition, {
  Provider: DashboardCalendarProvider,
  MonthRow,
  WeekColumn,
  Frame: CalendarFrame,
  Grid: DashboardCalendarGrid,
  CalendarFrame: DashboardCalendarFrame,
  DaysOfWeek: DashboardCalendarDaysOfWeek,
  TimeIndicator: CurrentTimeIndicator,
  Skeleton: DashboardCalendarSkeleton,
});

export { DashboardCalendar, DashboardCalendarSkeleton };
