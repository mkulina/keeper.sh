import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import useSWR from "swr";
import { BackButton } from "../../../../components/ui/back-button";
import { Text } from "../../../../components/ui/text";
import { DashboardHeading2 } from "../../../../components/ui/dashboard-heading";
import { Button, LinkButton, ButtonText } from "../../../../components/ui/button";
import { apiFetch } from "../../../../lib/fetcher";
import type { CalendarSource } from "../../../../types/api";
import {
  NavigationMenu,
  NavigationMenuCheckboxItem,
  NavigationMenuEditableItem,
  NavigationMenuEmptyItem,
  NavigationMenuItemIcon,
  NavigationMenuItemLabel,
} from "../../../../components/ui/navigation-menu";
import { ProviderIcon } from "../../../../components/ui/provider-icon";
import { RouteShell } from "../../../../components/ui/route-shell";
import { canPull, canPush, getCalendarProvider } from "../../../../utils/calendars";

const VALID_STEPS = ["select", "rename", "destinations", "sources"] as const;
type SetupStep = (typeof VALID_STEPS)[number];

interface SetupSearch {
  step?: SetupStep;
  id?: string;
  index?: number;
}

type MappingRoute = "destinations" | "sources";
type MappingResponseKey = "destinationIds" | "sourceIds";

function isValidStep(value: unknown): value is SetupStep {
  return typeof value === "string" && VALID_STEPS.includes(value as SetupStep);
}

function parseSearchIndex(value: unknown): number | undefined {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isInteger(parsed) || parsed < 0) return undefined;
  return parsed;
}

export const Route = createFileRoute(
  "/(dashboard)/dashboard/accounts/$accountId/setup",
)({
  component: AccountSetupPage,
  validateSearch: (search: Record<string, unknown>): SetupSearch => {
    return {
      step: isValidStep(search.step) ? search.step : undefined,
      id: typeof search.id === "string" ? search.id : undefined,
      index: parseSearchIndex(search.index),
    };
  },
});

function parseSelectedIds(commaIds: string | undefined): Set<string> {
  if (!commaIds) return new Set();
  return new Set(commaIds.split(",").filter(Boolean));
}

function resolveStepCalendarIndex(index: number, length: number): number {
  if (length === 0) return 0;
  if (index >= length) return length - 1;
  return index;
}

function resolveUpdatedIds(currentIds: string[], calendarId: string, checked: boolean): string[] {
  if (checked) return currentIds.includes(calendarId) ? currentIds : [...currentIds, calendarId];
  return currentIds.filter((existingId) => existingId !== calendarId);
}

function buildMappingData(responseKey: MappingResponseKey, ids: string[]): Record<MappingResponseKey, string[]> {
  return { [responseKey]: ids } as Record<MappingResponseKey, string[]>;
}

function useCalendarMapping({
  calendarId,
  route,
  responseKey,
}: {
  calendarId?: string;
  route: MappingRoute;
  responseKey: MappingResponseKey;
}) {
  const endpoint = calendarId ? `/api/sources/${calendarId}/${route}` : null;
  const { data, mutate } = useSWR<Record<MappingResponseKey, string[]>>(endpoint);

  const selectedIds = new Set(data?.[responseKey] ?? []);

  const handleToggle = async (targetCalendarId: string, checked: boolean) => {
    if (!endpoint) return;
    const currentIds = data?.[responseKey] ?? [];
    const updatedIds = resolveUpdatedIds(currentIds, targetCalendarId, checked);
    const mappingData = buildMappingData(responseKey, updatedIds);

    await mutate(
      async () => {
        await apiFetch(endpoint, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ calendarIds: updatedIds }),
        });
        return mappingData;
      },
      {
        optimisticData: mappingData,
        rollbackOnError: true,
        revalidate: false,
      },
    );
  };

  return { selectedIds, handleToggle };
}

