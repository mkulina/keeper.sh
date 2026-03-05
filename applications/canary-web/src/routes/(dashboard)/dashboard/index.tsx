import { createFileRoute, useNavigate } from "@tanstack/react-router";
import useSWR, { preload } from "swr";
import { Calendar, CalendarPlus, CalendarSync, CalendarDays, Settings, Sparkles, LogOut, LoaderCircle } from "lucide-react";
import { ErrorState } from "../../../components/ui/error-state";
import { signOut } from "../../../lib/auth";
import { fetcher } from "../../../lib/fetcher";
import KeeperLogo from "../../../assets/keeper.svg?react";
import { EventGraph } from "../../../components/dashboard/event-graph";
import { ProviderIcon } from "../../../components/ui/provider-icon";
import type { CalendarAccount, CalendarSource } from "../../../types/api";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuItemIcon,
  NavigationMenuItemLabel,
  NavigationMenuItemTrailing,
  NavigationMenuPopover,
} from "../../../components/ui/navigation-menu";
import { Text } from "../../../components/ui/text";
import { ProviderIconStack } from "../../../components/ui/provider-icon-stack";
import { getAccountLabel } from "../../../utils/accounts";
import { User } from "lucide-react";

export const Route = createFileRoute("/(dashboard)/dashboard/")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  const { data: accountsData } = useSWR<CalendarAccount[]>("/api/accounts");
  const accounts = accountsData ?? [];

  const { data: calendarsData, isLoading: calendarsLoading, error, mutate: mutateCalendars } = useSWR<CalendarSource[]>("/api/sources");
  const calendars = calendarsData ?? [];

  return (
    <div className="flex flex-col">
      <EventGraph />
      <div className="flex flex-col gap-1.5">
        <NavigationMenu>
          <NavigationMenuPopover
            trigger={
              <>
                <NavigationMenuItemIcon>
                  <User size={15} />
                </NavigationMenuItemIcon>
                <NavigationMenuItemLabel>Calendar Accounts</NavigationMenuItemLabel>
                <NavigationMenuItemTrailing>
                  <ProviderIconStack providers={accounts} />
                </NavigationMenuItemTrailing>
              </>
            }
          >
            {accounts.map((account) => (
              <NavigationMenuItem
                key={account.id}
                to={`/dashboard/accounts/${account.id}`}
              >
                <NavigationMenuItemIcon>
                  <ProviderIcon provider={account.provider} />
                </NavigationMenuItemIcon>
                <NavigationMenuItemLabel>{getAccountLabel(account)}</NavigationMenuItemLabel>
                <NavigationMenuItemTrailing />
              </NavigationMenuItem>
            ))}
          </NavigationMenuPopover>
          <NavigationMenuItem to="/dashboard/connect">
            <NavigationMenuItemIcon>
              <CalendarPlus size={15} />
            </NavigationMenuItemIcon>
            <NavigationMenuItemLabel>Link Calendar Account</NavigationMenuItemLabel>
            <NavigationMenuItemTrailing />
          </NavigationMenuItem>
        </NavigationMenu>
        <NavigationMenu>
          <NavigationMenuPopover
            trigger={
              <>
                <NavigationMenuItemIcon>
                  <Calendar size={15} />
                </NavigationMenuItemIcon>
                <NavigationMenuItemLabel>Calendars</NavigationMenuItemLabel>
                <NavigationMenuItemTrailing>
                  <ProviderIconStack providers={calendars} />
                </NavigationMenuItemTrailing>
              </>
            }
          >
            {error && <ErrorState message="Failed to load calendars." onRetry={() => mutateCalendars()} />}
            {calendarsLoading && (
              <div className="flex justify-center py-4">
                <LoaderCircle size={16} className="animate-spin text-foreground-muted" />
              </div>
            )}
            {calendars.map((calendar) => (
              <NavigationMenuItem
                key={calendar.id}
                to={`/dashboard/accounts/${calendar.accountId}/${calendar.id}`}
                onMouseEnter={() => {
                  preload(`/api/accounts/${calendar.accountId}`, fetcher);
                  preload(`/api/sources/${calendar.id}`, fetcher);
                }}
              >
                <NavigationMenuItemIcon>
                  <ProviderIcon provider={calendar.provider} calendarType={calendar.calendarType} />
                </NavigationMenuItemIcon>
                <NavigationMenuItemLabel className="shrink-0">{calendar.name}</NavigationMenuItemLabel>
                <NavigationMenuItemTrailing className="overflow-hidden">
                  <Text size="sm" tone="muted" className="flex-1 min-w-0 truncate text-right">
                    {getAccountLabel(calendar)}
                  </Text>
                </NavigationMenuItemTrailing>
              </NavigationMenuItem>
            ))}
          </NavigationMenuPopover>
        </NavigationMenu>
        {calendars.length > 0 && (
          <NavigationMenu>
            <NavigationMenuItem to="/dashboard/calendars">
              <NavigationMenuItemIcon>
                <CalendarSync size={15} />
              </NavigationMenuItemIcon>
              <NavigationMenuItemLabel>Sync Settings</NavigationMenuItemLabel>
              <NavigationMenuItemTrailing />
            </NavigationMenuItem>
          </NavigationMenu>
        )}
        <NavigationMenu>
          <NavigationMenuItem to="/dashboard/events">
            <NavigationMenuItemIcon>
              <CalendarDays size={15} />
            </NavigationMenuItemIcon>
            <NavigationMenuItemLabel>View Events</NavigationMenuItemLabel>
            <NavigationMenuItemTrailing />
          </NavigationMenuItem>
        </NavigationMenu>
        <NavigationMenu variant="highlight">
          <NavigationMenuItem to="/dashboard/upgrade">
            <NavigationMenuItemIcon>
              <Sparkles size={15} />
            </NavigationMenuItemIcon>
            <NavigationMenuItemLabel>Upgrade Account</NavigationMenuItemLabel>
            <NavigationMenuItemTrailing />
          </NavigationMenuItem>
        </NavigationMenu>
        <NavigationMenu>
          <NavigationMenuItem to="/dashboard/settings">
            <NavigationMenuItemIcon>
              <Settings size={15} />
            </NavigationMenuItemIcon>
            <NavigationMenuItemLabel>Settings</NavigationMenuItemLabel>
            <NavigationMenuItemTrailing />
          </NavigationMenuItem>
          <NavigationMenuItem onClick={handleLogout}>
            <NavigationMenuItemIcon>
              <LogOut size={15} />
            </NavigationMenuItemIcon>
            <NavigationMenuItemLabel>Logout</NavigationMenuItemLabel>
          </NavigationMenuItem>
        </NavigationMenu>
      </div>
      <div className="pt-8 flex justify-center">
        <KeeperLogo className="size-8 text-border-elevated self-center" />
      </div>
    </div>
  );
}
