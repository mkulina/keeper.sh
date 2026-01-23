import type { FC, PropsWithChildren } from "react";

const CalendarDayNumber: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="text-[0.625rem] text-foreground-muted text-left font-semibold mt-auto">
      {children}
    </div>
  );
};

export { CalendarDayNumber };
