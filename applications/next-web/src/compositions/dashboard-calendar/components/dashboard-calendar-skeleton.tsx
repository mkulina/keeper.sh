import type { FC } from "react";
import { MicroCopy } from "@/components/micro-copy";
import { DAYS_OF_WEEK } from "../utils/constants";

const DashboardCalendarSkeleton: FC = () => {
  return (
    <div className="flex flex-col gap-2">
      <div className="relative h-4" />

      <div className="relative overflow-visible">
        <div className="rounded-2xl overflow-hidden aspect-square shadow-xs">
          <div className="p-px bg-border h-full">
            <div className="relative rounded-[0.9375rem] overflow-hidden h-full bg-surface-elevated dark:bg-background" />
          </div>
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

export { DashboardCalendarSkeleton };
