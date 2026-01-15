import type { FC, PropsWithChildren } from "react";
import { Dock, DockItem } from "../../components/dock";
import { Scaffold } from "../../components/scaffold";
import { TopNav } from "../../components/top-nav";

const DashboardLayout: FC<PropsWithChildren> = ({ children }) => (
  <>
    <Scaffold>
      <div className="flex flex-col pt-8 pb-8">
        <TopNav />
        {children}
      </div>
    </Scaffold>
    <Dock>
      <DockItem href="/playground/dashboard" segment={null} icon="HomeIcon" />
      <DockItem href="/playground/dashboard/agenda" segment="agenda" icon="ListIcon" />
      <DockItem href="/playground/dashboard/calendars" segment="calendars" icon="CalendarsIcon" />
      <DockItem href="/playground/dashboard/settings" segment="settings" icon="BoltIcon" />
    </Dock>
  </>
);

export default DashboardLayout;