function AccountSetupPage() {
  const { accountId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();

  const step = search.step ?? "select";
  const selectedIds = parseSelectedIds(search.id);
  const requestedCalendarIndex = search.index ?? 0;

  const { data: allCalendars, isLoading, error, mutate: mutateCalendars } = useSWR<CalendarSource[]>(
    "/api/sources",
  );

  const accountCalendars = (allCalendars ?? []).filter(
    (calendar) => calendar.accountId === accountId,
  );

  const selectedCalendars = accountCalendars.filter((calendar) => selectedIds.has(calendar.id));
  const pullCapableSelected = selectedCalendars.filter(canPull);
  const pushCapableSelected = selectedCalendars.filter(canPush);
  const destinationCalendarIndex = resolveStepCalendarIndex(requestedCalendarIndex, pullCapableSelected.length);
  const sourceCalendarIndex = resolveStepCalendarIndex(requestedCalendarIndex, pushCapableSelected.length);

  const navigateToStep = (nextStep: SetupStep, nextIndex?: number) => {
    navigate({
      to: "/dashboard/accounts/$accountId/setup",
      params: { accountId },
      search: { step: nextStep, id: search.id, index: nextIndex },
    });
  };

  const advanceToSources = () => {
    if (pushCapableSelected.length > 0) {
      navigateToStep("sources", 0);
      return;
    }

    navigate({ to: "/dashboard" });
  };

  const advanceFromRename = () => {
    if (pullCapableSelected.length > 0) {
      navigateToStep("destinations", 0);
      return;
    }

    advanceToSources();
  };

  const advanceFromDestinations = (currentIndex: number) => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < pullCapableSelected.length) {
      navigateToStep("destinations", nextIndex);
      return;
    }

    advanceToSources();
  };

  const advanceFromSources = (currentIndex: number) => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < pushCapableSelected.length) {
      navigateToStep("sources", nextIndex);
      return;
    }

    navigate({ to: "/dashboard" });
  };

  if (error || isLoading) {
    return <RouteShell backFallback="/dashboard" isLoading={isLoading} error={error} onRetry={() => mutateCalendars()}>{null}</RouteShell>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <BackButton fallback="/dashboard" />
      {step === "select" && (
        <SelectSection
          accountId={accountId}
          calendars={accountCalendars}
        />
      )}
      {step === "rename" && (
        <RenameSection
          calendars={selectedCalendars}
          mutateCalendars={mutateCalendars}
          onNext={advanceFromRename}
        />
      )}
      {step === "destinations" && (
        <DestinationsSection
          calendar={pullCapableSelected[destinationCalendarIndex]}
          allCalendars={allCalendars ?? []}
          onNext={() => advanceFromDestinations(destinationCalendarIndex)}
        />
      )}
      {step === "sources" && (
        <SourcesSection
          calendar={pushCapableSelected[sourceCalendarIndex]}
          allCalendars={allCalendars ?? []}
          onNext={() => advanceFromSources(sourceCalendarIndex)}
        />
      )}
    </div>
  );
}

function SelectSection({
  accountId,
  calendars,
}: {
  accountId: string;
  calendars: CalendarSource[];
}) {
  const navigate = useNavigate();
  const [localSelectedIds, setLocalSelectedIds] = useState<Set<string>>(new Set());

  const handleToggle = (calendarId: string, checked: boolean) => {
    setLocalSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(calendarId);
      } else {
        next.delete(calendarId);
      }
      return next;
    });
  };

  const handleNext = () => {
    navigate({
      to: "/dashboard/accounts/$accountId/setup",
      params: { accountId },
      search: { step: "rename", id: [...localSelectedIds].join(",") },
    });
  };

  return (
    <>
      <div className="flex flex-col px-0.5 pt-4">
        <DashboardHeading2>Which calendars would you like to configure?</DashboardHeading2>
        <Text size="sm">Select the calendars you want to rename and set up.</Text>
      </div>
      <NavigationMenu>
        {calendars.map((calendar) => (
          <NavigationMenuCheckboxItem
            key={calendar.id}
            checked={localSelectedIds.has(calendar.id)}
            onCheckedChange={(checked) => handleToggle(calendar.id, checked)}
          >
            <NavigationMenuItemIcon>
              <ProviderIcon
                provider={getCalendarProvider(calendar)}
                calendarType={calendar.calendarType}
              />
            </NavigationMenuItemIcon>
            <NavigationMenuItemLabel>{calendar.name}</NavigationMenuItemLabel>
          </NavigationMenuCheckboxItem>
        ))}
      </NavigationMenu>
      <div className="flex flex-col gap-1.5">
        <Button
          className="w-full justify-center"
          disabled={localSelectedIds.size === 0}
          onClick={handleNext}
        >
          <ButtonText>Next</ButtonText>
        </Button>
        <LinkButton
          to="/dashboard"
          variant="ghost"
          className="w-full justify-center"
        >
          <ButtonText>Skip</ButtonText>
        </LinkButton>
      </div>
    </>
  );
}

