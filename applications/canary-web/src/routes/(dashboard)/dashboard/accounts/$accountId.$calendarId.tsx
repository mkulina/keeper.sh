import { createFileRoute } from "@tanstack/react-router";
import useSWR from "swr";
import { BackButton } from "../../../../components/ui/back-button";
import { RouteShell } from "../../../../components/ui/route-shell";
import { MetadataRow } from "../../../../components/dashboard/metadata-row";
import { CalendarCheckboxList } from "../../../../components/dashboard/calendar-checkbox-list";
import { apiFetch } from "../../../../lib/fetcher";
import { formatDate } from "../../../../lib/time";
import { getAccountLabel } from "../../../../utils/accounts";
import { canPull, canPush } from "../../../../utils/calendars";
import type { CalendarAccount, CalendarDetail, CalendarSource } from "../../../../types/api";
import {
  NavigationMenu,
  NavigationMenuEditableItem,
  NavigationMenuToggleItem,
  NavigationMenuItemLabel,
} from "../../../../components/ui/navigation-menu";
import { DashboardHeading2 } from "../../../../components/ui/dashboard-heading";
import { Text } from "../../../../components/ui/text";

export const Route = createFileRoute(
  "/(dashboard)/dashboard/accounts/$accountId/$calendarId",
)({
  component: CalendarDetailPage,
});

function patchIfPresent<T>(current: T | undefined, patch: Partial<T>): T | undefined {
  if (current) return { ...current, ...patch };
  return current;
}

type ExcludeField = keyof Pick<CalendarDetail, "excludeAllDayEvents" | "excludeEventDescription" | "excludeEventLocation" | "excludeEventName" | "excludeFocusTime" | "excludeOutOfOffice" | "excludeWorkingLocation">;

interface SyncSetting {
  field: ExcludeField;
  label: string;
  /** When true, toggle ON = field is true (direct). When false, toggle ON = field is false (inverted). */
  matchesField: boolean;
}

/** Sync settings — available for all pull-capable calendars. */
const SYNC_SETTINGS: SyncSetting[] = [
  { field: "excludeAllDayEvents", label: "Exclude All Day Events", matchesField: true },
  { field: "excludeEventName", label: "Sync Event Name", matchesField: false },
  { field: "excludeEventDescription", label: "Sync Event Description", matchesField: false },
  { field: "excludeEventLocation", label: "Sync Event Location", matchesField: false },
];

/** Provider-specific sync settings (currently Google Calendar only). */
const PROVIDER_SYNC_SETTINGS: SyncSetting[] = [
  { field: "excludeFocusTime", label: "Exclude Focus Time Events", matchesField: true },
  { field: "excludeWorkingLocation", label: "Exclude Working Location Events", matchesField: true },
  { field: "excludeOutOfOffice", label: "Exclude Out of Office Events", matchesField: true },
];

/** Providers that have additional sync settings. */
const PROVIDERS_WITH_EXTRA_SETTINGS = new Set(["google"]);

