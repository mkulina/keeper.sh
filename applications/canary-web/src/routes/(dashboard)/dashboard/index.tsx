import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import useSWR from "swr";
import { CalendarPlus, CalendarSync, CalendarDays, Settings, Sparkles, LogOut, Bell, Eye } from "lucide-react";
import { signOut } from "../../../lib/auth";
import KeeperLogo from "../../../assets/keeper.svg?react";
import { EventGraph } from "../../../components/dashboard/event-graph";
import { ProviderIcon } from "../../../components/ui/provider-icon";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuItemIcon,
  NavigationMenuItemLabel,
  NavigationMenuItemTrailing,
  NavigationMenuCheckboxItem,
  NavigationMenuToggleItem,
} from "../../../components/ui/navigation-menu";
import { Text } from "../../../components/ui/text";
import { getAccountLabel } from "../../../utils/accounts";

export const Route = createFileRoute("/(dashboard)/dashboard/")({
  component: RouteComponent,
});

interface CalendarSource {
  id: string;
  name: string;
  calendarType: string;
  capabilities: string[];
  accountId: string;
  provider: string;
  displayName: string | null;
  email: string | null;
}

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) throw new Error("Failed to fetch");
  return response.json();
};

function RouteComponent() {
  const navigate = useNavigate();
  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login" });
  };
  const [notifications, setNotifications] = useState(true);
  const [publicProfile, setPublicProfile] = useState(false);
  const { data: calendarsData } = useSWR<CalendarSource[]>("/api/sources", fetcher);
  const calendars = calendarsData ?? [];

  return (
    <div className="flex flex-col gap-4">
      <EventGraph />
      <div className="flex flex-col gap-1.5">
        <NavigationMenu>
          <NavigationMenuItem to="/dashboard/connect">
            <NavigationMenuItemIcon>
              <CalendarPlus size={15} />
              <NavigationMenuItemLabel>Link Calendar</NavigationMenuItemLabel>
            </NavigationMenuItemIcon>
            <NavigationMenuItemTrailing />
          </NavigationMenuItem>
        </NavigationMenu>
        <NavigationMenu>
          {calendars.map((calendar) => (
            <NavigationMenuItem key={calendar.id} to={`/dashboard/accounts/${calendar.accountId}/${calendar.id}`}>
              <div className="flex items-center gap-2 shrink-0">
                <ProviderIcon provider={calendar.provider} calendarType={calendar.calendarType} />
                <Text size="sm" tone="muted">{calendar.name}</Text>
              </div>
              <div className="min-w-0">
                <Text size="sm" tone="muted" className="truncate">
                  {getAccountLabel(calendar)}
                </Text>
              </div>
            </NavigationMenuItem>
          ))}
        </NavigationMenu>
        {calendars.length > 0 && (
          <NavigationMenu>
            <NavigationMenuItem to="/dashboard/calendars">
              <NavigationMenuItemIcon>
                <CalendarSync size={15} />
                <NavigationMenuItemLabel>Sync Settings</NavigationMenuItemLabel>
              </NavigationMenuItemIcon>
              <NavigationMenuItemTrailing />
            </NavigationMenuItem>
          </NavigationMenu>
        )}
        <NavigationMenu>
          <NavigationMenuItem to="/dashboard/events">
            <NavigationMenuItemIcon>
              <CalendarDays size={15} />
              <NavigationMenuItemLabel>View Events</NavigationMenuItemLabel>
            </NavigationMenuItemIcon>
            <NavigationMenuItemTrailing />
          </NavigationMenuItem>
        </NavigationMenu>
        <NavigationMenu>
          <NavigationMenuToggleItem checked={notifications} onCheckedChange={setNotifications}>
            <NavigationMenuItemIcon>
              <Bell size={15} />
              <NavigationMenuItemLabel>Notifications</NavigationMenuItemLabel>
            </NavigationMenuItemIcon>
          </NavigationMenuToggleItem>
          <NavigationMenuCheckboxItem checked={publicProfile} onCheckedChange={setPublicProfile}>
            <NavigationMenuItemIcon>
              <Eye size={15} />
              <NavigationMenuItemLabel>Public Profile</NavigationMenuItemLabel>
            </NavigationMenuItemIcon>
          </NavigationMenuCheckboxItem>
        </NavigationMenu>
        <NavigationMenu variant="highlight">
          <NavigationMenuItem to="/dashboard/upgrade">
            <NavigationMenuItemIcon>
              <Sparkles size={15} />
              <NavigationMenuItemLabel>Upgrade Account</NavigationMenuItemLabel>
            </NavigationMenuItemIcon>
            <NavigationMenuItemTrailing />
          </NavigationMenuItem>
        </NavigationMenu>
        <NavigationMenu>
          <NavigationMenuItem to="/dashboard/settings">
            <NavigationMenuItemIcon>
              <Settings size={15} />
              <NavigationMenuItemLabel>Settings</NavigationMenuItemLabel>
            </NavigationMenuItemIcon>
            <NavigationMenuItemTrailing />
          </NavigationMenuItem>
          <NavigationMenuItem onClick={handleLogout}>
            <NavigationMenuItemIcon>
              <LogOut size={15} />
              <NavigationMenuItemLabel>Logout</NavigationMenuItemLabel>
            </NavigationMenuItemIcon>
          </NavigationMenuItem>
        </NavigationMenu>
      </div>
      <KeeperLogo className="size-8 text-border-elevated self-center" />
    </div>
  );
}
