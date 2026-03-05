import {
  calendarsTable,
  profileCalendarsTable,
  sourceDestinationMappingsTable,
  syncProfilesTable,
  syncStatusTable,
} from "@keeper.sh/database/schema";
import { and, count, eq, inArray } from "drizzle-orm";
import { database } from "../context";

interface SyncProfile {
  id: string;
  name: string;
  sources: string[];
  destinations: string[];
  createdAt: Date;
}

const getUserProfiles = async (userId: string): Promise<SyncProfile[]> => {
  const profiles = await database
    .select()
    .from(syncProfilesTable)
    .where(eq(syncProfilesTable.userId, userId));

  if (profiles.length === 0) return [];

  const profileIds = profiles.map((profile) => profile.id);

  const memberships = await database
    .select({
      calendarId: profileCalendarsTable.calendarId,
      profileId: profileCalendarsTable.profileId,
      role: profileCalendarsTable.role,
    })
    .from(profileCalendarsTable)
    .where(inArray(profileCalendarsTable.profileId, profileIds));

  const profileMembers = new Map<string, { sources: Set<string>; destinations: Set<string> }>();

  for (const membership of memberships) {
    if (!profileMembers.has(membership.profileId)) {
      profileMembers.set(membership.profileId, { sources: new Set(), destinations: new Set() });
    }
    const entry = profileMembers.get(membership.profileId)!;
    if (membership.role === "source") {
      entry.sources.add(membership.calendarId);
    } else {
      entry.destinations.add(membership.calendarId);
    }
  }

  return profiles.map((profile) => {
    const entry = profileMembers.get(profile.id);
    return {
      createdAt: profile.createdAt,
      destinations: entry ? [...entry.destinations] : [],
      id: profile.id,
      name: profile.name,
      sources: entry ? [...entry.sources] : [],
    };
  });
};

const getProfile = async (userId: string, profileId: string): Promise<SyncProfile | undefined> => {
  const [profile] = await database
    .select()
    .from(syncProfilesTable)
    .where(and(eq(syncProfilesTable.id, profileId), eq(syncProfilesTable.userId, userId)))
    .limit(1);

  if (!profile) return undefined;

  const memberships = await database
    .select({
      calendarId: profileCalendarsTable.calendarId,
      role: profileCalendarsTable.role,
    })
    .from(profileCalendarsTable)
    .where(eq(profileCalendarsTable.profileId, profileId));

  const sources: string[] = [];
  const destinations: string[] = [];

  for (const membership of memberships) {
    if (membership.role === "source") {
      sources.push(membership.calendarId);
    } else {
      destinations.push(membership.calendarId);
    }
  }

  return {
    createdAt: profile.createdAt,
    destinations,
    id: profile.id,
    name: profile.name,
    sources,
  };
};

const createProfile = async (userId: string, name: string): Promise<{ id: string }> => {
  const [profile] = await database
    .insert(syncProfilesTable)
    .values({ name, userId })
    .returning({ id: syncProfilesTable.id });

  if (!profile) {
    throw new Error("Failed to create sync profile");
  }

  return profile;
};

const updateProfile = async (userId: string, profileId: string, name: string): Promise<boolean> => {
  const [updated] = await database
    .update(syncProfilesTable)
    .set({ name })
    .where(and(eq(syncProfilesTable.id, profileId), eq(syncProfilesTable.userId, userId)))
    .returning({ id: syncProfilesTable.id });

  return Boolean(updated);
};

const deleteProfile = async (userId: string, profileId: string): Promise<boolean> => {
  const [deleted] = await database
    .delete(syncProfilesTable)
    .where(and(eq(syncProfilesTable.id, profileId), eq(syncProfilesTable.userId, userId)))
    .returning({ id: syncProfilesTable.id });

  return Boolean(deleted);
};

