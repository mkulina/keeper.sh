import { fixtureManifest } from "../manifest";
import { findMissingFixtures } from "../cache";

const run = async (): Promise<void> => {
  const missingFixtures = await findMissingFixtures(fixtureManifest);

  if (missingFixtures.length === 0) {
    console.log("All enabled fixtures exist locally.");
    return;
  }

  for (const missingFixture of missingFixtures) {
    console.error(`${missingFixture.id}\tmissing\t${missingFixture.path}`);
  }

  throw new Error(`Missing ${missingFixtures.length} fixture file(s).`);
};

await run();
