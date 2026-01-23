import type { FC, PropsWithChildren } from "react";

const CalendarFrame: FC<PropsWithChildren> = ({ children }) => {
  return <div className="p-px bg-border h-full">{children}</div>;
};

export { CalendarFrame };
