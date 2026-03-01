"use client";

import type { FC } from "react";
import { MicroCopy } from "@/components/micro-copy";
import { CalendarFrame } from "./calendar-frame";
import { CalendarDay } from "./calendar-day";
import { CalendarDayNumber } from "./calendar-day-number";
import { CurrentTimeIndicator } from "./current-time-indicator";
import { WeekColumn } from "./week-column";
import { MonthRow } from "./month-row";
import { DAYS_OF_WEEK } from "../utils/constants";
import { useDashboardCalendar } from "./dashboard-calendar-context";

const DashboardCalendarGrid: FC = () => {
  const { state, meta } = useDashboardCalendar();
  const { isReady, weeks } = state;
  const { containerRef, rowVirtualizer } = meta;

  return (
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
        {isReady && <CurrentTimeIndicator />}
        {isReady &&
          rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const week = weeks[virtualRow.index];
            if (!week) return null;

            return (
              <div
                key={virtualRow.index}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
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
  );
};

const DashboardCalendarFrame: FC<{ isReady: boolean }> = ({ isReady }) => {
  const { meta } = useDashboardCalendar();
  const { calendarRef } = meta;

  return (
    <div
      ref={calendarRef}
      className="rounded-2xl overflow-hidden aspect-square shadow-xs"
    >
      <CalendarFrame>
        <div className="relative h-full">
          {!isReady && (
            <div className="absolute inset-0 z-10 rounded-[0.9375rem] bg-surface-elevated dark:bg-background" />
          )}
          <DashboardCalendarGrid />
        </div>
      </CalendarFrame>
    </div>
  );
};

const DashboardCalendarDaysOfWeek: FC = () => {
  return (
    <div className="grid grid-cols-7 gap-px px-px">
      {DAYS_OF_WEEK.map((day, i) => (
        <div key={i} className="flex items-center justify-center">
          <MicroCopy className="text-foreground-muted font-medium">
            {day}
          </MicroCopy>
        </div>
      ))}
    </div>
  );
};

const DashboardCalendar: FC = () => {
  const { state } = useDashboardCalendar();
  const { isReady } = state;

  return (
    <div className="flex flex-col gap-2">
      {isReady ? <MonthRow /> : <div className="relative h-4" />}

      <div className="relative overflow-visible">
        {isReady && <WeekColumn />}
        <DashboardCalendarFrame isReady={isReady} />
      </div>

      <DashboardCalendarDaysOfWeek />
    </div>
  );
};

export {
  DashboardCalendar,
  DashboardCalendarGrid,
  DashboardCalendarFrame,
  DashboardCalendarDaysOfWeek,
};
