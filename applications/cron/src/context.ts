import env from "@keeper.sh/env/cron";
import { createDatabase } from "@keeper.sh/database";
import { syncStatusTable } from "@keeper.sh/database/schema";
import { createRedis } from "@keeper.sh/redis";
import { createPremiumService } from "@keeper.sh/premium";
import { createBroadcastService } from "@keeper.sh/broadcast";
import {
  createSyncCoordinator,
  createOAuthProviders,
  buildOAuthConfigs,
  createSyncAggregateRuntime,
} from "@keeper.sh/provider-core";
import { createDestinationProviders } from "@keeper.sh/provider-registry/server";
import type { DestinationSyncResult } from "@keeper.sh/provider-core";
import { Polar } from "@polar-sh/sdk";

const database = createDatabase(env.DATABASE_URL);
const redis = createRedis(env.REDIS_URL);
const broadcastService = createBroadcastService({ redis });

const premiumService = createPremiumService({
  commercialMode: env.COMMERCIAL_MODE ?? false,
  database,
});

const oauthConfigs = buildOAuthConfigs(env);
const oauthProviders = createOAuthProviders(oauthConfigs);

const destinationProviders = createDestinationProviders({
  database,
  encryptionKey: env.ENCRYPTION_KEY,
  oauthProviders,
});

const persistSyncStatus = async (
  result: DestinationSyncResult,
  syncedAt: Date,
): Promise<void> => {
  await database
    .insert(syncStatusTable)
    .values({
      calendarId: result.calendarId,
      lastSyncedAt: syncedAt,
      localEventCount: result.localEventCount,
      remoteEventCount: result.remoteEventCount,
    })
    .onConflictDoUpdate({
      set: {
        lastSyncedAt: syncedAt,
        localEventCount: result.localEventCount,
        remoteEventCount: result.remoteEventCount,
      },
      target: [syncStatusTable.calendarId],
    });
};

const syncAggregateRuntime = createSyncAggregateRuntime({
  broadcast: (userId, eventName, payload): void => {
    broadcastService.emit(userId, eventName, payload);
  },
  persistSyncStatus,
  redis,
});

const syncCoordinator = createSyncCoordinator({
  onDestinationSync: syncAggregateRuntime.onDestinationSync,
  onSyncProgress: syncAggregateRuntime.onSyncProgress,
  redis,
});

const createPolarClient = (): Polar | null => {
  if (env.POLAR_ACCESS_TOKEN && env.POLAR_MODE) {
    return new Polar({
      accessToken: env.POLAR_ACCESS_TOKEN,
      server: env.POLAR_MODE,
    });
  }
  return null;
};

const polarClient = createPolarClient();

export { database, premiumService, destinationProviders, syncCoordinator, polarClient };
