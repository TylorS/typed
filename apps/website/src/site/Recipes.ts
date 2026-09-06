import type { CollectionEntry } from "astro:content";
import type { NavigationGroup } from "./Guides.js";

const families = [
  {
    title: "Render pages and applications",
    description:
      "Choose where rendering starts, how HTML reaches the browser, and what owns updates.",
    slugs: ["vite", "astro", "html-output", "dom-output"],
  },
  {
    title: "Share a page with another framework",
    description:
      "Connect Typed to an existing component lifecycle without giving two renderers the same subtree.",
    slugs: ["react", "vue", "svelte", "web-component"],
  },
  {
    title: "Connect browser and network APIs",
    description:
      "Turn requests, messages, and observations into typed programs with explicit cleanup.",
    slugs: [
      "fetch-schema",
      "progressive-forms",
      "websocket",
      "web-workers",
      "resize-observer",
    ],
  },
] as const;

export function groupRecipes(
  recipes: ReadonlyArray<CollectionEntry<"recipes">>,
) {
  const bySlug = new Map(recipes.map((entry) => [entry.data.slug, entry]));
  return families.map(({ slugs, ...family }) => ({
    ...family,
    entries: slugs.map((slug) => {
      const entry = bySlug.get(slug);
      if (!entry) throw new Error(`Missing integration lesson: ${slug}`);
      return entry;
    }),
  }));
}

export function recipeNavigationGroups(
  recipes: ReadonlyArray<CollectionEntry<"recipes">>,
): ReadonlyArray<NavigationGroup> {
  return groupRecipes(recipes).map(({ title, entries }) => ({
    title,
    entries: entries.map(({ data }) => ({
      id: `integrate/${data.slug}`,
      href: `/integrate/${data.slug}`,
      title: data.title,
    })),
  }));
}
