import { createFileRoute } from "@tanstack/react-router";
import useSWR from "swr";
import { LoaderCircle } from "lucide-react";
import { BackButton } from "../../../../components/ui/back-button";
import { Text } from "../../../../components/ui/text";
import { getAccountLabel } from "../../../../utils/accounts";
import {
  NavigationMenu,
  NavigationMenuEditableItem,
  NavigationMenuItem,
} from "../../../../components/ui/navigation-menu";

export const Route = createFileRoute(
  "/(dashboard)/dashboard/accounts/$accountId/$calendarId",
)({
  component: RouteComponent,
});

interface CalendarAccount {
  id: string;
  provider: string;
  displayName: string | null;
  email: string | null;
}

interface CalendarDetail {
  id: string;
  name: string;
  calendarType: string;
  capabilities: string[];
  provider: string;
  url: string | null;
  calendarUrl: string | null;
  excludeWorkingLocation: boolean;
  excludeFocusTime: boolean;
  excludeOutOfOffice: boolean;
  createdAt: string;
  updatedAt: string;
}

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) throw new Error("Failed to fetch");
  return response.json();
};

function RouteComponent() {
  const { accountId, calendarId } = Route.useParams();
  const { data: account } = useSWR<CalendarAccount>(`/api/accounts/${accountId}`, fetcher);
  const {
    data: calendar,
    isLoading,
    mutate: mutateCalendar,
  } = useSWR<CalendarDetail>(`/api/sources/${calendarId}`, fetcher);

  if (isLoading || !calendar || !account) {
    return (
      <div className="flex flex-col gap-1.5">
        <BackButton fallback={`/dashboard/accounts/${accountId}`} />
        <div className="flex justify-center py-6">
          <LoaderCircle
            size={20}
            className="animate-spin text-foreground-muted"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <BackButton fallback={`/dashboard/accounts/${accountId}`} />
      <NavigationMenu>
        <NavigationMenuEditableItem
          value={calendar.name}
          onCommit={async (name) => {
            await mutateCalendar(
              async (current) => {
                await fetch(`/api/sources/${calendarId}`, {
                  method: "PATCH",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name }),
                });
                return current ? { ...current, name } : current;
              },
              {
                optimisticData: { ...calendar, name },
                rollbackOnError: true,
                revalidate: false,
              },
            );
          }}
        />
      </NavigationMenu>
      <NavigationMenu>
        <NavigationMenuItem>
          <Text size="sm" tone="muted" className="shrink-0">Resource Type</Text>
          <Text size="sm" tone="muted">Calendar</Text>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Text size="sm" tone="muted" className="shrink-0">Type</Text>
          <Text size="sm" tone="muted">{calendar.calendarType}</Text>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Text size="sm" tone="muted" className="shrink-0">Capabilities</Text>
          <Text size="sm" tone="muted">{calendar.capabilities.join(", ")}</Text>
        </NavigationMenuItem>
        {calendar.url && (
          <NavigationMenuItem>
            <Text size="sm" tone="muted" className="shrink-0">URL</Text>
            <div className="min-w-0">
              <Text size="sm" tone="muted" className="truncate">{calendar.url}</Text>
            </div>
          </NavigationMenuItem>
        )}
        {calendar.calendarUrl && (
          <NavigationMenuItem>
            <Text size="sm" tone="muted" className="shrink-0">Calendar URL</Text>
            <div className="min-w-0">
              <Text size="sm" tone="muted" className="truncate">{calendar.calendarUrl}</Text>
            </div>
          </NavigationMenuItem>
        )}
        <NavigationMenuItem>
          <Text size="sm" tone="muted" className="shrink-0">Added</Text>
          <Text size="sm" tone="muted">{new Date(calendar.createdAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</Text>
        </NavigationMenuItem>
        <NavigationMenuItem to={`/dashboard/accounts/${accountId}`}>
          <Text size="sm" tone="muted" className="shrink-0">Account</Text>
          <div className="min-w-0">
            <Text size="sm" tone="muted" className="truncate">{getAccountLabel(account)}</Text>
          </div>
        </NavigationMenuItem>
      </NavigationMenu>
    </div>
  );
}
