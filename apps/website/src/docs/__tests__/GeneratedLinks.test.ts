import { describe, expect, it } from "vitest";
import { generatedManifest } from "../../generated/manifest.js";
import { searchArtifact } from "../../generated/search.js";
import { referenceIdFromRouteSlug } from "../Reference.js";

describe("generated documentation links", () => {
  it("uses deploy-safe canonical paths for every symbol", () => {
    const many = searchArtifact.entries.find(({ id }) => id === "@typed/template/many#many");

    expect(many?.href).toBe("/reference/symbols/QHR5cGVkL3RlbXBsYXRlL21hbnkjbWFueQ");
    expect(
      searchArtifact.entries
        .filter(({ kind }) => kind === "exposure" || kind === "resource")
        .every(({ href }) => /^\/reference\/symbols\/[A-Za-z0-9_-]+$/u.test(href)),
    ).toBe(true);
    expect(
      generatedManifest.routes
        .filter(({ kind }) => kind === "exposure")
        .every(({ canonicalPath }) =>
          /^\/reference\/symbols\/[A-Za-z0-9_-]+$/u.test(canonicalPath),
        ),
    ).toBe(true);
    expect(
      generatedManifest.routes
        .filter(({ kind }) => kind === "exposure")
        .every(({ canonicalPath }) => canonicalPath.split("/").at(-1)!.length <= 100),
    ).toBe(true);

    const slug = many?.href.split("/").at(-1);
    expect(slug === undefined ? undefined : referenceIdFromRouteSlug(slug)).toBe(
      "@typed/template/many#many",
    );
  });

  it("publishes searchable Quick Start and TodoMVC milestones", () => {
    expect(searchArtifact.entries.find(({ id }) => id === "curriculum:quick-start")?.href).toBe(
      "/explore/quick-start",
    );
    expect(
      searchArtifact.entries.find(({ id }) => id === "curriculum:tutorial:persist-the-list")?.href,
    ).toBe("/explore/tutorial/persist-the-list");
  });
});