function RenameSection({
  calendars,
  mutateCalendars,
  onNext,
}: {
  calendars: CalendarSource[];
  mutateCalendars: ReturnType<typeof useSWR<CalendarSource[]>>["mutate"];
  onNext: () => void;
}) {
  const handleRename = async (calendarId: string, name: string) => {
    await mutateCalendars(
      async (current) => {
        await apiFetch(`/api/sources/${calendarId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        return current?.map((calendar) => {
          if (calendar.id === calendarId) {
            return { ...calendar, name };
          }
          return calendar;
        });
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
      <Button
        className="w-full justify-center"
        onClick={onNext}
      >
        <ButtonText>Next</ButtonText>
      </Button>
    </>
  );
}

function DestinationsSection({
  calendar,
  allCalendars,
  onNext,
}: {
  calendar?: CalendarSource;
  allCalendars: CalendarSource[];
  onNext: () => void;
}) {
  const { selectedIds, handleToggle } = useCalendarMapping({
    calendarId: calendar?.id,
    route: "destinations",
    responseKey: "destinationIds",
  });

  if (!calendar) {
    return (
      <>
        <div className="flex flex-col px-0.5 pt-4">
          <DashboardHeading2>No destination setup needed</DashboardHeading2>
          <Text size="sm">None of the selected calendars can send events right now.</Text>
        </div>
        <Button className="w-full justify-center" onClick={onNext}>
          <ButtonText>Continue</ButtonText>
        </Button>
      </>
    );
  }

  const pushCalendars = allCalendars.filter(
    (candidate) => canPush(candidate) && candidate.id !== calendar.id,
  );

  return (
    <>
      <div className="flex flex-col px-0.5 pt-4">
        <DashboardHeading2 className="overflow-visible text-wrap whitespace-normal">Where should &apos;{calendar.name}&apos; send events?</DashboardHeading2>
        <Text size="sm">Select which calendars should receive events from this calendar.</Text>
      </div>
      <NavigationMenu>
        {pushCalendars.length === 0 && (
          <NavigationMenuEmptyItem>No destination calendars available</NavigationMenuEmptyItem>
        )}
        {pushCalendars.map((destination) => (
          <NavigationMenuCheckboxItem
            key={destination.id}
            checked={selectedIds.has(destination.id)}
            onCheckedChange={(checked) => handleToggle(destination.id, checked)}
          >
            <NavigationMenuItemIcon>
              <ProviderIcon
                provider={getCalendarProvider(destination)}
                calendarType={destination.calendarType}
              />
            </NavigationMenuItemIcon>
            <NavigationMenuItemLabel>{destination.name}</NavigationMenuItemLabel>
          </NavigationMenuCheckboxItem>
        ))}
      </NavigationMenu>
      <Button
        className="w-full justify-center"
        onClick={onNext}
      >
        <ButtonText>Next</ButtonText>
      </Button>
    </>
  );
}

function SourcesSection({
  calendar,
  allCalendars,
  onNext,
}: {
  calendar?: CalendarSource;
  allCalendars: CalendarSource[];
  onNext: () => void;
}) {
  const { selectedIds, handleToggle } = useCalendarMapping({
    calendarId: calendar?.id,
    route: "sources",
    responseKey: "sourceIds",
  });

  if (!calendar) {
    return (
      <>
        <div className="flex flex-col px-0.5 pt-4">
          <DashboardHeading2>No source setup needed</DashboardHeading2>
          <Text size="sm">None of the selected calendars can pull events right now.</Text>
        </div>
        <Button className="w-full justify-center" onClick={onNext}>
          <ButtonText>Finish</ButtonText>
        </Button>
      </>
    );
  }

  const pullCalendars = allCalendars.filter(
    (candidate) => canPull(candidate) && candidate.id !== calendar.id,
  );

  return (
    <>
      <div className="flex flex-col px-0.5 pt-4">
        <DashboardHeading2 className="overflow-visible text-wrap whitespace-normal">Where should &apos;{calendar.name}&apos; pull events from?</DashboardHeading2>
        <Text size="sm">Select which calendars should send events to this calendar.</Text>
      </div>
      <NavigationMenu>
        {pullCalendars.length === 0 && (
          <NavigationMenuEmptyItem>No source calendars available</NavigationMenuEmptyItem>
        )}
        {pullCalendars.map((source) => (
          <NavigationMenuCheckboxItem
            key={source.id}
            checked={selectedIds.has(source.id)}
            onCheckedChange={(checked) => handleToggle(source.id, checked)}
          >
            <NavigationMenuItemIcon>
              <ProviderIcon
                provider={getCalendarProvider(source)}
                calendarType={source.calendarType}
              />
            </NavigationMenuItemIcon>
            <NavigationMenuItemLabel>{source.name}</NavigationMenuItemLabel>
          </NavigationMenuCheckboxItem>
        ))}
      </NavigationMenu>
      <Button
        className="w-full justify-center"
        onClick={onNext}
      >
        <ButtonText>Next</ButtonText>
      </Button>
    </>
  );
}
