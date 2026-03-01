"use client";

import type { FC } from "react";
import { useState, useEffect } from "react";
import { useDashboardCalendar } from "./dashboard-calendar-context";

const MAGIC_NUMBER_MINUTES_IN_DAY = 24 * 60;
const MAGIC_NUMBER_MILLISECONDS_IN_MINUTE = 60_000;
const MAGIC_NUMBER_MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24;
const MAGIC_NUMBER_DAYS_IN_WEEK = 7;
const MAGIC_NUMBER_VISIBLE_WEEKS = 4;
const MAGIC_NUMBER_ROW_HEIGHT_OFFSET = 1;
const MAGIC_NUMBER_PERCENTAGE_BASE = 100;

const CurrentTimeIndicator: FC = () => {
  const { state, meta } = useDashboardCalendar();
  const { virtualListStartDate } = state;
  const { containerRef } = meta;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const initialTimeProgress = (hours * 60 + minutes) / MAGIC_NUMBER_MINUTES_IN_DAY;

  const [timeProgress, setTimeProgress] = useState(initialTimeProgress);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      setTimeProgress((hours * 60 + minutes) / MAGIC_NUMBER_MINUTES_IN_DAY);
    }, MAGIC_NUMBER_MILLISECONDS_IN_MINUTE);

    return () => clearInterval(interval);
  }, []);

  const diffTime = today.getTime() - virtualListStartDate.getTime();
  const diffDays = Math.floor(diffTime / MAGIC_NUMBER_MILLISECONDS_IN_DAY);

  if (diffDays < 0) {
    return null;
  }

  const row = Math.floor(diffDays / MAGIC_NUMBER_DAYS_IN_WEEK);
  const col = diffDays % MAGIC_NUMBER_DAYS_IN_WEEK;

  const containerHeight = containerRef.current?.clientHeight || 0;
  const rowHeight = (containerHeight / MAGIC_NUMBER_VISIBLE_WEEKS) + MAGIC_NUMBER_ROW_HEIGHT_OFFSET;
  const cellWidth = MAGIC_NUMBER_PERCENTAGE_BASE / MAGIC_NUMBER_DAYS_IN_WEEK;

  const top = row * rowHeight + timeProgress * rowHeight;
  const left = `${col * cellWidth}%`;
  const width = `${cellWidth}%`;

  return (
    <div
      className="absolute z-10 pointer-events-none"
      style={{
        top: `${top}px`,
        left,
        width,
      }}
    >
      <div className="relative flex items-center">
        <div className="absolute -left-1 size-2 rounded-xl bg-red-400" />
        <div className="w-full h-px bg-red-400" />
      </div>
    </div>
  );
};

export { CurrentTimeIndicator };
