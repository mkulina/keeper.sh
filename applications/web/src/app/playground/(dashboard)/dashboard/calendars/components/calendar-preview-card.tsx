"use client";

import type { FC } from "react";
import Image from "next/image";
import { AlertTriangle, Check, RefreshCw } from "lucide-react";
import { cn } from "../../../../utils/cn";

interface CalendarEvent {
  id: string;
  name: string;
  startTime: Date;
  endTime: Date;
}

interface CalendarPreviewCardProps {
  id: string;
  name: string;
  email: string;
  provider: {
    id: string;
    name: string;
    icon: string;
  };
  eventCount: number;
  status: "synced" | "syncing" | "error" | "reauthenticate";
  events: CalendarEvent[];
}

const StatusIcon: FC<{ status: "synced" | "syncing" | "error" | "reauthenticate" }> = ({ status }) => {
  if (status === "syncing") {
    return <RefreshCw size={14} className="text-neutral-400 animate-spin" />;
  }
  if (status === "synced") {
    return <Check size={14} className="text-neutral-400" />;
  }
  if (status === "reauthenticate") {
    return <AlertTriangle size={14} className="text-amber-400" />;
  }
  return <div className="size-1 rounded-xl bg-red-500" />;
};

const formatTime = (date: Date): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
};

const formatEventCount = (count: number): string => {
  if (count === 1) {
    return "1 event";
  }
  return `${count} events`;
};

interface MicroEventItemProps {
  event: CalendarEvent;
}

const MicroEventItem: FC<MicroEventItemProps> = ({ event }) => (
  <div className="flex items-center gap-2 py-1.5 px-2 hover:bg-neutral-50 rounded-lg transition-colors">
    <div className="flex flex-col flex-1 min-w-0">
      <span className="text-xs text-neutral-900 truncate">{event.name}</span>
      <span className="text-[10px] text-neutral-400 tabular-nums">
        {formatTime(event.startTime)} - {formatTime(event.endTime)}
      </span>
    </div>
  </div>
);

const CalendarPreviewCard: FC<CalendarPreviewCardProps> = ({
  name,
  email,
  provider,
  eventCount,
  status,
  events,
}) => (
  <div className="flex flex-col border border-neutral-200 rounded-xl bg-white overflow-hidden">
    {/* Header */}
    <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-200">
      <Image
        src={provider.icon}
        alt={provider.name}
        width={16}
        height={16}
      />
      <span className="text-sm font-medium text-neutral-900 flex-1">{name}</span>
      <StatusIcon status={status} />
    </div>

    {/* Micro-agenda scrollable area */}
    <div className="flex flex-col overflow-y-auto max-h-[240px] px-2 py-2">
      {events.length > 0 ? (
        events.map((event) => (
          <MicroEventItem key={event.id} event={event} />
        ))
      ) : (
        <div className="flex items-center justify-center py-8 text-xs text-neutral-400">
          No upcoming events
        </div>
      )}
    </div>

    {/* Footer */}
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-neutral-200 bg-neutral-50">
      <span className="text-xs text-neutral-600">{email}</span>
      <span className="text-xs text-neutral-400">{formatEventCount(eventCount)}</span>
    </div>
  </div>
);

export { CalendarPreviewCard };
export type { CalendarPreviewCardProps, CalendarEvent };
