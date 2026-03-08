import { fixtureManifest } from "../manifest";
import { syncFixtureFiles } from "../cache";

const FORCE_REFRESH_FLAG = "--refresh";
const INCLUDE_DISABLED_FLAG = "--include-disabled";

const hasFlag = (flag: string): boolean => process.argv.includes(flag);

const run = async (): Promise<void> => {
  const syncedFixtures = await syncFixtureFiles(fixtureManifest, {
    forceRefresh: hasFlag(FORCE_REFRESH_FLAG),
    includeDisabled: hasFlag(INCLUDE_DISABLED_FLAG),
  });

  for (const syncedFixture of syncedFixtures) {
    const syncStatus = syncedFixture.downloaded ? "downloaded" : "cached";
    console.log(`${syncedFixture.id}\t${syncStatus}\t${syncedFixture.path}`);
  }

  console.log(`Synced ${syncedFixtures.length} fixture(s).`);
};

await run();
