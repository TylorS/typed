import type { CollectionEntry } from "astro:content";
import {
  counterLessonPath,
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
  /** Only a deliberate learning sequence supplies Previous/Next links. */
  readonly sequence?: boolean;
}

/** Short learning paths and optional lookup share destinations, not a single course. */
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
  const counter = (id: string): NavigationEntry => {
    const entry = lessons.find((entry) => entry.data.id === id);
    if (!entry) throw new Error(`Missing counter lesson: ${id}`);
    return { id: `counter/${id}`, href: counterLessonPath(id), title: entry.data.title };
  };
  const paths: NavigationGroup[] = [
    {
      title: "Start building",
      sequence: true,
      entries: [
        { id: "quick-start", href: "/explore/quick-start", title: "Quick Start" },
        counter("component-lifetime"),
        { id: "tutorial", href: "/explore/tutorial", title: "Build a Todo app" },
        ...orderTutorialSteps(tutorial).map(({ data }) => ({
          id: `tutorial/${data.slug}`,
          href: `/explore/tutorial/${data.slug}`,
          title: data.title,
        })),
      ],
    },
    {
      title: "Run push-based work",
      sequence: true,
      entries: [
        "fx-push-reactivity", "building-fx", "consuming-fx", "transforming-fx",
        "composing-fx", "fx-higher-order-and-concurrency", "fx-time-and-rate",
        "fx-errors-and-recovery",
      ].map(guide),
    },
    {
      title: "Own and derive state",
      sequence: true,
      entries: [
        "refsubject-renderer-independent-state", "composing-refsubject-state",
        "derived-conditional-and-accumulated-state", "async-data",
        "async-data-requests-and-cache",
      ].map(guide),
    },
    {
      title: "Author a native view",
      sequence: true,
      entries: [
        "render-your-first-template", "authoring-typed-templates",
        "native-events-with-effect", "keyed-template-collections",
      ].map(guide),
    },
    {
      title: "Extend a library",
      sequence: true,
      entries: [
        "library-developers", "sink-writing-effects", "subject-event-publications",
        "fx-dynamic-producers", "fx-services-and-lifetime",
      ].map(guide),
    },
    {
      title: "Optional: server rendering",
      sequence: true,
      entries: [counter("server-html"), counter("hydrate-state")],
    },
    {
      title: "Choose a task or look up an API",
      entries: [
        guide("application-developers"), guide("ui"), guide("id"),
        { id: "storybook", href: "/explore/storybook", title: "UI Storybook" },
        guide("fx-operator-atlas"), guide("cooperative-by-design"),
        counter("client-only"),
      ],
    },
  ];
  const featured = new Set(paths.flatMap(({ entries }) => entries.map(({ id }) => id)));
  return [
    ...paths,
    ...groupGuides(guides)
      .map(([title, entries]) => ({
        title: `Browse: ${title}`,
        entries: entries.filter(({ id }) => !featured.has(id)).map(({ id }) => guide(id)),
      }))
      .filter(({ entries }) => entries.length > 0),
  ];
}

/** Reference pages have no implied next lesson; learning paths end at their boundary. */
export function adjacentLinks(
  id: string,
  groups: ReadonlyArray<NavigationGroup>,
): { previous?: GuideLink; next?: GuideLink } {
  const group = groups.find(({ entries }) => entries.some((entry) => entry.id === id));
  if (!group?.sequence) return {};
  const index = group.entries.findIndex((entry) => entry.id === id);
  return { previous: group.entries[index - 1], next: group.entries[index + 1] };
}
