import { CURRENT_WEEK_INDEX } from "./constants";

interface MonthSpan {
  month: number;
  year: number;
  startCol: number;
  endCol: number;
}

const groupDatesByMonth = (dates: Date[]): MonthSpan[] => {
  const spans: MonthSpan[] = [];
  let currentSpan: MonthSpan | null = null;

  dates.forEach((date, colIndex) => {
    const month = date.getMonth();
    const year = date.getFullYear();

    if (!currentSpan || currentSpan.month !== month || currentSpan.year !== year) {
      if (currentSpan) {
        spans.push(currentSpan);
      }
      currentSpan = { month, year, startCol: colIndex, endCol: colIndex };
    } else {
      currentSpan.endCol = colIndex;
    }
  });

  if (currentSpan) {
    spans.push(currentSpan);
  }
  return spans;
};

const generateWeeks = (totalWeeks: number, startOfWeek: Date, currentWeekIndex: number): Date[][] => {
  return Array.from({ length: totalWeeks }, (_, weekIndex) => {
    const weekOffset = weekIndex - currentWeekIndex;
    const weekStart = new Date(startOfWeek);
    weekStart.setDate(weekStart.getDate() + weekOffset * 7);

    return Array.from({ length: 7 }, (_, dayIndex) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + dayIndex);
      return date;
    });
  });
};

const getVirtualListStartDate = (startOfWeek: Date, currentWeekIndex: number): Date => {
  const virtualListStartDate = new Date(startOfWeek);
  virtualListStartDate.setDate(virtualListStartDate.getDate() - (currentWeekIndex * 7));
  return virtualListStartDate;
};

export type { MonthSpan };
export { groupDatesByMonth, generateWeeks, getVirtualListStartDate };
