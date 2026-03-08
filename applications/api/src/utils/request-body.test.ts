import { describe, expect, it } from "bun:test";
import { type } from "arktype";
import {
  calendarIdsBodySchema,
  sourcePatchBodySchema,
  icalSettingsPatchBodySchema,
} from "./request-body";

describe("calendarIdsBodySchema", () => {
  it("accepts valid calendarIds array", () => {
    const result = calendarIdsBodySchema({ calendarIds: ["id-1", "id-2"] });
    expect(result instanceof type.errors).toBe(false);
  });

  it("rejects missing calendarIds", () => {
    const result = calendarIdsBodySchema({});
    expect(result instanceof type.errors).toBe(true);
  });

  it("rejects non-string array elements", () => {
    const result = calendarIdsBodySchema({ calendarIds: [123] });
    expect(result instanceof type.errors).toBe(true);
  });

  it("rejects extra properties", () => {
    const result = calendarIdsBodySchema({ calendarIds: ["id-1"], extra: true });
    expect(result instanceof type.errors).toBe(true);
  });
});

describe("sourcePatchBodySchema", () => {
  it("accepts valid partial source update", () => {
    const result = sourcePatchBodySchema({ name: "New Name" });
    expect(result instanceof type.errors).toBe(false);
  });

  it("accepts empty object (all fields optional)", () => {
    const result = sourcePatchBodySchema({});
    expect(result instanceof type.errors).toBe(false);
  });

  it("accepts boolean exclude fields", () => {
    const result = sourcePatchBodySchema({
      excludeAllDayEvents: true,
      excludeEventDescription: false,
    });
    expect(result instanceof type.errors).toBe(false);
  });

  it("rejects extra properties", () => {
    const result = sourcePatchBodySchema({ name: "ok", hacker: true });
    expect(result instanceof type.errors).toBe(true);
  });

  it("rejects wrong types", () => {
    const result = sourcePatchBodySchema({ name: 123 });
    expect(result instanceof type.errors).toBe(true);
  });
});

describe("icalSettingsPatchBodySchema", () => {
  it("accepts valid ical settings", () => {
    const result = icalSettingsPatchBodySchema({
      includeEventName: true,
      customEventName: "Busy",
    });
    expect(result instanceof type.errors).toBe(false);
  });

  it("rejects extra properties", () => {
    const result = icalSettingsPatchBodySchema({ foo: "bar" });
    expect(result instanceof type.errors).toBe(true);
  });
});

