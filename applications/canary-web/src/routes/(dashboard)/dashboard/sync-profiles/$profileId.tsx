import { useState, useTransition } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import useSWR, { useSWRConfig } from "swr";
import { ArrowDown } from "lucide-react";
import { BackButton } from "../../../../components/ui/back-button";
import { RouteShell } from "../../../../components/ui/route-shell";
import { Text } from "../../../../components/ui/text";
import { apiFetch } from "../../../../lib/fetcher";
import { invalidateAccountsAndSources } from "../../../../lib/swr";
import { partitionCalendars } from "../../../../utils/calendars";
import { useProfileCalendarActions } from "../../../../hooks/use-profile-calendars";
import { CalendarCheckboxList } from "../../../../components/dashboard/calendar-checkbox-list";
import type { SyncProfile, CalendarEntry } from "../../../../types/api";
import {
  NavigationMenu,
  NavigationMenuEditableItem,
  NavigationMenuItem,
} from "../../../../components/ui/navigation-menu";
import { DeleteConfirmation } from "../../../../components/ui/delete-confirmation";

export const Route = createFileRoute(
  "/(dashboard)/dashboard/sync-profiles/$profileId",
)({
  component: ProfileDetailPage,
});

function resolveErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  return fallback;
}

function ProfileDetailPage() {
  const { profileId } = Route.useParams();
  const navigate = useNavigate();
  const { mutate: globalMutate } = useSWRConfig();
  const { data: profile, isLoading, error, mutate: mutateProfile } = useSWR<SyncProfile>(
    `/api/profiles/${profileId}`,
  );
  const { data: calendars, error: calendarsError } = useSWR<CalendarEntry[]>("/api/sources");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const emptyProfile: SyncProfile = { id: profileId, name: "", sources: [], destinations: [], createdAt: "" };
  const { toggleSource, toggleDestination, updateName } = useProfileCalendarActions(profileId, profile ?? emptyProfile, mutateProfile);

  const handleConfirmDelete = () => {
    setDeleteError(null);

    startDeleteTransition(async () => {
      try {
        await apiFetch(`/api/profiles/${profileId}`, { method: "DELETE" });
        await invalidateAccountsAndSources(globalMutate, "/api/profiles", `/api/profiles/${profileId}`);
        navigate({ to: "/dashboard/sync-profiles" });
      } catch (err) {
        setDeleteError(resolveErrorMessage(err, "Failed to delete profile."));
      }
    });
  };

  if (error || calendarsError || isLoading || !profile) {
    return <RouteShell backFallback="/dashboard/sync-profiles" isLoading={isLoading || !profile} error={error || calendarsError} onRetry={() => mutateProfile()}>{null}</RouteShell>;
  }

  const { pull: pullCalendars, push: pushCalendars } = partitionCalendars(calendars ?? []);

  const sourceSet = new Set(profile.sources);
  const destinationSet = new Set(profile.destinations);

  return (
    <div className="flex flex-col gap-1.5">
      <BackButton fallback="/dashboard/sync-profiles" />
      <NavigationMenu>
        <NavigationMenuEditableItem
          value={profile.name}
          onCommit={updateName}
        />
      </NavigationMenu>
      <CalendarCheckboxList
        calendars={pullCalendars}
        selectedIds={sourceSet}
        onToggle={toggleSource}
        emptyLabel="No source calendars"
      />
      <div className="self-center py-2">
        <ArrowDown size={16} className="text-foreground-muted" />
      </div>
      <CalendarCheckboxList
        calendars={pushCalendars}
        selectedIds={destinationSet}
        onToggle={toggleDestination}
        emptyLabel="No destination calendars"
      />
      <NavigationMenu>
        <NavigationMenuItem onClick={() => setDeleteOpen(true)}>
          <Text size="sm" tone="danger">Delete Profile</Text>
        </NavigationMenuItem>
      </NavigationMenu>
      {deleteError && <Text size="sm" tone="danger">{deleteError}</Text>}
      <DeleteConfirmation
        title="Delete sync profile?"
        description="This will remove the profile and all its sync mappings. Your calendars will not be deleted."
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        deleting={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
