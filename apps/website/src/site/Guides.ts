import type { CollectionEntry } from "astro:content";
import {
  counterLessonPath,
  orderCounterLessons,
  orderTutorialSteps,
} from "../tutorial/Routes.js";

const sections = [
  "Learning paths",
  "Fx",
  "State",
  "Async data",
  "Template authoring",
  "Template bindings",
  "Template rendering",
  "Template internals",
  "UI",
  "UI / Foundations",
  "UI / Forms",
  "UI / Collections",
  "UI / Overlays",
  "Routing",
  "Applications",
  "Integration",
];

export function groupGuides(guides: ReadonlyArray<CollectionEntry<"guides">>) {
  const groups = Map.groupBy(
    guides.toSorted(
      (a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id),
    ),
    (entry) => entry.data.section,
  );
  const rank = (section: string) => {
    const index = sections.indexOf(section);
    return index === -1 ? sections.length : index;
  };
  return [...groups].sort(
    ([a], [b]) => rank(a) - rank(b) || a.localeCompare(b),
  );
}

/** Public UI modules share their dedicated lesson across root and index re-exports. */
export function uiGuidePath(specifier: string): string | undefined {
  if (specifier === "@typed/ui" || specifier === "@typed/ui/index")
    return "/explore/ui";
  if (!specifier.startsWith("@typed/ui/")) return undefined;
  const module = specifier.slice("@typed/ui/".length);
  if (module === "Dom" || module.startsWith("Dom/")) return "/explore/ui-dom";
  const slug = module.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  return `/explore/ui-${slug}`;
}

export interface GuideLink {
  readonly href: string;
  readonly title: string;
}

export interface NavigationEntry extends GuideLink {
  readonly id: string;
}

export interface NavigationGroup {
  readonly title: string;
  readonly entries: ReadonlyArray<NavigationEntry>;
}

/** The sidebar and article continuation share this exact curriculum. */
export function learningGroups(
  guides: ReadonlyArray<CollectionEntry<"guides">>,
  lessons: ReadonlyArray<CollectionEntry<"learn">>,
  tutorial: ReadonlyArray<CollectionEntry<"tutorial">>,
): ReadonlyArray<NavigationGroup> {
  const guide = (id: string): NavigationEntry => {
    const entry = guides.find((entry) => entry.id === id);
    if (!entry) throw new Error(`Missing guide: ${id}`);
    return { id, href: `/explore/${id}`, title: entry.data.title };
  };
  const starters = [
    guide("cooperative-by-design"),
    { id: "quick-start", href: "/explore/quick-start", title: "Quick Start" },
  ];
  const toolkit = [
    guide("ui"),
    { id: "storybook", href: "/explore/storybook", title: "UI Storybook" },
    guide("fx-operator-atlas"),
  ];
  const featured = new Set([...starters, ...toolkit].map(({ id }) => id));
  return [
    { title: "Start building", entries: starters },
    {
      title: "Beyond Quick Start",
      entries: orderCounterLessons(lessons).map(({ data }) => ({
        id: `counter/${data.id}`,
        href: counterLessonPath(data.id),
        title: data.title,
      })),
    },
    {
      title: "Build TodoMVC",
      entries: [
        {
          id: "tutorial",
          href: "/explore/tutorial",
          title: "Build a Todo app",
        },
        ...orderTutorialSteps(tutorial).map(({ data }) => ({
          id: `tutorial/${data.slug}`,
          href: `/explore/tutorial/${data.slug}`,
          title: data.title,
        })),
      ],
    },
    { title: "Explore the toolkit", entries: toolkit },
    ...groupGuides(guides)
      .map(([title, entries]) => ({
        title,
        entries: entries
          .filter(({ id }) => !featured.has(id))
          .map(({ id }) => guide(id)),
      }))
      .filter(({ entries }) => entries.length > 0),
  ];
}

/** Crossing a section boundary follows the next visible section, without loops. */
export function adjacentLinks(
  id: string,
  groups: ReadonlyArray<NavigationGroup>,
): { previous?: GuideLink; next?: GuideLink } {
  const entries = groups.flatMap(({ entries }) => entries);
  const index = entries.findIndex((entry) => entry.id === id);
  if (index === -1) return {};
  return { previous: entries[index - 1], next: entries[index + 1] };
}
