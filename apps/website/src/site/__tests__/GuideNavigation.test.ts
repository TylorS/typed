import { readFileSync, readdirSync } from "node:fs";
import type { CollectionEntry } from "astro:content";
import { describe, expect, it } from "vitest";
import {
  adjacentLinks,
  learningGroups,
} from "../Guides.js";
import { recipeNavigationGroups } from "../Recipes.js";
import {
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

describe("bounded learning paths and optional reference", () => {
  it("makes the ID package guide directly discoverable without adding a required lesson", () => {
    const featured = groups.find(({ title }) => title === "Choose a task or look up an API");
    expect(featured?.entries.find(({ id }) => id === "id")?.href).toBe("/explore/id");
    expect(adjacentLinks("id", groups)).toEqual({});
  });

  it("keeps every destination exactly once and every sequence reciprocal", () => {
    const ids = groups.flatMap(({ entries }) => entries.map(({ id }) => id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const guide of guides) expect(ids).toContain(guide.id);
    for (const group of groups) {
      group.entries.forEach((entry, index) => {
        expect(adjacentLinks(entry.id, groups), entry.id).toEqual(
          group.sequence
            ? { previous: group.entries[index - 1], next: group.entries[index + 1] }
            : {},
        );
      });
    }
  });

  it("reaches TodoMVC without requiring SSR, an atlas or renderer internals", () => {
    const visited = [];
    let id: string | undefined = "quick-start";
    while (id) {
      expect(visited).not.toContain(id);
      visited.push(id);
      id = (adjacentLinks(id, groups).next as { id?: string } | undefined)?.id;
    }
    expect(visited).toContain("counter/component-lifetime");
    expect(visited).toContain("tutorial");
    expect(visited.filter((id) => id.startsWith("tutorial/"))).toEqual(
      orderTutorialSteps(tutorial).map(({ data }) => `tutorial/${data.slug}`),
    );
    expect(visited).not.toContain("counter/server-html");
    expect(visited).not.toContain("fx-operator-atlas");
    expect(visited).not.toContain("render-event-substrate");
  });

  it("ends each optional path and leaves lookup pages without a compulsory next step", () => {
    expect(adjacentLinks("counter/server-html", groups).previous).toBeUndefined();
    expect(adjacentLinks("counter/server-html", groups).next?.href).toBe(
      "/explore/counter/hydrate-state",
    );
    expect(adjacentLinks("counter/hydrate-state", groups).next).toBeUndefined();
    for (const id of ["fx-operator-atlas", "storybook", "ui", "cooperative-by-design", "counter/client-only"])
      expect(adjacentLinks(id, groups)).toEqual({});
  });

  it("runs Fx without a renderer and teaches independent composition before job admission", () => {
    const fx = groups.find(({ entries }) => entries.some(({ id }) => id === "fx-push-reactivity"))!;
    expect(fx.entries.every(({ id }) => !id.includes("template") && !id.includes("counter"))).toBe(true);
    const ids = fx.entries.map(({ id }) => id);
    expect(ids.indexOf("consuming-fx")).toBeLessThan(ids.indexOf("transforming-fx"));
    expect(ids.indexOf("composing-fx")).toBeLessThan(ids.indexOf("fx-higher-order-and-concurrency"));
    expect(adjacentLinks(fx.entries.at(-1)!.id, groups).next).toBeUndefined();
  });

  it("treats integration recipes as independent choices", () => {
    const integrations = recipeNavigationGroups(collection("recipes"));
    for (const { entries } of integrations)
      for (const { id } of entries) expect(adjacentLinks(id, integrations)).toEqual({});
  });

  it("ignores collection enumeration order and uses current source titles", () => {
    expect(learningGroups(guides.toReversed(), lessons.toReversed(), tutorial.toReversed())).toEqual(groups);
    const renamed = guides.map((guide) => guide.id === "building-fx"
      ? { ...guide, data: { ...guide.data, title: "Adapt a source" } } : guide);
    expect(adjacentLinks("fx-push-reactivity", learningGroups(renamed, lessons, tutorial)).next?.title).toBe("Adapt a source");
    expect(adjacentLinks("missing", groups)).toEqual({});
  });
});
