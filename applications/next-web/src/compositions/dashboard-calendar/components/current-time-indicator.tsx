"use client";

import type { FC } from "react";
import { useState, useEffect } from "react";

interface CurrentTimeIndicatorProps {
  virtualListStartDate: Date;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const CurrentTimeIndicator: FC<CurrentTimeIndicatorProps> = ({ virtualListStartDate, containerRef }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const initialTimeProgress = (hours * 60 + minutes) / (24 * 60);

  const [timeProgress, setTimeProgress] = useState(initialTimeProgress);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      setTimeProgress((hours * 60 + minutes) / (24 * 60));
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  const diffTime = today.getTime() - virtualListStartDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return null;
  }

  const row = Math.floor(diffDays / 7);
  const col = diffDays % 7;

  const containerHeight = containerRef.current?.clientHeight || 0;
  const rowHeight = (containerHeight / 3) + 1;
  const cellWidth = 100 / 7;

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
