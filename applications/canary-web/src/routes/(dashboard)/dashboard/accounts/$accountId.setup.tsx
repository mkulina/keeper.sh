import { createFileRoute } from "@tanstack/react-router";
import useSWR from "swr";
import { BackButton } from "../../../../components/ui/back-button";
import { Text } from "../../../../components/ui/text";
import { DashboardHeading2 } from "../../../../components/ui/dashboard-heading";
import { LinkButton, ButtonText } from "../../../../components/ui/button";
import { apiFetch } from "../../../../lib/fetcher";
import type { CalendarSource } from "../../../../types/api";
import {
  NavigationMenu,
  NavigationMenuEditableItem,
} from "../../../../components/ui/navigation-menu";
import { RouteShell } from "../../../../components/ui/route-shell";

export const Route = createFileRoute(
  "/(dashboard)/dashboard/accounts/$accountId/setup",
)({
  component: AccountSetupPage,
});

function AccountSetupPage() {
  const { accountId } = Route.useParams();

  const { data: allCalendars, isLoading, error, mutate: mutateCalendars } = useSWR<CalendarSource[]>(
    "/api/sources",
  );

  const calendars = (allCalendars ?? []).filter(
    (calendar) => calendar.accountId === accountId,
  );

  if (error || isLoading) {
    return <RouteShell backFallback="/dashboard" isLoading={isLoading} error={error} onRetry={() => mutateCalendars()}>{null}</RouteShell>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <BackButton fallback="/dashboard" />
      <RenameSection calendars={calendars} mutateCalendars={mutateCalendars} />
      <ActionSection accountId={accountId} />
    </div>
  );
}

function RenameSection({
  calendars,
  mutateCalendars,
}: {
  calendars: CalendarSource[];
  mutateCalendars: ReturnType<typeof useSWR<CalendarSource[]>>["mutate"];
}) {
  const handleRename = async (calendarId: string, name: string) => {
    await mutateCalendars(
      async (current) => {
        await apiFetch(`/api/sources/${calendarId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        return current?.map((c) =>
          c.id === calendarId ? { ...c, name } : c,
        );
      },
      { revalidate: false },
    );
  };

  return (
    <>
      <div className="flex flex-col px-0.5 pt-4">
        <DashboardHeading2>Rename Your Calendars</DashboardHeading2>
        <Text size="sm">
          Provider names are often generic. Click a calendar to give it a more
          meaningful name.
        </Text>
      </div>
      <NavigationMenu>
        {calendars.map((calendar, index) => (
          <NavigationMenuEditableItem
            key={calendar.id}
            value={calendar.name}
            autoEdit={index === 0}
            onCommit={(name) => handleRename(calendar.id, name)}
          />
        ))}
      </NavigationMenu>
    </>
  );
}

function ActionSection({ accountId }: { accountId: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <LinkButton
        to={`/dashboard/accounts/${accountId}`}
        className="w-full justify-center"
      >
        <ButtonText>Configure</ButtonText>
      </LinkButton>
      <LinkButton
        to="/dashboard"
        variant="ghost"
        className="w-full justify-center"
      >
        <ButtonText>Skip Configuration</ButtonText>
      </LinkButton>
    </div>
  );
}
