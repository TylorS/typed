import { readFileSync, readdirSync } from "node:fs";
import type { CollectionEntry } from "astro:content";
import { describe, expect, it } from "vitest";
import {
  adjacentLinks,
  learningGroups,
  type NavigationGroup,
} from "../Guides.js";
import { recipeNavigationGroups } from "../Recipes.js";
import {
  orderCounterLessons,
  orderTutorialSteps,
} from "../../tutorial/Routes.js";

function collection<C extends "guides" | "learn" | "tutorial" | "recipes">(
  name: C,
): CollectionEntry<C>[] {
  const directory = new URL(`../../../content/${name}/`, import.meta.url);
  return readdirSync(directory)
    .filter((name) => name.endsWith(".md"))
    .map((file) => {
      const body = readFileSync(new URL(file, directory), "utf8");
      const frontmatter = body.split("---")[1]!;
      const data = Object.fromEntries(
        [...frontmatter.matchAll(/^([\w-]+):\s*(.+)$/gm)].map(
          ([, key, value]) => [
            key,
            key === "order" ? Number(value) : value!.replace(/^"|"$/g, ""),
          ],
        ),
      );
      return {
        id: file.slice(0, -3),
        collection: name,
        data,
        body,
      } as CollectionEntry<C>;
    });
}
const guides = collection("guides");
const lessons = collection("learn");
const tutorial = collection("tutorial");
const groups = learningGroups(guides, lessons, tutorial);

function assertNeighbors(groups: ReadonlyArray<NavigationGroup>) {
  const entries = groups.flatMap(({ entries }) => entries);
  expect(new Set(entries.map(({ id }) => id)).size).toBe(entries.length);
  entries.forEach((entry, index) => {
    const navigation = adjacentLinks(entry.id, groups);
    expect(navigation.previous, entry.id).toEqual(entries[index - 1]);
    expect(navigation.next, entry.id).toEqual(entries[index + 1]);
  });
}

describe("one visible curriculum for sidebar and previous/next links", () => {
  it("keeps every guide exactly once and traverses the visible order in both directions", () => {
    const ids = groups.flatMap(({ entries }) => entries.map(({ id }) => id));
    for (const guide of guides)
      expect(ids.filter((id) => id === guide.id)).toHaveLength(1);
    assertNeighbors(groups);
  });

  it("starts with cooperation and Quick Start, then exposes the counter continuation", () => {
    expect(groups[0]!.entries.map(({ id }) => id)).toEqual([
      "cooperative-by-design",
      "quick-start",
    ]);
    expect(adjacentLinks("quick-start", groups).next?.href).toBe(
      "/explore/counter/component-lifetime",
    );
    expect(groups[1]!.entries.map(({ href }) => href)).toEqual(
      orderCounterLessons(lessons).map(
        ({ data }) => `/explore/counter/${data.id}`,
      ),
    );
    expect(adjacentLinks("counter/hydrate-state", groups).next?.href).toBe(
      "/explore/tutorial",
    );
  });

  it("shows every Todo chapter in snapshot order with an intro and onward continuation", () => {
    const todo = groups.find(({ title }) => title === "Build TodoMVC")!;
    expect(todo.entries.map(({ id }) => id)).toEqual([
      "tutorial",
      ...orderTutorialSteps(tutorial).map(
        ({ data }) => `tutorial/${data.slug}`,
      ),
    ]);
    expect(adjacentLinks(todo.entries[1]!.id, groups).previous?.href).toBe(
      "/explore/tutorial",
    );
    expect(adjacentLinks(todo.entries.at(-1)!.id, groups).next?.href).toBe(
      "/explore/ui",
    );
  });

  it("uses the same group order for integrations including family boundaries", () => {
    const integrations = recipeNavigationGroups(collection("recipes"));
    assertNeighbors(integrations);
    expect(adjacentLinks("integrate/dom-output", integrations).next?.href).toBe(
      "/integrate/react",
    );
    expect(
      adjacentLinks("integrate/web-component", integrations).next?.href,
    ).toBe("/integrate/fetch-schema");
  });

  it("ignores collection enumeration order while propagating edited lesson labels", () => {
    expect(
      learningGroups(
        guides.toReversed(),
        lessons.toReversed(),
        tutorial.toReversed(),
      ),
    ).toEqual(groups);
    const renamed = guides.map((guide) =>
      guide.id === "cooperative-by-design"
        ? {
            ...guide,
            data: { ...guide.data, title: "Updated cooperation title" },
          }
        : guide,
    );
    const reordered = learningGroups(renamed, lessons, tutorial);
    expect(adjacentLinks("quick-start", reordered).previous?.title).toBe(
      "Updated cooperation title",
    );
  });
});
