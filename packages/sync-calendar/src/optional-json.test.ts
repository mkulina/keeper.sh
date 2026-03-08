import { describe, expect, it } from "bun:test";
import { parseOptionalJsonObject } from "./optional-json";

describe("parseOptionalJsonObject", () => {
  it("parses object JSON values", () => {
    expect(parseOptionalJsonObject("{\"enabled\":true}")).toEqual({ enabled: true });
  });

  it("returns null for null input", () => {
    expect(parseOptionalJsonObject(null)).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    expect(parseOptionalJsonObject("{oops")).toBeNull();
  });

  it("returns null for non-object JSON values", () => {
    expect(parseOptionalJsonObject("\"value\"")).toBeNull();
    expect(parseOptionalJsonObject("15")).toBeNull();
    expect(parseOptionalJsonObject("true")).toBeNull();
    expect(parseOptionalJsonObject("null")).toBeNull();
  });
});
