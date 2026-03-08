import type { CronOptions } from "cronbake";
import { createCalDAVSourceProvider } from "@keeper.sh/provider-caldav";
import type { CalDAVSourceProvider } from "@keeper.sh/provider-caldav";
import { createFastMailSourceProvider } from "@keeper.sh/provider-fastmail";
import { createICloudSourceProvider } from "@keeper.sh/provider-icloud";
import { getCalDAVProviders } from "@keeper.sh/provider-registry";
import { WideEvent } from "@keeper.sh/log";
import type { BunSQLDatabase } from "drizzle-orm/bun-sql";
import { setCronEventFields, withCronWideEvent } from "../utils/with-wide-event";

interface SourceProviderConfig {
  database: BunSQLDatabase;
  encryptionKey: string;
}

type SourceProviderFactory = (config: SourceProviderConfig) => CalDAVSourceProvider;

const SOURCE_PROVIDER_FACTORIES: Record<string, SourceProviderFactory> = {
  caldav: createCalDAVSourceProvider,
  fastmail: createFastMailSourceProvider,
  icloud: createICloudSourceProvider,
};

interface CaldavProvider {
  id: string;
  name: string;
}

interface ProviderSyncResult {
  providerId: string;
  eventsAdded: number;
  eventsRemoved: number;
}

interface CaldavSyncJobDependencies {
  providers: CaldavProvider[];
  syncProvider: (provider: CaldavProvider) => Promise<ProviderSyncResult | null>;
  setCronEventFields: (fields: Record<string, unknown>) => void;
  reportError?: (error: unknown) => void;
}

const runCaldavSourceSyncJob = async (dependencies: CaldavSyncJobDependencies): Promise<void> => {
  const settlements = await Promise.allSettled(
    dependencies.providers.map((provider) => dependencies.syncProvider(provider)),
  );

  for (const settlement of settlements) {
    if (settlement.status === "rejected") {
      dependencies.reportError?.(settlement.reason);
      continue;
    }

    if (!settlement.value) {
      continue;
    }

    dependencies.setCronEventFields({
      [`${settlement.value.providerId}.events.added`]: settlement.value.eventsAdded,
      [`${settlement.value.providerId}.events.removed`]: settlement.value.eventsRemoved,
    });
  }
};

const createDefaultJobDependencies = async (): Promise<CaldavSyncJobDependencies> => {
  const { default: env } = await import("@keeper.sh/env/cron");
  const { database } = await import("../context");

  const syncProvider = async (provider: CaldavProvider): Promise<ProviderSyncResult | null> => {
    if (!env.ENCRYPTION_KEY) {
      return null;
    }

    const sourceProviderFactory = SOURCE_PROVIDER_FACTORIES[provider.id];
    if (!sourceProviderFactory) {
      return null;
    }

    const sourceProvider = sourceProviderFactory({
      database,
      encryptionKey: env.ENCRYPTION_KEY,
    });

    const event = WideEvent.grasp();
    const timingKey = `sync_${provider.id}`;
    event?.startTiming(timingKey);

    try {
      const result = await sourceProvider.syncAllSources();
      return {
        eventsAdded: result.eventsAdded,
        eventsRemoved: result.eventsRemoved,
        providerId: provider.id,
      };
    } catch (error) {
      event?.addError(error);
      return null;
    } finally {
      event?.endTiming(timingKey);
    }
  };

  return {
    providers: getCalDAVProviders(),
    reportError: (error) => {
      WideEvent.error(error);
    },
    setCronEventFields,
    syncProvider,
  };
};

export default withCronWideEvent({
  async callback() {
    setCronEventFields({ "job.type": "caldav-source-sync" });
    const dependencies = await createDefaultJobDependencies();
    await runCaldavSourceSyncJob(dependencies);
  },
  cron: "@every_1_minutes",
  immediate: true,
  name: import.meta.file,
}) satisfies CronOptions;

export { runCaldavSourceSyncJob };
