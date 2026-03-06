import { createFileRoute } from "@tanstack/react-router";
import useSWR from "swr";
import { BackButton } from "../../../../components/ui/primitives/back-button";
import { RouteShell } from "../../../../components/ui/shells/route-shell";
import { MetadataRow } from "../../../../features/dashboard/components/metadata-row";
import { CalendarCheckboxList } from "../../../../features/dashboard/components/calendar-checkbox-list";
import { ProviderIcon } from "../../../../components/ui/primitives/provider-icon";
import { DashboardHeading1 } from "../../../../components/ui/primitives/dashboard-heading";
import { apiFetch } from "../../../../lib/fetcher";
import { formatDate } from "../../../../lib/time";
import { getAccountLabel } from "../../../../utils/accounts";
import { canPull, canPush } from "../../../../utils/calendars";
import { resolveUpdatedIds } from "../../../../utils/collections";
import type { CalendarAccount, CalendarDetail, CalendarSource } from "../../../../types/api";
import {
  NavigationMenu,
  NavigationMenuToggleItem,
  NavigationMenuItemLabel,
} from "../../../../components/ui/composites/navigation-menu/navigation-menu-items";
import {
  NavigationMenuEditableItem,
  NavigationMenuEditableTemplateItem,
} from "../../../../components/ui/composites/navigation-menu/navigation-menu-editable";
import { DashboardHeading2 } from "../../../../components/ui/primitives/dashboard-heading";
import { Text } from "../../../../components/ui/primitives/text";
import { TemplateText } from "../../../../components/ui/primitives/template-text";

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
  matchesField: boolean;
}

const SYNC_SETTINGS: SyncSetting[] = [
  { field: "excludeEventDescription", label: "Sync Event Description", matchesField: false },
  { field: "excludeEventLocation", label: "Sync Event Location", matchesField: false },
];

const EXCLUSION_SETTINGS: SyncSetting[] = [
  { field: "excludeAllDayEvents", label: "Exclude All Day Events", matchesField: true },
];

const PROVIDER_EXCLUSION_SETTINGS: SyncSetting[] = [
  { field: "excludeFocusTime", label: "Exclude Focus Time Events", matchesField: true },
  { field: "excludeWorkingLocation", label: "Exclude Working Location Events", matchesField: true },
  { field: "excludeOutOfOffice", label: "Exclude Out of Office Events", matchesField: true },
];

const PROVIDERS_WITH_EXTRA_SETTINGS = new Set(["google"]);

function resolveExcludeValue(checked: boolean, matchesField: boolean): boolean {
  return matchesField ? checked : !checked;
}

