import { useRef, useState, useTransition } from "react";
import { createFileRoute } from "@tanstack/react-router";
import useSWR from "swr";
import type { KeyedMutator } from "swr";
import { ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";
import { BackButton } from "../../../../components/ui/back-button";
import { RouteShell } from "../../../../components/ui/route-shell";
import { Button } from "../../../../components/ui/button";
import { Text } from "../../../../components/ui/text";
import { apiFetch } from "../../../../lib/fetcher";
import { partitionCalendars } from "../../../../utils/calendars";
import { useProfileCalendarActions, useProfileMutatorFromList } from "../../../../hooks/use-profile-calendars";
import { CalendarCheckboxList } from "../../../../components/dashboard/calendar-checkbox-list";
import type { SyncProfile, CalendarEntry } from "../../../../types/api";
import {
  NavigationMenu,
  NavigationMenuEditableItem,
  NavigationMenuItem,
} from "../../../../components/ui/navigation-menu";
import { DeleteConfirmation } from "../../../../components/ui/delete-confirmation";
import { DashboardHeading1, DashboardHeading2 } from "../../../../components/ui/dashboard-heading";

export const Route = createFileRoute("/(dashboard)/dashboard/sync-profiles/")({
  component: CalendarsPage,
});

function resolveCurrentProfile(isNewSlot: boolean, profiles: SyncProfile[], currentIndex: number): SyncProfile | null {
  if (isNewSlot) return null;
  return profiles[currentIndex];
}

function resolveProfileName(isNewSlot: boolean, newProfileName: string, profile: SyncProfile | null): string {
  if (isNewSlot) return newProfileName;
  return profile?.name ?? "";
}

function resolveEditableItemKey(isNewSlot: boolean, profile: SyncProfile | null): string {
  if (isNewSlot) return "__new__";
  return profile?.id ?? "";
}

function resolveDeleteHandler(profileCount: number, openDelete: () => void): (() => void) | undefined {
  if (profileCount > 1) return openDelete;
  return undefined;
}

function replaceProfileById(profiles: SyncProfile[], targetId: string, patch: Partial<SyncProfile>): SyncProfile[] {
  return profiles.map((entry) => {
    if (entry.id === targetId) return { ...entry, ...patch };
    return entry;
  });
}

interface RenderProfileContentArgs {
  isNewSlot: boolean;
  profile: SyncProfile | null;
  profiles: SyncProfile[];
  newProfileName: string;
  calendars: CalendarEntry[];
  mutateProfiles: KeyedMutator<SyncProfile[]>;
  onDelete: (() => void) | undefined;
}

function renderProfileContent({
  isNewSlot,
  profile,
  profiles,
  newProfileName,
  calendars,
  mutateProfiles,
  onDelete,
}: RenderProfileContentArgs) {
  if (isNewSlot) {
    return (
      <NewProfileSlot
        name={newProfileName}
        calendars={calendars}
        onProfileCreated={() => mutateProfiles()}
      />
    );
  }
  if (profile) {
    return (
      <ProfileDetail
        profile={profile}
        profiles={profiles}
        calendars={calendars}
        mutateProfiles={mutateProfiles}
        onDelete={onDelete}
      />
    );
  }
  return null;
}

function CalendarsPage() {
  const { data: profiles, isLoading, error, mutate: mutateProfiles } = useSWR<SyncProfile[]>(
    "/api/profiles",
  );
  const { data: calendars, error: calendarsError } = useSWR<CalendarEntry[]>("/api/sources");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [newProfileName, setNewProfileName] = useState("New Profile");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  if (error || calendarsError || isLoading || !profiles) {
    return <RouteShell isLoading={isLoading || !profiles} error={error || calendarsError} onRetry={() => mutateProfiles()}>{null}</RouteShell>;
  }

  const isNewSlot = currentIndex >= profiles.length;
  const profile = resolveCurrentProfile(isNewSlot, profiles, currentIndex);
  const totalSlots = profiles.length + 1;

  const canGoLeft = currentIndex > 0;
  const canGoRight = currentIndex < totalSlots - 1;

  const profileName = resolveProfileName(isNewSlot, newProfileName, profile);

  const handleConfirmDelete = () => {
    if (!profile) return;
    const remaining = profiles.filter((entry) => entry.id !== profile.id);

    startDeleteTransition(async () => {
      await mutateProfiles(
        async () => {
          await apiFetch(`/api/profiles/${profile.id}`, { method: "DELETE" });
          return remaining;
        },
        {
          optimisticData: remaining,
          rollbackOnError: true,
          revalidate: false,
        },
      );
      const newLength = remaining.length;
      if (currentIndex >= newLength) {
        setCurrentIndex(Math.max(0, newLength - 1));
      }
      setDeleteOpen(false);
    });
  };

  const handleNameCommit = async (name: string) => {
    if (isNewSlot) {
      setNewProfileName(name);
      const response = await apiFetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const created = await response.json();
      await mutateProfiles(
        [...(profiles ?? []), created],
        { revalidate: false },
      );
      setNewProfileName("New Profile");
      return;
    }
    if (!profile) return;
    const updated = replaceProfileById(profiles, profile.id, { name });
    await mutateProfiles(
      async () => {
        await apiFetch(`/api/profiles/${profile.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        return updated;
      },
      {
        optimisticData: updated,
        rollbackOnError: true,
        revalidate: false,
      },
    );
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between">
        <BackButton />
        <div className="flex justify-end gap-1">
          <Button
            variant="elevated"
            size="compact"
            className="aspect-square"
            onClick={() => setCurrentIndex((prev) => prev - 1)}
            disabled={!canGoLeft}
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            variant="elevated"
            size="compact"
            className="aspect-square"
            onClick={() => setCurrentIndex((prev) => prev + 1)}
            disabled={!canGoRight}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
      <div className="flex flex-col">
        <DashboardHeading1>{isNewSlot ? "Create New Profile" : "Profile"}</DashboardHeading1>
        <Text size="sm">{isNewSlot ? "Editing any of the information below will create the new profile, and apply the changes." : "You can use multiple profiles for different syncing configurations. Name them to organize them."}</Text>
      </div>
      <NavigationMenu className="flex-1 min-w-0">
        <NavigationMenuEditableItem
          key={resolveEditableItemKey(isNewSlot, profile)}
          value={profileName}
          onCommit={handleNameCommit}
        />
      </NavigationMenu>
      {renderProfileContent({
        isNewSlot,
        profile,
        profiles,
        newProfileName,
        calendars: calendars ?? [],
        mutateProfiles,
        onDelete: resolveDeleteHandler(profiles.length, () => setDeleteOpen(true)),
      })}
      {profile && (
        <DeleteConfirmation
          title="Delete sync profile?"
          description="This will remove the profile and all its sync mappings. Your calendars will not be deleted."
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          deleting={isDeleting}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}

interface NewProfileSlotProps {
  name: string;
  calendars: CalendarEntry[];
  onProfileCreated: () => void;
}

function NewProfileSlot({ name, calendars, onProfileCreated }: NewProfileSlotProps) {
  const [sources, setSources] = useState<Set<string>>(new Set());
  const [destinations, setDestinations] = useState<Set<string>>(new Set());
  const profileIdRef = useRef<string | null>(null);
  const creatingRef = useRef<Promise<string> | null>(null);

  const { pull: pullCalendars, push: pushCalendars } = partitionCalendars(calendars);

  const ensureProfile = async (): Promise<string> => {
    if (profileIdRef.current) return profileIdRef.current;
    if (creatingRef.current) return creatingRef.current;

    creatingRef.current = apiFetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
      .then((response) => response.json())
      .then(({ id }) => {
        profileIdRef.current = id;
        return id as string;
      });

    return creatingRef.current;
  };

  const toggleSource = async (calendarId: string, checked: boolean) => {
    const prev = new Set(sources);
    const next = new Set(sources);
    if (checked) { next.add(calendarId); } else { next.delete(calendarId); }
    setSources(next);

    try {
      const profileId = await ensureProfile();
      await apiFetch(`/api/profiles/${profileId}/sources`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendarIds: [...next] }),
      });
      onProfileCreated();
    } catch {
      setSources(prev);
    }
  };

  const toggleDestination = async (calendarId: string, checked: boolean) => {
    const prev = new Set(destinations);
    const next = new Set(destinations);
    if (checked) { next.add(calendarId); } else { next.delete(calendarId); }
    setDestinations(next);

    try {
      const profileId = await ensureProfile();
      await apiFetch(`/api/profiles/${profileId}/destinations`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendarIds: [...next] }),
      });
      onProfileCreated();
    } catch {
      setDestinations(prev);
    }
  };

  return (
    <>
      <div className="flex flex-col">
        <DashboardHeading2>Event Sources</DashboardHeading2>
        <Text size="sm">Events from the marked calendars will be pooled, and pushed to the calendars marked as destinations below.</Text>
      </div>
      <CalendarCheckboxList
        calendars={pullCalendars}
        selectedIds={sources}
        onToggle={toggleSource}
        emptyLabel="No source calendars"
      />
      <div className="self-center py-2">
        <ArrowDown size={16} className="text-foreground-muted" />
      </div>
      <div className="flex flex-col">
        <DashboardHeading2>Event Destinations</DashboardHeading2>
        <Text size="sm">When you mark a calendar below, events from the sources will be pushed to that calendar.</Text>
      </div>
      <CalendarCheckboxList
        calendars={pushCalendars}
        selectedIds={destinations}
        onToggle={toggleDestination}
        emptyLabel="No destination calendars"
      />
    </>
  );
}

interface ProfileDetailProps {
  profile: SyncProfile;
  profiles: SyncProfile[];
  calendars: CalendarEntry[];
  mutateProfiles: KeyedMutator<SyncProfile[]>;
  onDelete?: () => void;
}

function ProfileDetail({ profile, profiles, calendars, mutateProfiles, onDelete }: ProfileDetailProps) {
  const { pull: pullCalendars, push: pushCalendars } = partitionCalendars(calendars);

  const sourceSet = new Set(profile.sources);
  const destinationSet = new Set(profile.destinations);

  const mutateProfile = useProfileMutatorFromList(profile, profiles, mutateProfiles);
  const { toggleSource, toggleDestination } = useProfileCalendarActions(profile.id, profile, mutateProfile);

  return (
    <>
      <div className="flex flex-col">
        <DashboardHeading2>Event Sources</DashboardHeading2>
        <Text size="sm">Events from the marked calendars will be pooled, and pushed to the calendars marked as destinations below.</Text>
      </div>
      <CalendarCheckboxList
        calendars={pullCalendars}
        selectedIds={sourceSet}
        onToggle={toggleSource}
        emptyLabel="No source calendars"
      />
      <div className="self-center py-2">
        <ArrowDown size={16} className="text-foreground-muted" />
      </div>
      <div className="flex flex-col">
        <DashboardHeading2>Event Destinations</DashboardHeading2>
        <Text size="sm">When you mark a calendar below, events from the sources will be pushed to that calendar.</Text>
      </div>
      <CalendarCheckboxList
        calendars={pushCalendars}
        selectedIds={destinationSet}
        onToggle={toggleDestination}
        emptyLabel="No destination calendars"
      />
      {onDelete && (
        <NavigationMenu>
          <NavigationMenuItem onClick={onDelete}>
            <Text size="sm" tone="danger">Delete Profile</Text>
          </NavigationMenuItem>
        </NavigationMenu>
      )}
    </>
  );
}
