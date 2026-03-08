import {
  caldavCredentialsTable,
  calendarAccountsTable,
  calendarsTable,
  oauthCredentialsTable,
  sourceDestinationMappingsTable,
  syncStatusTable,
} from "@keeper.sh/database/schema";
import { and, eq, inArray } from "drizzle-orm";
import type {
  AuthorizationUrlOptions,
  OAuthTokens,
  NormalizedUserInfo as OAuthUserInfo,
  ValidatedState,
} from "@keeper.sh/provider-core";
import { database, oauthProviders } from "../context";


const FIRST_RESULT_LIMIT = 1;
const EMPTY_RESULT_COUNT = 0;

const isOAuthProvider = (provider: string): boolean => oauthProviders.isOAuthProvider(provider);

const hasRequiredScopes = (provider: string, grantedScopes: string): boolean =>
  oauthProviders.hasRequiredScopes(provider, grantedScopes);

const getOAuthProviderOrThrow = (provider: string) => {
  const oauthProvider = oauthProviders.getProvider(provider);
  if (!oauthProvider) {
    throw new Error(`OAuth provider not found: ${provider}`);
  }
  return oauthProvider;
};

const getAuthorizationUrl = (
  provider: string,
  userId: string,
  options: AuthorizationUrlOptions,
): string => getOAuthProviderOrThrow(provider).getAuthorizationUrl(userId, options);

const exchangeCodeForTokens = (
  provider: string,
  code: string,
  callbackUrl: string,
): Promise<OAuthTokens> => getOAuthProviderOrThrow(provider).exchangeCodeForTokens(code, callbackUrl);

const fetchUserInfo = (provider: string, accessToken: string): Promise<OAuthUserInfo> =>
  getOAuthProviderOrThrow(provider).fetchUserInfo(accessToken);

const validateState = (state: string): ValidatedState | null => oauthProviders.validateState(state);

interface CalendarDestination {
  id: string;
  provider: string;
  email: string | null;
  needsReauthentication: boolean;
}

interface ExistingAccount {
  id: string;
  userId: string;
  oauthCredentialId: string | null;
  caldavCredentialId: string | null;
}

const findExistingAccount = async (
  provider: string,
  accountId: string,
): Promise<ExistingAccount | undefined> => {
  const [account] = await database
    .select({
      caldavCredentialId: calendarAccountsTable.caldavCredentialId,
      id: calendarAccountsTable.id,
      oauthCredentialId: calendarAccountsTable.oauthCredentialId,
      userId: calendarAccountsTable.userId,
    })
    .from(calendarAccountsTable)
    .where(
      and(
        eq(calendarAccountsTable.provider, provider),
        eq(calendarAccountsTable.accountId, accountId),
      ),
    )
    .limit(FIRST_RESULT_LIMIT);

  return account;
};

const validateAccountOwnership = (
  existingAccount: ExistingAccount | undefined,
  userId: string,
): void => {
  if (existingAccount && existingAccount.userId !== userId) {
    throw new Error("This account is already linked to another user");
  }
};

const initializeSyncStatus = async (calendarId: string): Promise<void> => {
  await database.insert(syncStatusTable).values({ calendarId }).onConflictDoNothing();
};

const setupNewDestination = async (calendarId: string): Promise<void> => {
  await initializeSyncStatus(calendarId);
};

interface AccountInsertData {
  userId: string;
  provider: string;
  accountId: string;
  email: string | null;
  oauthCredentialId?: string;
  caldavCredentialId?: string;
  needsReauthentication?: boolean;
}

