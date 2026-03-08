import { access, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { FixtureManifest, FixtureSource } from "./schema";

const DEFAULT_FIXTURE_DIRECTORY_SEGMENT = "ics";

interface FixtureDirectoryOptions {
  fixtureDirectory?: string;
}

interface SyncFixtureFilesOptions extends FixtureDirectoryOptions {
  fetchImplementation?: typeof fetch;
  forceRefresh?: boolean;
  includeDisabled?: boolean;
}

interface SyncedFixture {
  downloaded: boolean;
  id: string;
  path: string;
}

interface MissingFixture {
  id: string;
  path: string;
}

const getFixturesPackageDirectory = (): string =>
  fileURLToPath(new URL("..", import.meta.url));

const getDefaultFixtureDirectory = (): string =>
  join(getFixturesPackageDirectory(), DEFAULT_FIXTURE_DIRECTORY_SEGMENT);

const getFixtureDirectory = (options: FixtureDirectoryOptions = {}): string =>
  options.fixtureDirectory
  ?? process.env.KEEPER_ICS_FIXTURE_DIR
  ?? getDefaultFixtureDirectory();

const getFixtureFileName = (fixtureSource: FixtureSource): string =>
  fixtureSource.fileName;

const getFixturePath = (
  fixtureSource: FixtureSource,
  options: FixtureDirectoryOptions = {},
): string => join(getFixtureDirectory(options), getFixtureFileName(fixtureSource));

const pathExists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const getEnabledFixtures = (manifest: FixtureManifest, includeDisabled?: boolean): FixtureManifest => {
  if (includeDisabled) {
    return manifest;
  }
  return manifest.filter((fixtureSource) => fixtureSource.enabled !== false);
};

const syncFixtureFiles = async (
  fixtureManifest: FixtureManifest,
  options: SyncFixtureFilesOptions = {},
): Promise<SyncedFixture[]> => {
  const fixtureDirectory = getFixtureDirectory({ fixtureDirectory: options.fixtureDirectory });
  await mkdir(fixtureDirectory, { recursive: true });

  const fetchImplementation = options.fetchImplementation ?? fetch;
  const enabledFixtures = getEnabledFixtures(fixtureManifest, options.includeDisabled);

  const syncedFixtures: SyncedFixture[] = [];

  for (const fixtureSource of enabledFixtures) {
    const fixturePath = getFixturePath(fixtureSource, { fixtureDirectory });
    const fixtureExists = await pathExists(fixturePath);
    const shouldDownload = options.forceRefresh === true || !fixtureExists;

    if (!shouldDownload) {
      syncedFixtures.push({
        downloaded: false,
        id: fixtureSource.id,
        path: fixturePath,
      });
      continue;
    }

    if (!fixtureSource.sourceUrl) {
      throw new Error(
        `Fixture ${fixtureSource.id} is missing sourceUrl and cannot be downloaded`,
      );
    }

    const response = await fetchImplementation(fixtureSource.sourceUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to download fixture ${fixtureSource.id}: ${response.status} ${response.statusText}`,
      );
    }

    const fixtureContent = await response.text();
    await writeFile(fixturePath, fixtureContent, "utf8");

    syncedFixtures.push({
      downloaded: true,
      id: fixtureSource.id,
      path: fixturePath,
    });
  }

  return syncedFixtures;
};

const findMissingFixtures = async (
  fixtureManifest: FixtureManifest,
  options: FixtureDirectoryOptions = {},
): Promise<MissingFixture[]> => {
  const fixtureDirectory = getFixtureDirectory({ fixtureDirectory: options.fixtureDirectory });
  const missingFixtures: MissingFixture[] = [];

  for (const fixtureSource of fixtureManifest) {
    if (fixtureSource.enabled === false) {
      continue;
    }

    const fixturePath = getFixturePath(fixtureSource, { fixtureDirectory });
    const fixtureExists = await pathExists(fixturePath);
    if (!fixtureExists) {
      missingFixtures.push({
        id: fixtureSource.id,
        path: fixturePath,
      });
    }
  }

  return missingFixtures;
};

export {
  findMissingFixtures,
  getDefaultFixtureDirectory,
  getFixtureDirectory,
  getFixtureFileName,
  getFixturePath,
  syncFixtureFiles,
};
export type {
  FixtureDirectoryOptions,
  MissingFixture,
  SyncFixtureFilesOptions,
  SyncedFixture,
};
