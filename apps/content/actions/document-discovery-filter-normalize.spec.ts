import { describe, expect, it } from "vitest";

import {
  normalizedIdFilter,
  normalizedParentIdFilter,
  normalizedTitleFilter,
} from "./_document-discovery-query.js";

// Some models cannot leave optional tool parameters unset and fill them with
// placeholder values instead (observed live: spaceId "," / "all", exactTitle
// "."). These placeholders must read as "no filter" — otherwise discovery
// silently matches nothing and the agent reports the content as missing.
describe("normalizedIdFilter", () => {
  it("passes real ids through untouched", () => {
    expect(
      normalizedIdFilter("content_space_personal_1a25542218abf5240a1cc9a29c"),
    ).toBe("content_space_personal_1a25542218abf5240a1cc9a29c");
    expect(normalizedIdFilter("H0No6LH5EtgV")).toBe("H0No6LH5EtgV");
  });

  it("trims surrounding whitespace from real ids", () => {
    expect(normalizedIdFilter("  H0No6LH5EtgV ")).toBe("H0No6LH5EtgV");
  });

  it("collapses placeholder sentinels to undefined", () => {
    for (const junk of [
      "",
      " ",
      ".",
      ",",
      "*",
      "-",
      "all",
      "ALL",
      "any",
      "none",
      "null",
      "undefined",
      "N/A",
    ]) {
      expect(normalizedIdFilter(junk)).toBeUndefined();
    }
  });

  it("keeps undefined as undefined", () => {
    expect(normalizedIdFilter(undefined)).toBeUndefined();
  });
});

describe("normalizedTitleFilter", () => {
  it("passes real titles through, including sentinel-looking words", () => {
    expect(normalizedTitleFilter("Q4 Campaign Brief")).toBe(
      "Q4 Campaign Brief",
    );
    // Titles are free-form user text: a page may genuinely be named like a
    // sentinel word, so only bare punctuation is treated as a placeholder.
    expect(normalizedTitleFilter("null")).toBe("null");
    expect(normalizedTitleFilter("N/A")).toBe("N/A");
    expect(normalizedTitleFilter("all")).toBe("all");
  });

  it("collapses empty and bare-punctuation values to undefined", () => {
    for (const junk of ["", " ", ".", ",", "*", "-"]) {
      expect(normalizedTitleFilter(junk)).toBeUndefined();
    }
  });
});

describe("normalizedParentIdFilter", () => {
  it("keeps null (documented roots-only filter) intact", () => {
    expect(normalizedParentIdFilter(null)).toBeNull();
  });

  it("keeps undefined as undefined", () => {
    expect(normalizedParentIdFilter(undefined)).toBeUndefined();
  });

  it("passes real parent ids through", () => {
    expect(normalizedParentIdFilter("H0No6LH5EtgV")).toBe("H0No6LH5EtgV");
  });

  it("collapses placeholder strings to undefined, never to null", () => {
    // Junk must become "no filter" — turning it into null would silently
    // restrict results to top-level documents.
    for (const junk of ["", ".", ",", "all", "any", "none", "null"]) {
      expect(normalizedParentIdFilter(junk)).toBeUndefined();
    }
  });
});