function CalendarDetailPage() {
  const { accountId, calendarId } = Route.useParams();
  const { data: account, isLoading: accountLoading, error: accountError, mutate: mutateAccount } = useSWR<CalendarAccount>(`/api/accounts/${accountId}`);
  const {
    data: calendar,
    isLoading: calendarLoading,
    error: calendarError,
    mutate: mutateCalendar,
  } = useSWR<CalendarDetail>(`/api/sources/${calendarId}`);

  const { data: allCalendars } = useSWR<CalendarSource[]>("/api/sources");

  const { data: destinationsData, mutate: mutateDestinations } = useSWR<{ destinationIds: string[] }>(
    `/api/sources/${calendarId}/destinations`,
  );

  const isLoading = accountLoading || calendarLoading;
  const error = accountError || calendarError;

  const handleRenameCalendar = async (name: string) => {
    await mutateCalendar(
      async (current) => {
        await apiFetch(`/api/sources/${calendarId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        return patchIfPresent(current, { name });
      },
      {
        optimisticData: patchIfPresent(calendar, { name }),
        rollbackOnError: true,
        revalidate: false,
      },
    );
  };

  const handleToggleDestination = async (destinationId: string, checked: boolean) => {
    const currentIds = destinationsData?.destinationIds ?? [];
    const updatedIds = checked
      ? [...currentIds, destinationId]
      : currentIds.filter((id) => id !== destinationId);

    await mutateDestinations(
      async () => {
        await apiFetch(`/api/sources/${calendarId}/destinations`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ calendarIds: updatedIds }),
        });
        return { destinationIds: updatedIds };
      },
      {
        optimisticData: { destinationIds: updatedIds },
        rollbackOnError: true,
        revalidate: false,
      },
    );
  };

  const handleTogglePreference = async (
    excludeField: ExcludeField,
    checked: boolean,
    matchesField: boolean,
  ) => {
    const excludeValue = matchesField ? checked : !checked;

    await mutateCalendar(
      async (current) => {
        await apiFetch(`/api/sources/${calendarId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [excludeField]: excludeValue }),
        });
        return patchIfPresent(current, { [excludeField]: excludeValue });
      },
      {
        optimisticData: patchIfPresent(calendar, { [excludeField]: excludeValue }),
        rollbackOnError: true,
        revalidate: false,
      },
    );
  };

  if (error || isLoading || !calendar || !account) {
    return <RouteShell backFallback={`/dashboard/accounts/${accountId}`} isLoading={isLoading || !calendar || !account} error={error} onRetry={async () => { await Promise.all([mutateAccount(), mutateCalendar()]); }}>{null}</RouteShell>;
  }

  const isPullCapable = canPull(calendar);
  const isPushCapable = canPush(calendar);
  const hasExtraSettings = PROVIDERS_WITH_EXTRA_SETTINGS.has(calendar.provider);
  const syncSettings = hasExtraSettings
    ? [...SYNC_SETTINGS, ...PROVIDER_SYNC_SETTINGS]
    : SYNC_SETTINGS;

  const pushCalendars = (allCalendars ?? [])
    .filter((c) => canPush(c) && c.id !== calendarId);

  const selectedDestinationIds = new Set(destinationsData?.destinationIds ?? []);

  // Source calendars that push to this calendar (from the GET response)
  const sourceCalendarIds = calendar.sourceIds ?? [];
  const sourceCalendars = (allCalendars ?? []).filter((c) => sourceCalendarIds.includes(c.id));

  return (
    <div className="flex flex-col gap-1.5">
      <BackButton fallback={`/dashboard/accounts/${accountId}`} />
      <div className="flex flex-col px-0.5 pt-4">
        <DashboardHeading2>Calendar Name</DashboardHeading2>
        <Text size="sm">Click below to rename the calendar within Keeper. This does not affect the calendar outside of the Keeper ecosystem.</Text>
      </div>
      <NavigationMenu>
        <NavigationMenuEditableItem
          value={calendar.name}
          onCommit={handleRenameCalendar}
        />
      </NavigationMenu>

      {isPullCapable && (
        <>
          <div className="flex flex-col px-0.5 pt-4">
            <DashboardHeading2>Send Events to Calendars</DashboardHeading2>
            <Text size="sm">Select which calendars should receive events from this calendar.</Text>
          </div>
          <CalendarCheckboxList
            calendars={pushCalendars}
            selectedIds={selectedDestinationIds}
            onToggle={handleToggleDestination}
            emptyLabel="No destination calendars available"
          />
        </>
      )}

      {isPushCapable && sourceCalendars.length > 0 && (
        <>
          <div className="flex flex-col px-0.5 pt-4">
            <DashboardHeading2>Event Sources</DashboardHeading2>
            <Text size="sm">Calendars that push events to this calendar.</Text>
          </div>
          <CalendarCheckboxList
            calendars={sourceCalendars}
            selectedIds={new Set(sourceCalendarIds)}
            onToggle={() => {}}
            emptyLabel="No source calendars"
          />
        </>
      )}

      {isPullCapable && (
        <>
          <div className="flex flex-col px-0.5 pt-4">
            <DashboardHeading2>Sync Settings</DashboardHeading2>
            <Text size="sm">Choose which event details and types are synced to destination calendars.</Text>
          </div>
          <NavigationMenu>
            {syncSettings.map((pref) => (
              <NavigationMenuToggleItem
                key={pref.field}
                checked={pref.matchesField ? calendar[pref.field] : !calendar[pref.field]}
                onCheckedChange={(checked) => handleTogglePreference(pref.field, checked, pref.matchesField)}
              >
                <NavigationMenuItemLabel>{pref.label}</NavigationMenuItemLabel>
              </NavigationMenuToggleItem>
            ))}
          </NavigationMenu>
        </>
      )}

      <div className="flex flex-col px-0.5 pt-4">
        <DashboardHeading2>Calendar Information</DashboardHeading2>
        <Text size="sm">View details about the calendar.</Text>
      </div>
      <NavigationMenu>
        <MetadataRow label="Resource Type" value="Calendar" />
        <MetadataRow label="Type" value={calendar.calendarType} />
        <MetadataRow label="Capabilities" value={calendar.capabilities.join(", ")} />
        {calendar.url && (
          <MetadataRow label="URL" value={calendar.url} truncate />
        )}
        {calendar.calendarUrl && (
          <MetadataRow label="Calendar URL" value={calendar.calendarUrl} truncate />
        )}
        <MetadataRow label="Added" value={formatDate(calendar.createdAt)} />
        <MetadataRow
          label="Account"
          value={getAccountLabel(account)}
          truncate
          to={`/dashboard/accounts/${accountId}`}
        />
      </NavigationMenu>
    </div>
  );
}
