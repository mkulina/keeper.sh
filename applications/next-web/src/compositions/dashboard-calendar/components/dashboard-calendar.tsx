"use client";

import type { FC } from "react";
import { useRef, useEffect, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { MicroCopy } from "@/components/micro-copy";
import { CalendarFrame } from "./calendar-frame";
import { CalendarDay } from "./calendar-day";
import { CalendarDayNumber } from "./calendar-day-number";
import { CurrentTimeIndicator } from "./current-time-indicator";
import { WeekColumn } from "./week-column";
import { MonthRow } from "./month-row";
import { DAYS_OF_WEEK, TOTAL_WEEKS, CURRENT_WEEK_INDEX } from "../utils/constants";
import { groupDatesByMonth, generateWeeks, getVirtualListStartDate } from "../utils/date-utils";

const DashboardCalendar: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const weekColumnRef = useRef<HTMLDivElement>(null);
  const [, forceUpdate] = useState({});
  const [firstVisibleRowIndex, setFirstVisibleRowIndex] = useState(CURRENT_WEEK_INDEX - 1);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down');
  const prevScrollTop = useRef(0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(today);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  const virtualListStartDate = getVirtualListStartDate(startOfWeek, CURRENT_WEEK_INDEX);

  const weeks = generateWeeks(TOTAL_WEEKS, startOfWeek, CURRENT_WEEK_INDEX);

  const rowVirtualizer = useVirtualizer({
    count: weeks.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => {
      if (!containerRef.current) return 100;
      const containerHeight = containerRef.current.clientHeight;
      return (containerHeight / 3) + 1;
    },
    overscan: 3,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      forceUpdate({});
      rowVirtualizer.measure();
      rowVirtualizer.scrollToIndex(CURRENT_WEEK_INDEX - 1, { align: 'start' });
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const weekColumn = weekColumnRef.current;
    if (!container) return;

    const handleScroll = () => {
      const currentScrollTop = container.scrollTop;

      if (weekColumn) {
        weekColumn.style.transform = `translateY(${-currentScrollTop}px)`;
      }

      const rowHeight = (container.clientHeight / 3) + 1;
      const actualFirstVisibleIndex = Math.floor(currentScrollTop / rowHeight);
      setFirstVisibleRowIndex(actualFirstVisibleIndex);

      if (currentScrollTop > prevScrollTop.current) {
        setScrollDirection('down');
      } else if (currentScrollTop < prevScrollTop.current) {
        setScrollDirection('up');
      }
      prevScrollTop.current = currentScrollTop;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const rowDates = weeks[firstVisibleRowIndex] || [];
  const monthSpans = groupDatesByMonth(rowDates);

  const monthCompositionKey = monthSpans.map(span => `${span.month}-${span.year}`).join('_');

  return (
    <div className="flex flex-col gap-2">
      <MonthRow
        monthSpans={monthSpans}
        monthCompositionKey={monthCompositionKey}
        scrollDirection={scrollDirection}
      />

      <div className="relative overflow-visible">
        <WeekColumn virtualRows={rowVirtualizer.getVirtualItems()} weekColumnRef={weekColumnRef} />
        <div ref={calendarRef} className="rounded-2xl overflow-hidden aspect-3/2 shadow-xs">
          <CalendarFrame>
            <div
              ref={containerRef}
              className="relative rounded-[0.9375rem] overflow-auto h-full"
            >
              <div
                className="w-full relative"
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                }}
              >
                <CurrentTimeIndicator virtualListStartDate={virtualListStartDate} containerRef={containerRef} />
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const week = weeks[virtualRow.index];
                  if (!week) return null;

                  return (
                    <div
                      key={virtualRow.index}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className="pb-px"
                    >
                      <div className="grid grid-cols-7 gap-px h-full">
                        {week.map((date, dayIndex) => (
                          <CalendarDay key={dayIndex}>
                            <CalendarDayNumber>{date.getDate()}</CalendarDayNumber>
                          </CalendarDay>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CalendarFrame>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px px-px">
        {DAYS_OF_WEEK.map((day, i) => (
          <div key={i} className="flex items-center justify-center">
            <MicroCopy className="text-foreground-muted font-medium">{day}</MicroCopy>
          </div>
        ))}
      </div>
    </div>
  );
};

export { DashboardCalendar };
