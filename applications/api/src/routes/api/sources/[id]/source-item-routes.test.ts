import { describe, expect, it } from "bun:test";
import {
  handleDeleteSourceRoute,
  handlePatchSourceRoute,
} from "./source-item-routes";

const readJson = (response: Response): Promise<unknown> => response.json();

describe("handlePatchSourceRoute", () => {
  it("returns 400 when id param is missing", async () => {
    const response = await handlePatchSourceRoute(
      { body: {}, params: {}, userId: "user-1" },
      {
        reportError: Boolean,
        triggerDestinationSync: Boolean,
        updateSource: () => Promise.resolve(null),
      },
    );

    expect(response.status).toBe(400);
  });

  it("returns 400 when no valid fields are provided", async () => {
    const response = await handlePatchSourceRoute(
      { body: { unknown: true }, params: { id: "source-1" }, userId: "user-1" },
      {
        reportError: Boolean,
        triggerDestinationSync: Boolean,
        updateSource: () => Promise.resolve(null),
      },
    );

    expect(response.status).toBe(400);
  });

  it("returns 404 when source update target is missing", async () => {
    const response = await handlePatchSourceRoute(
      {
        body: { name: "Updated Name" },
        params: { id: "source-1" },
        userId: "user-1",
      },
      {
        reportError: Boolean,
        triggerDestinationSync: Boolean,
        updateSource: () => Promise.resolve(null),
      },
    );

    expect(response.status).toBe(404);
  });

  it("does not fail when post-update destination sync trigger throws", async () => {
    const errors: unknown[] = [];

    const response = await handlePatchSourceRoute(
      {
        body: { name: "Updated Name" },
        params: { id: "source-1" },
        userId: "user-1",
      },
      {
        reportError: (error) => {
          errors.push(error);
        },
        triggerDestinationSync: () => {
          throw new Error("trigger failed");
        },
        updateSource: (_userId, _sourceId, updates) => Promise.resolve({
          id: "source-1",
          ...updates,
        }),
      },
    );

    expect(response.status).toBe(200);
    expect(errors).toHaveLength(1);
  });
});

describe("handleDeleteSourceRoute", () => {
  it("returns 400 when source type is unknown", async () => {
    const response = await handleDeleteSourceRoute(
      { params: { id: "source-1" }, userId: "user-1" },
      {
        deleteSourceByType: {
          ical: () => Promise.resolve(true),
        },
        getSourceCalendarType: () => Promise.resolve("oauth"),
      },
    );

    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({ error: "Unknown source type" });
  });

  it("returns 404 when deleter reports no deletion", async () => {
    const response = await handleDeleteSourceRoute(
      { params: { id: "source-1" }, userId: "user-1" },
      {
        deleteSourceByType: {
          oauth: () => Promise.resolve(false),
        },
        getSourceCalendarType: () => Promise.resolve("oauth"),
      },
    );

    expect(response.status).toBe(404);
  });

  it("returns success when deleter reports deletion", async () => {
    const response = await handleDeleteSourceRoute(
      { params: { id: "source-1" }, userId: "user-1" },
      {
        deleteSourceByType: {
          ical: () => Promise.resolve(true),
        },
        getSourceCalendarType: () => Promise.resolve("ical"),
      },
    );

    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({ success: true });
  });
});
