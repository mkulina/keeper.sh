import { createFileRoute, useNavigate } from "@tanstack/react-router";
import useSWR, { preload } from "swr";
import { AnimatedReveal } from "../../../components/ui/primitives/animated-reveal";
import { Calendar, CalendarPlus, CalendarDays, Settings, Sparkles, LogOut, LoaderCircle, User } from "lucide-react";
import { ErrorState } from "../../../components/ui/primitives/error-state";
import { signOut } from "../../../lib/auth";
import { fetcher } from "../../../lib/fetcher";
import KeeperLogo from "../../../assets/keeper.svg?react";
import { EventGraph } from "../../../features/dashboard/components/event-graph";
import { ProviderIcon } from "../../../components/ui/primitives/provider-icon";
import type { CalendarAccount, CalendarSource } from "../../../types/api";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuItemIcon,
  NavigationMenuItemLabel,
  NavigationMenuItemTrailing,
} from "../../../components/ui/composites/navigation-menu/navigation-menu-items";
import { NavigationMenuPopover } from "../../../components/ui/composites/navigation-menu/navigation-menu-popover";
import { Text } from "../../../components/ui/primitives/text";
import { ProviderIconStack } from "../../../components/ui/primitives/provider-icon-stack";
import { getAccountLabel } from "../../../utils/accounts";
import { pluralize } from "../../../lib/pluralize";
import { useAnimatedSWR } from "../../../hooks/use-animated-swr";

export const Route = createFileRoute("/(dashboard)/dashboard/")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="flex flex-col">
      <EventGraph />
      <div className="flex flex-col gap-1.5">
        <NavigationMenu>
          <NavigationMenuItem to="/dashboard/connect">
            <NavigationMenuItemIcon>
              <CalendarPlus size={15} />
            </NavigationMenuItemIcon>
            <NavigationMenuItemLabel>Import Calendars</NavigationMenuItemLabel>
            <NavigationMenuItemTrailing />
          </NavigationMenuItem>
        </NavigationMenu>
        <CalendarsMenu />
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
          <AccountsPopover />
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

function CalendarsMenu() {
  const { data: calendarsData, shouldAnimate: animateCalendars, isLoading: calendarsLoading, error, mutate: mutateCalendars } = useAnimatedSWR<CalendarSource[]>("/api/sources");
  const calendars = calendarsData ?? [];

  const { data: eventCountData, error: eventCountError } = useSWR<{ count: number }>("/api/events/count");
  const eventCount = eventCountError ? undefined : eventCountData?.count;

  return (
    <NavigationMenu>
      <NavigationMenuPopover
        disabled={calendars.length === 0 && !calendarsLoading}
        trigger={
          <>
            <NavigationMenuItemIcon>
              <Calendar size={15} />
            </NavigationMenuItemIcon>
            <NavigationMenuItemLabel>
              {calendars.length > 0 ? "Calendars" : "No Calendars"}
            </NavigationMenuItemLabel>
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
      <AnimatedReveal show={calendars.length > 0} skipInitial={!animateCalendars}>
        <NavigationMenuItem to="/dashboard/events">
          <NavigationMenuItemIcon>
            <CalendarDays size={15} />
          </NavigationMenuItemIcon>
          <NavigationMenuItemLabel>View Events</NavigationMenuItemLabel>
          <NavigationMenuItemTrailing>
            {eventCount != null && <Text size="sm" tone="muted">{pluralize(eventCount, "event")}</Text>}
          </NavigationMenuItemTrailing>
        </NavigationMenuItem>
      </AnimatedReveal>
    </NavigationMenu>
  );
}

function AccountsPopover() {
  const { data: accountsData, isLoading: accountsLoading, error: accountsError, mutate: mutateAccounts } = useAnimatedSWR<CalendarAccount[]>("/api/accounts");
  const accounts = accountsData ?? [];

  return (
    <NavigationMenuPopover
      disabled={accounts.length === 0 && !accountsLoading}
      trigger={
        <>
          <NavigationMenuItemIcon>
            <User size={15} />
          </NavigationMenuItemIcon>
          <NavigationMenuItemLabel>
            {accounts.length > 0 ? "Calendar Sources" : "No Calendar Sources"}
          </NavigationMenuItemLabel>
          <NavigationMenuItemTrailing>
            <ProviderIconStack providers={accounts} />
          </NavigationMenuItemTrailing>
        </>
      }
    >
      {accountsError && <ErrorState message="Failed to load accounts." onRetry={() => mutateAccounts()} />}
      {accountsLoading && (
        <div className="flex justify-center py-4">
          <LoaderCircle size={16} className="animate-spin text-foreground-muted" />
        </div>
      )}
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
  );
}
