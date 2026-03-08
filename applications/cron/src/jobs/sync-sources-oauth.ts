import type { CronOptions } from "cronbake";
import { createGoogleCalendarSourceProvider } from "@keeper.sh/provider-google-calendar";
import { createOutlookSourceProvider } from "@keeper.sh/provider-outlook";
import { createGoogleOAuthService } from "@keeper.sh/oauth-google";
import { createMicrosoftOAuthService } from "@keeper.sh/oauth-microsoft";
import { WideEvent } from "@keeper.sh/log";
import { setCronEventFields, withCronWideEvent } from "../utils/with-wide-event";

interface ProviderSyncResult {
  eventsAdded: number;
  eventsRemoved: number;
  errorCount: number;
}

interface OAuthSyncJobDependencies {
  syncGoogleSources: () => Promise<ProviderSyncResult | null>;
  syncOutlookSources: () => Promise<ProviderSyncResult | null>;
  setCronEventFields: (fields: Record<string, unknown>) => void;
  reportError?: (error: unknown) => void;
}

const publishProviderMetrics = (
  provider: "google" | "outlook",
  result: ProviderSyncResult,
  dependencies: OAuthSyncJobDependencies,
): void => {
  dependencies.setCronEventFields({
    [`${provider}.error.count`]: result.errorCount,
    [`${provider}.events.added`]: result.eventsAdded,
    [`${provider}.events.removed`]: result.eventsRemoved,
  });
};

const runOAuthSourceSyncJob = async (dependencies: OAuthSyncJobDependencies): Promise<void> => {
  const settlements = await Promise.allSettled([
    dependencies.syncGoogleSources(),
    dependencies.syncOutlookSources(),
  ]);

  const [googleSettlement, outlookSettlement] = settlements;

  if (googleSettlement?.status === "fulfilled" && googleSettlement.value) {
    publishProviderMetrics("google", googleSettlement.value, dependencies);
  } else if (googleSettlement?.status === "rejected") {
    dependencies.reportError?.(googleSettlement.reason);
  }

  if (outlookSettlement?.status === "fulfilled" && outlookSettlement.value) {
    publishProviderMetrics("outlook", outlookSettlement.value, dependencies);
  } else if (outlookSettlement?.status === "rejected") {
    dependencies.reportError?.(outlookSettlement.reason);
  }
};

const createDefaultJobDependencies = async (): Promise<OAuthSyncJobDependencies> => {
  const { database } = await import("../context");
  const { default: env } = await import("@keeper.sh/env/cron");

  const syncGoogleSources = async (): Promise<ProviderSyncResult | null> => {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      return null;
    }

    const googleOAuth = createGoogleOAuthService({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    });

    const googleSourceProvider = createGoogleCalendarSourceProvider({
      database,
      oauthProvider: googleOAuth,
    });

    const event = WideEvent.grasp();
    event?.startTiming("syncGoogleSources");

    try {
      const result = await googleSourceProvider.syncAllSources();
      return {
        errorCount: result.errors?.length ?? 0,
        eventsAdded: result.eventsAdded,
        eventsRemoved: result.eventsRemoved,
      };
    } catch (error) {
      event?.addError(error);
      return null;
    } finally {
      event?.endTiming("syncGoogleSources");
    }
  };

  const syncOutlookSources = async (): Promise<ProviderSyncResult | null> => {
    if (!env.MICROSOFT_CLIENT_ID || !env.MICROSOFT_CLIENT_SECRET) {
      return null;
    }

    const microsoftOAuth = createMicrosoftOAuthService({
      clientId: env.MICROSOFT_CLIENT_ID,
      clientSecret: env.MICROSOFT_CLIENT_SECRET,
    });

    const outlookSourceProvider = createOutlookSourceProvider({
      database,
      oauthProvider: microsoftOAuth,
    });

    const event = WideEvent.grasp();
    event?.startTiming("syncOutlookSources");

    try {
      const result = await outlookSourceProvider.syncAllSources();
      return {
        errorCount: result.errors?.length ?? 0,
        eventsAdded: result.eventsAdded,
        eventsRemoved: result.eventsRemoved,
      };
    } catch (error) {
      event?.addError(error);
      return null;
    } finally {
      event?.endTiming("syncOutlookSources");
    }
  };

  return {
    reportError: (error) => {
      WideEvent.error(error);
    },
    setCronEventFields,
    syncGoogleSources,
    syncOutlookSources,
  };
};

export default withCronWideEvent({
  async callback() {
    setCronEventFields({ "job.type": "oauth-source-sync" });
    const dependencies = await createDefaultJobDependencies();
    await runOAuthSourceSyncJob(dependencies);
  },
  cron: "@every_1_minutes",
  immediate: true,
  name: import.meta.file,
}) satisfies CronOptions;

export { runOAuthSourceSyncJob };