const upsertAccountAndCalendar = async (data: AccountInsertData): Promise<string | undefined> => {
  const { oauthCredentialId, caldavCredentialId, needsReauthentication, ...base } = data;

  const setClause: Record<string, unknown> = { email: base.email };

  if (oauthCredentialId) {
    setClause.oauthCredentialId = oauthCredentialId;
    setClause.needsReauthentication = needsReauthentication ?? false;
  }
  if (caldavCredentialId) {
    setClause.caldavCredentialId = caldavCredentialId;
  }

  let authType = "caldav";
  if (oauthCredentialId) {
    authType = "oauth";
  }

  const [account] = await database
    .insert(calendarAccountsTable)
    .values({
      accountId: base.accountId,
      authType,
      caldavCredentialId,
      email: base.email,
      needsReauthentication,
      oauthCredentialId,
      provider: base.provider,
      userId: base.userId,
    })
    .onConflictDoUpdate({
      set: setClause,
      target: [calendarAccountsTable.provider, calendarAccountsTable.accountId],
    })
    .returning({ id: calendarAccountsTable.id });

  if (!account) {
    return;
  }

  const [existingCalendar] = await database
    .select({ id: calendarsTable.id })
    .from(calendarsTable)
    .where(
      and(
        eq(calendarsTable.accountId, account.id),
        inArray(calendarsTable.id,
          database.selectDistinct({ id: sourceDestinationMappingsTable.destinationCalendarId })
            .from(sourceDestinationMappingsTable)
        ),
      ),
    )
    .limit(FIRST_RESULT_LIMIT);

  if (existingCalendar) {
    return existingCalendar.id;
  }

  const [calendar] = await database
    .insert(calendarsTable)
    .values({
      accountId: account.id,
      calendarType: authType,
      capabilities: ["pull", "push"],
      name: `${base.provider} destination`,
      userId: base.userId,
    })
    .returning({ id: calendarsTable.id });

  return calendar?.id;
};

const saveCalendarDestination = async (
  userId: string,
  provider: string,
  accountId: string,
  email: string | null,
  accessToken: string,
  refreshToken: string,
  expiresAt: Date,
  needsReauthentication = false,
): Promise<void> => {
  const existingAccount = await findExistingAccount(provider, accountId);
  validateAccountOwnership(existingAccount, userId);

  if (existingAccount?.oauthCredentialId) {
    await database
      .update(oauthCredentialsTable)
      .set({ accessToken, expiresAt, refreshToken })
      .where(eq(oauthCredentialsTable.id, existingAccount.oauthCredentialId));

    await database
      .update(calendarAccountsTable)
      .set({ email, needsReauthentication })
      .where(eq(calendarAccountsTable.id, existingAccount.id));

    const [existingCalendar] = await database
      .select({ id: calendarsTable.id })
      .from(calendarsTable)
      .where(
        and(
          eq(calendarsTable.accountId, existingAccount.id),
          inArray(calendarsTable.id,
            database.selectDistinct({ id: sourceDestinationMappingsTable.destinationCalendarId })
              .from(sourceDestinationMappingsTable)
          ),
        ),
      )
      .limit(FIRST_RESULT_LIMIT);

    if (existingCalendar) {
      await initializeSyncStatus(existingCalendar.id);
    }
    return;
  }

  const [credential] = await database
    .insert(oauthCredentialsTable)
    .values({ accessToken, email, expiresAt, provider, refreshToken, userId })
    .returning({ id: oauthCredentialsTable.id });

  if (!credential) {
    throw new Error("Failed to create OAuth credentials");
  }

  const calendarId = await upsertAccountAndCalendar({
    accountId,
    email,
    needsReauthentication,
    oauthCredentialId: credential.id,
    provider,
    userId,
  });

  if (calendarId) {
    await setupNewDestination(calendarId);
  }
};

const listCalendarDestinations = async (userId: string): Promise<CalendarDestination[]> => {
  const accounts = await database
    .select({
      email: calendarAccountsTable.email,
      id: calendarAccountsTable.id,
      needsReauthentication: calendarAccountsTable.needsReauthentication,
      provider: calendarAccountsTable.provider,
    })
    .from(calendarAccountsTable)
    .innerJoin(calendarsTable, eq(calendarsTable.accountId, calendarAccountsTable.id))
    .where(
      and(
        eq(calendarAccountsTable.userId, userId),
        inArray(calendarsTable.id,
          database.selectDistinct({ id: sourceDestinationMappingsTable.destinationCalendarId })
            .from(sourceDestinationMappingsTable)
        ),
      ),
    );

  return accounts;
};