function useCalendarPatch(calendarId: string, calendar: CalendarDetail | undefined) {
  const { mutate: mutateCalendar } = useSWR<CalendarDetail>(`/api/sources/${calendarId}`);

  const patchCalendar = async (patch: Partial<CalendarDetail>) => {
    await mutateCalendar(
      async (current) => {
        await apiFetch(`/api/sources/${calendarId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        return patchIfPresent(current, patch);
      },
      {
        optimisticData: patchIfPresent(calendar, patch),
        rollbackOnError: true,
        revalidate: false,
      },
    );
  };

  return patchCalendar;
}

function CalendarDetailPage() {
  const { accountId, calendarId } = Route.useParams();
  const { data: account, isLoading: accountLoading, error: accountError, mutate: mutateAccount } = useSWR<CalendarAccount>(`/api/accounts/${accountId}`);
  const {
    data: calendar,
    isLoading: calendarLoading,
    error: calendarError,
    mutate: mutateCalendar,
  } = useSWR<CalendarDetail>(`/api/sources/${calendarId}`);

  const isLoading = accountLoading || calendarLoading;
  const error = accountError || calendarError;

  if (error || isLoading || !calendar || !account) {
    if (error) return <RouteShell backFallback={`/dashboard/accounts/${accountId}`} status="error" onRetry={async () => { await Promise.all([mutateAccount(), mutateCalendar()]); }} />;
    return <RouteShell backFallback={`/dashboard/accounts/${accountId}`} status="loading" />;
  }

  const isPullCapable = canPull(calendar);

  return (
    <div className="flex flex-col gap-1.5">
      <BackButton fallback={`/dashboard/accounts/${accountId}`} />
      <CalendarHeader calendar={calendar} account={account} />
      <RenameSection calendarId={calendarId} calendar={calendar} />
      {isPullCapable && <DestinationsSection calendarId={calendarId} />}
      {isPullCapable && <SyncSettingsSection calendarId={calendarId} calendar={calendar} />}
      {isPullCapable && <ExclusionsSection calendarId={calendarId} calendar={calendar} />}
      <CalendarInfoSection calendar={calendar} account={account} accountId={accountId} />
    </div>
  );
}

function CalendarHeader({ calendar, account }: { calendar: CalendarDetail; account: CalendarAccount }) {
  return (
    <div className="flex flex-col px-0.5 pt-4">
      <DashboardHeading1>{calendar.name}</DashboardHeading1>
      <div className="flex items-center gap-1.5 pt-0.5">
        <ProviderIcon provider={calendar.provider} calendarType={calendar.calendarType} size={14} />
        <Text className="truncate overflow-hidden" size="sm" tone="muted">{getAccountLabel(account)}</Text>
      </div>
    </div>
  );
}

function RenameSection({ calendarId, calendar }: { calendarId: string; calendar: CalendarDetail }) {
  const patchCalendar = useCalendarPatch(calendarId, calendar);

  return (
    <>
      <div className="flex flex-col px-0.5 pt-4">
        <DashboardHeading2>Calendar Name</DashboardHeading2>
        <Text size="sm">Click below to rename the calendar within Keeper. This does not affect the calendar outside of the Keeper ecosystem.</Text>
      </div>
      <NavigationMenu>
        <NavigationMenuEditableItem
          value={calendar.name}
          onCommit={(name) => patchCalendar({ name })}
        />
      </NavigationMenu>
    </>
  );
}

function DestinationsSection({ calendarId }: { calendarId: string }) {
  const { data: allCalendars } = useSWR<CalendarSource[]>("/api/sources");
  const { data: destinationsData, mutate: mutateDestinations } = useSWR<{ destinationIds: string[] }>(
    `/api/sources/${calendarId}/destinations`,
  );

  const pushCalendars = (allCalendars ?? []).filter((c) => canPush(c) && c.id !== calendarId);
  const selectedDestinationIds = new Set(destinationsData?.destinationIds ?? []);

  const handleToggleDestination = async (destinationId: string, checked: boolean) => {
    const currentIds = destinationsData?.destinationIds ?? [];
    const updatedIds = resolveUpdatedIds(currentIds, destinationId, checked);

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

  return (
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
  );
}

function SyncSettingsSection({ calendarId, calendar }: { calendarId: string; calendar: CalendarDetail }) {
  const patchCalendar = useCalendarPatch(calendarId, calendar);

  return (
    <>
      <div className="flex flex-col px-0.5 pt-4">
        <DashboardHeading2>Sync Settings</DashboardHeading2>
        <Text size="sm">Choose which event details are synced to destination calendars. Use <Text as="span" size="sm" className="text-template inline">{"{{calendar_name}}"}</Text> or <Text as="span" size="sm" className="text-template inline">{"{{event_name}}"}</Text> in text fields for dynamic values.</Text>
      </div>
      <NavigationMenu>
        <NavigationMenuEditableTemplateItem
          label="Event Name"
          value={calendar.customEventName || "{{event_name}}"}
          disabled={!calendar.excludeEventName}
          valueContent={
            <TemplateText
              template={calendar.customEventName || "{{event_name}}"}
              variables={{ calendar_name: calendar.name, event_name: "Event Name" }}
              disabled={!calendar.excludeEventName}
            />
          }
          renderInput={(live) => (
            <TemplateText
              template={live}
              variables={{ calendar_name: calendar.name, event_name: "Event Name" }}
            />
          )}
          onCommit={(customEventName) => patchCalendar({ customEventName })}
        />
        <NavigationMenuToggleItem
          checked={!calendar.excludeEventName}
          onCheckedChange={(checked) => {
            if (checked) {
              patchCalendar({ excludeEventName: false, customEventName: "{{event_name}}" });
            } else {
              patchCalendar({ excludeEventName: true, customEventName: "{{calendar_name}}" });
            }
          }}
        >
          <NavigationMenuItemLabel>Sync Event Name</NavigationMenuItemLabel>
        </NavigationMenuToggleItem>
        {SYNC_SETTINGS.map((pref) => (
          <NavigationMenuToggleItem
            key={pref.field}
            checked={!calendar[pref.field]}
            onCheckedChange={(checked) => patchCalendar({ [pref.field]: resolveExcludeValue(checked, pref.matchesField) })}
          >
            <NavigationMenuItemLabel>{pref.label}</NavigationMenuItemLabel>
          </NavigationMenuToggleItem>
        ))}
      </NavigationMenu>
    </>
  );
}

function ExclusionsSection({ calendarId, calendar }: { calendarId: string; calendar: CalendarDetail }) {
  const patchCalendar = useCalendarPatch(calendarId, calendar);

  const hasExtraSettings = PROVIDERS_WITH_EXTRA_SETTINGS.has(calendar.provider);
  const exclusionSettings = hasExtraSettings
    ? [...EXCLUSION_SETTINGS, ...PROVIDER_EXCLUSION_SETTINGS]
    : EXCLUSION_SETTINGS;

  return (
    <>
      <div className="flex flex-col px-0.5 pt-4">
        <DashboardHeading2>Exclusions</DashboardHeading2>
        <Text size="sm">Choose which event types to exclude from syncing.</Text>
      </div>
      <NavigationMenu>
        {exclusionSettings.map((pref) => (
          <NavigationMenuToggleItem
            key={pref.field}
            checked={calendar[pref.field]}
            onCheckedChange={(checked) => patchCalendar({ [pref.field]: resolveExcludeValue(checked, pref.matchesField) })}
          >
            <NavigationMenuItemLabel>{pref.label}</NavigationMenuItemLabel>
          </NavigationMenuToggleItem>
        ))}
      </NavigationMenu>
    </>
  );
}

function CalendarInfoSection({ calendar, account, accountId }: { calendar: CalendarDetail; account: CalendarAccount; accountId: string }) {
  return (
    <>
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
    </>
  );
}
