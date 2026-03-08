import { describe, expect, it } from "bun:test";
import { createSyncEventContentHash } from "./content-hash";

describe("createSyncEventContentHash", () => {
  it("returns a consistent hash for the same content", () => {
    const event = { summary: "Meeting", description: "Notes", location: "Room A" };

    const hash1 = createSyncEventContentHash(event);
    const hash2 = createSyncEventContentHash(event);

    expect(hash1).toBe(hash2);
  });

  it("returns different hashes for different summaries", () => {
    const hash1 = createSyncEventContentHash({ summary: "Meeting A" });
    const hash2 = createSyncEventContentHash({ summary: "Meeting B" });

    expect(hash1).not.toBe(hash2);
  });

  it("returns different hashes for different descriptions", () => {
    const hash1 = createSyncEventContentHash({ summary: "Same", description: "Desc A" });
    const hash2 = createSyncEventContentHash({ summary: "Same", description: "Desc B" });

    expect(hash1).not.toBe(hash2);
  });

  it("returns different hashes for different locations", () => {
    const hash1 = createSyncEventContentHash({ summary: "Same", location: "Room A" });
    const hash2 = createSyncEventContentHash({ summary: "Same", location: "Room B" });

    expect(hash1).not.toBe(hash2);
  });

  it("normalizes whitespace in content fields", () => {
    const hash1 = createSyncEventContentHash({ summary: "  Meeting  " });
    const hash2 = createSyncEventContentHash({ summary: "Meeting" });

    expect(hash1).toBe(hash2);
  });

  it("treats missing and whitespace-only description as equivalent", () => {
    const hash1 = createSyncEventContentHash({ summary: "Test" });
    const hash2 = createSyncEventContentHash({ summary: "Test", description: "   " });

    expect(hash1).toBe(hash2);
  });

  it("returns a 64-character hex string", () => {
    const hash = createSyncEventContentHash({ summary: "Test" });

    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });
});
