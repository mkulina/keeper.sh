import type { FC, PropsWithChildren } from "react";

const CalendarDay: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="relative overflow-hidden bg-surface-elevated dark:bg-background p-2.5 flex flex-col">
      {children}
    </div>
  );
};

export { CalendarDay };
