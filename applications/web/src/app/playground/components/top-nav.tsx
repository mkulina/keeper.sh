"use client";

import type { FC, ReactNode } from "react";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { Home, Calendar, List, Settings } from "lucide-react";
import { cn } from "../utils/cn";

interface TopNavItemProps {
  href: string;
  segment: string | null;
  icon: ReactNode;
  children: string;
}

const TopNavItem: FC<TopNavItemProps> = ({ href, segment, icon, children }) => {
  const selectedSegment = useSelectedLayoutSegment();
  const isActive = selectedSegment === segment;

  return (
    <Link
      draggable={false}
      href={href}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs",
        isActive
          ? "text-neutral-900 bg-neutral-100"
          : "text-neutral-500 hover:text-neutral-800"
      )}
    >
      {icon}
      {children}
    </Link>
  );
};

const TopNav: FC = () => {
  return (
    <nav className="flex items-center gap-px mb-8 -mx-2.5">
      <TopNavItem href="/playground/dashboard" segment={null} icon={<Home size={14} />}>
        Home
      </TopNavItem>
      <TopNavItem href="/playground/dashboard/agenda" segment="agenda" icon={<List size={14} />}>
        Agenda
      </TopNavItem>
      <TopNavItem href="/playground/dashboard/calendars" segment="calendars" icon={<Calendar size={14} />}>
        Calendars
      </TopNavItem>
      <TopNavItem href="/playground/dashboard/settings" segment="settings" icon={<Settings size={14} />}>
        Settings
      </TopNavItem>
    </nav>
  );
};

export { TopNav };