const rebuildMappings = async (profileId: string): Promise<void> => {
  const memberships = await database
    .select({
      calendarId: profileCalendarsTable.calendarId,
      role: profileCalendarsTable.role,
    })
    .from(profileCalendarsTable)
    .where(eq(profileCalendarsTable.profileId, profileId));

  const sourceIds: string[] = [];
  const destinationIds: string[] = [];

  for (const membership of memberships) {
    if (membership.role === "source") {
      sourceIds.push(membership.calendarId);
    } else {
      destinationIds.push(membership.calendarId);
    }
  }

  // Clear existing mappings for this profile
  await database
    .delete(sourceDestinationMappingsTable)
    .where(eq(sourceDestinationMappingsTable.profileId, profileId));

  // Rebuild cross-product
  if (sourceIds.length > 0 && destinationIds.length > 0) {
    const mappings = sourceIds.flatMap((sourceCalendarId) =>
      destinationIds.map((destinationCalendarId) => ({
        destinationCalendarId,
        profileId,
        sourceCalendarId,
      })),
    );

    await database
      .insert(sourceDestinationMappingsTable)
      .values(mappings)
      .onConflictDoNothing();
  }

  // Ensure sync status exists for all destinations
  for (const destinationId of destinationIds) {
    await database
      .insert(syncStatusTable)
      .values({ calendarId: destinationId })
      .onConflictDoNothing();
  }
};

const setProfileSources = async (
  userId: string,
  profileId: string,
  calendarIds: string[],
): Promise<void> => {
  const [profile] = await database
    .select({ id: syncProfilesTable.id })
    .from(syncProfilesTable)
    .where(and(eq(syncProfilesTable.id, profileId), eq(syncProfilesTable.userId, userId)))
    .limit(1);

  if (!profile) throw new Error("Profile not found");

  // Validate calendar ownership
  const validCalendars = calendarIds.length > 0
    ? await database
        .select({ id: calendarsTable.id })
        .from(calendarsTable)
        .where(and(eq(calendarsTable.userId, userId), inArray(calendarsTable.id, calendarIds)))
    : [];

  const validIds = new Set(validCalendars.map((calendar) => calendar.id));
  const filteredIds = calendarIds.filter((id) => validIds.has(id));

  // Clear existing source memberships
  await database
    .delete(profileCalendarsTable)
    .where(
      and(
        eq(profileCalendarsTable.profileId, profileId),
        eq(profileCalendarsTable.role, "source"),
      ),
    );

  // Insert new source memberships
  if (filteredIds.length > 0) {
    await database
      .insert(profileCalendarsTable)
      .values(filteredIds.map((calendarId) => ({ calendarId, profileId, role: "source" })))
      .onConflictDoNothing();
  }

  await rebuildMappings(profileId);
};

const setProfileDestinations = async (
  userId: string,
  profileId: string,
  calendarIds: string[],
): Promise<void> => {
  const [profile] = await database
    .select({ id: syncProfilesTable.id })
    .from(syncProfilesTable)
    .where(and(eq(syncProfilesTable.id, profileId), eq(syncProfilesTable.userId, userId)))
    .limit(1);

  if (!profile) throw new Error("Profile not found");

  // Validate calendar ownership
  const validCalendars = calendarIds.length > 0
    ? await database
        .select({ id: calendarsTable.id })
        .from(calendarsTable)
        .where(and(eq(calendarsTable.userId, userId), inArray(calendarsTable.id, calendarIds)))
    : [];

  const validIds = new Set(validCalendars.map((calendar) => calendar.id));
  const filteredIds = calendarIds.filter((id) => validIds.has(id));

  // Clear existing destination memberships
  await database
    .delete(profileCalendarsTable)
    .where(
      and(
        eq(profileCalendarsTable.profileId, profileId),
        eq(profileCalendarsTable.role, "destination"),
      ),
    );

  // Insert new destination memberships
  if (filteredIds.length > 0) {
    await database
      .insert(profileCalendarsTable)
      .values(filteredIds.map((calendarId) => ({ calendarId, profileId, role: "destination" })))
      .onConflictDoNothing();
  }

  await rebuildMappings(profileId);
};

const ensureDefaultProfile = async (userId: string): Promise<void> => {
  const [existing] = await database
    .select({ id: syncProfilesTable.id })
    .from(syncProfilesTable)
    .where(eq(syncProfilesTable.userId, userId))
    .limit(1);

  if (existing) return;

  await database
    .insert(syncProfilesTable)
    .values({ name: "Default", userId });
};

const getProfileCount = async (userId: string): Promise<number> => {
  const [result] = await database
    .select({ count: count() })
    .from(syncProfilesTable)
    .where(eq(syncProfilesTable.userId, userId));
  return result?.count ?? 0;
};

export {
  ensureDefaultProfile,
  getUserProfiles,
  getProfile,
  getProfileCount,
  createProfile,
  updateProfile,
  deleteProfile,
  setProfileSources,
  setProfileDestinations,
};
