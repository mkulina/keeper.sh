import { syncDestinationsForUser } from "@keeper.sh/provider-core";
import { WideEvent } from "@keeper.sh/log";
import { spawnBackgroundJob } from "./background-task";

type DestinationSyncResult = Awaited<ReturnType<typeof syncDestinationsForUser>>;

interface DestinationSyncDependencies {
  spawnBackgroundJob: (
    jobName: string,
    fields: Record<string, unknown>,
    callback: () => Promise<Record<string, number>>,
  ) => void;
  syncDestinationsForUser: (userId: string) => Promise<DestinationSyncResult>;
}

const mapDestinationSyncResult = (result: DestinationSyncResult): Record<string, number> => ({
  eventsAdded: result.added,
  eventsAddFailed: result.addFailed,
  eventsRemoved: result.removed,
  eventsRemoveFailed: result.removeFailed,
});

const runDestinationSyncTrigger = (
  userId: string,
  dependencies: DestinationSyncDependencies,
): void => {
  dependencies.spawnBackgroundJob("destination-sync", { userId }, async () => {
    const result = await dependencies.syncDestinationsForUser(userId);
    return mapDestinationSyncResult(result);
  });
};

const triggerDestinationSync = (userId: string): void => {
  const resolveDependencies = async (): Promise<DestinationSyncDependencies> => {
    const { destinationProviders, syncCoordinator } = await import("../context");
    return {
      spawnBackgroundJob,
      syncDestinationsForUser: (userIdToSync) =>
        syncDestinationsForUser(userIdToSync, destinationProviders, syncCoordinator),
    };
  };

  void resolveDependencies()
    .then((dependencies) => {
      runDestinationSyncTrigger(userId, dependencies);
    })
    .catch((error) => {
      WideEvent.error(error);
    });
};

export { triggerDestinationSync, runDestinationSyncTrigger };
