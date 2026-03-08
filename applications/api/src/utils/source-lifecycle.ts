import { CalendarFetchError } from "@keeper.sh/calendar";

interface SourceReference {
  id: string;
}

interface CreateSourceInput {
  userId: string;
  name: string;
  url: string;
}

interface CreateSourceDependencies<TSource extends SourceReference> {
  countExistingMappedSources: (userId: string) => Promise<number>;
  canAddSource: (userId: string, existingSourceCount: number) => Promise<boolean>;
  validateSourceUrl: (url: string) => Promise<void>;
  createCalendarAccount: (payload: {
    userId: string;
    displayName: string;
  }) => Promise<string | undefined>;
  createSourceCalendar: (payload: {
    accountId: string;
    name: string;
    url: string;
    userId: string;
  }) => Promise<TSource | undefined>;
  spawnBackgroundJob: (
    jobName: string,
    fields: Record<string, unknown>,
    callback: () => Promise<void>,
  ) => void;
  fetchAndSyncSource: (source: TSource) => Promise<void>;
  triggerDestinationSync: (userId: string) => void;
}

interface DeleteSourceInput {
  userId: string;
  calendarId: string;
}

interface DeleteSourceDependencies {
  deleteSourceCalendar: (payload: DeleteSourceInput) => Promise<boolean>;
  triggerDestinationSync: (userId: string) => void;
}

class SourceLimitError extends Error {
  constructor() {
    super("Source limit reached. Upgrade to Pro for unlimited sources.");
  }
}

class InvalidSourceUrlError extends Error {
  public readonly authRequired: boolean;

  constructor(cause?: unknown) {
    if (cause instanceof CalendarFetchError) {
      super(cause.message);
      this.authRequired = cause.authRequired;
    } else {
      super("Invalid calendar URL");
      this.authRequired = false;
    }
    this.cause = cause;
  }
}

const runCreateSource = async <TSource extends SourceReference>(
  input: CreateSourceInput,
  dependencies: CreateSourceDependencies<TSource>,
): Promise<TSource> => {
  const existingSourceCount = await dependencies.countExistingMappedSources(input.userId);
  const allowed = await dependencies.canAddSource(input.userId, existingSourceCount);
  if (!allowed) {
    throw new SourceLimitError();
  }

  try {
    await dependencies.validateSourceUrl(input.url);
  } catch (error) {
    throw new InvalidSourceUrlError(error);
  }

  const accountId = await dependencies.createCalendarAccount({
    displayName: input.url,
    userId: input.userId,
  });
  if (!accountId) {
    throw new Error("Failed to create calendar account");
  }

  const source = await dependencies.createSourceCalendar({
    accountId,
    name: input.name,
    url: input.url,
    userId: input.userId,
  });
  if (!source) {
    throw new Error("Failed to create source");
  }

  dependencies.spawnBackgroundJob("ical-source-sync", { userId: input.userId, calendarId: source.id }, async () => {
    await dependencies.fetchAndSyncSource(source);
    dependencies.triggerDestinationSync(input.userId);
  });

  return source;
};

const runDeleteSource = async (
  input: DeleteSourceInput,
  dependencies: DeleteSourceDependencies,
): Promise<boolean> => {
  const deleted = await dependencies.deleteSourceCalendar(input);
  if (deleted) {
    dependencies.triggerDestinationSync(input.userId);
    return true;
  }

  return false;
};

export {
  SourceLimitError,
  InvalidSourceUrlError,
  runCreateSource,
  runDeleteSource,
};
export type {
  SourceReference,
  CreateSourceInput,
  CreateSourceDependencies,
  DeleteSourceInput,
  DeleteSourceDependencies,
};