const deleteCalendarDestination = async (
  userId: string,
  accountId: string,
): Promise<boolean> => {
  const result = await database
    .delete(calendarAccountsTable)
    .where(
      and(
        eq(calendarAccountsTable.userId, userId),
        eq(calendarAccountsTable.id, accountId),
      ),
    )
    .returning({ id: calendarAccountsTable.id });

  return result.length > EMPTY_RESULT_COUNT;
};

const getAccountExternalId = async (accountId: string): Promise<string | null> => {
  const [account] = await database
    .select({ accountId: calendarAccountsTable.accountId })
    .from(calendarAccountsTable)
    .where(eq(calendarAccountsTable.id, accountId))
    .limit(FIRST_RESULT_LIMIT);

  if (account?.accountId) {
    return account.accountId;
  }
  return null;
};

const saveCalDAVDestination = async (
  userId: string,
  provider: string,
  accountId: string,
  email: string,
  serverUrl: string,
  calendarUrl: string,
  username: string,
  encryptedPassword: string,
): Promise<void> => {
  const existingAccount = await findExistingAccount(provider, accountId);
  validateAccountOwnership(existingAccount, userId);

  if (existingAccount?.caldavCredentialId) {
    await database
      .update(caldavCredentialsTable)
      .set({ encryptedPassword, serverUrl, username })
      .where(eq(caldavCredentialsTable.id, existingAccount.caldavCredentialId));

    await database
      .update(calendarAccountsTable)
      .set({ email })
      .where(eq(calendarAccountsTable.id, existingAccount.id));

    const [existingCalendar] = await database
      .select({ id: calendarsTable.id })
      .from(calendarsTable)
      .where(
        and(
          eq(calendarsTable.accountId, existingAccount.id),
          inArray(calendarsTable.id,
            database.selectDistinct({ id: sourceDestinationMappingsTable.destinationCalendarId })
              .from(sourceDestinationMappingsTable)
          ),
        ),
      )
      .limit(FIRST_RESULT_LIMIT);

    if (existingCalendar) {
      await database
        .update(calendarsTable)
        .set({ calendarUrl })
        .where(eq(calendarsTable.id, existingCalendar.id));
      await initializeSyncStatus(existingCalendar.id);
    }
    return;
  }

  const [credential] = await database
    .insert(caldavCredentialsTable)
    .values({ encryptedPassword, serverUrl, username })
    .returning({ id: caldavCredentialsTable.id });

  if (!credential) {
    throw new Error("Failed to create CalDAV credentials");
  }

  const [account] = await database
    .insert(calendarAccountsTable)
    .values({
      accountId,
      authType: "caldav",
      caldavCredentialId: credential.id,
      email,
      provider,
      userId,
    })
    .returning({ id: calendarAccountsTable.id });

  if (!account) {
    throw new Error("Failed to create calendar account");
  }

  const [calendar] = await database
    .insert(calendarsTable)
    .values({
      accountId: account.id,
      calendarType: "caldav",
      capabilities: ["pull", "push"],
      calendarUrl,
      name: `${provider} destination`,
      userId,
    })
    .returning({ id: calendarsTable.id });

  if (calendar) {
    await setupNewDestination(calendar.id);
  }
};

export {
  isOAuthProvider,
  hasRequiredScopes,
  getAuthorizationUrl,
  exchangeCodeForTokens,
  fetchUserInfo,
  validateState,
  saveCalendarDestination,
  listCalendarDestinations,
  deleteCalendarDestination,
  getAccountExternalId as getDestinationAccountId,
  saveCalDAVDestination,
};
